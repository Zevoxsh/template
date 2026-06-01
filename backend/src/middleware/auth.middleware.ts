import { Response, NextFunction } from "express";
import { verifyAccessToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { AppError } from "./error.middleware";
import { AuthRequest } from "../types";
import { TokenType } from "@prisma/client";
import { config } from "../config";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const accessToken = req.cookies?.access_token as string | undefined;
  const refreshToken = req.cookies?.refresh_token as string | undefined;

  if (!accessToken && !refreshToken) {
    return next(new AppError(401, "Not authenticated"));
  }

  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      const dbUser = await prisma.user.findUnique({ where: { id: payload.sub }, select: { banned: true, bannedReason: true } });
      if (dbUser?.banned) {
        res.clearCookie("access_token", COOKIE_OPTS);
        res.clearCookie("refresh_token", COOKIE_OPTS);
        return next(new AppError(403, `Compte banni : ${dbUser.bannedReason ?? "contactez le support"}`));
      }
      req.user = { id: payload.sub, email: payload.email, role: payload.role as any, name: payload.name };
      return next();
    } catch {
      // access token expired — fall through to refresh
    }
  }

  if (!refreshToken) return next(new AppError(401, "Session expired"));

  try {
    const { sub: userId } = verifyRefreshToken(refreshToken);

    const stored = await prisma.token.findFirst({
      where: { token: refreshToken, type: TokenType.REFRESH, userId },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      res.clearCookie("access_token", COOKIE_OPTS);
      res.clearCookie("refresh_token", COOKIE_OPTS);
      return next(new AppError(401, "Session expired"));
    }

    const newAccessToken = signAccessToken({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      name: stored.user.name,
    });
    const newRefreshToken = signRefreshToken(stored.user.id);

    await prisma.token.delete({ where: { id: stored.id } });
    await prisma.token.create({
      data: {
        userId: stored.user.id,
        type: TokenType.REFRESH,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userAgent: stored.userAgent,
        ipAddress: stored.ipAddress,
        lastUsed: new Date(),
      },
    });

    res.cookie("access_token", newAccessToken, { ...COOKIE_OPTS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie("refresh_token", newRefreshToken, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });

    req.user = {
      id: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      name: stored.user.name,
    };
    next();
  } catch {
    res.clearCookie("access_token", COOKIE_OPTS);
    res.clearCookie("refresh_token", COOKIE_OPTS);
    next(new AppError(401, "Session expired"));
  }
}
