import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/password";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/mail";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../types";
import { TokenType } from "@prisma/client";
import { config } from "../config";

const IS_PROD = config.nodeEnv === "production";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "lax" as const,
  path: "/",
};

async function issueTokens(res: Response, userId: string, email: string, role: string, name: string) {
  const accessToken = signAccessToken({ sub: userId, email, role, name });
  const refreshToken = signRefreshToken(userId);

  await prisma.token.create({
    data: {
      userId,
      type: TokenType.REFRESH,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie("access_token", accessToken, { ...COOKIE_OPTS, maxAge: 24 * 60 * 60 * 1000 });
  res.cookie("refresh_token", refreshToken, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (settings && !settings.registrationEnabled) {
      throw new AppError(403, "Registration is currently disabled");
    }

    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Email already in use");

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    if (settings?.requireEmailVerification) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.token.create({
        data: {
          userId: user.id,
          type: TokenType.EMAIL_VERIFICATION,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await sendVerificationEmail(email, token);
      res.status(201).json({ message: "Account created. Please verify your email." });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
      await issueTokens(res, user.id, user.email, user.role, user.name);
      res.status(201).json({ message: "Account created successfully." });
    }
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, name: true, email: true, role: true, password: true,
        banned: true, bannedReason: true, emailVerified: true,
        twoFactorEnabled: true, twoFactorMethod: true,
      },
    });
    if (!user || !(await comparePassword(password, user.password))) {
      throw new AppError(401, "Invalid email or password");
    }

    if (user.banned) throw new AppError(403, `Account banned: ${user.bannedReason ?? "contact support"}`);

    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (settings?.requireEmailVerification && !user.emailVerified) {
      throw new AppError(403, "Please verify your email before logging in");
    }

    // Check if 2FA is needed
    const needsTwoFactor = user.twoFactorEnabled;
    const settings2fa = needsTwoFactor ? null : await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    const policyRequired = settings2fa?.twoFactorPolicy === "REQUIRED";

    if (needsTwoFactor || policyRequired) {
      const challengeToken = crypto.randomBytes(32).toString("hex");
      await prisma.token.deleteMany({ where: { userId: user.id, type: TokenType.TWO_FACTOR_CHALLENGE } });
      await prisma.token.create({
        data: {
          userId: user.id,
          type: TokenType.TWO_FACTOR_CHALLENGE,
          token: challengeToken,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      return res.json({
        twoFactorRequired: true,
        challengeToken,
        method: user.twoFactorMethod ?? null,
      });
    }

    await issueTokens(res, user.id, user.email, user.role, user.name);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (refreshToken) {
      await prisma.token.deleteMany({ where: { token: refreshToken } });
    }
    res.clearCookie("access_token", COOKIE_OPTS);
    res.clearCookie("refresh_token", COOKIE_OPTS);
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, avatarUrl: true, avatarFlagged: true, createdAt: true },
    });
    if (!user) throw new AppError(404, "User not found");
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query as { token: string };
    if (!token) throw new AppError(400, "Token required");

    const record = await prisma.token.findUnique({ where: { token } });
    if (!record || record.type !== TokenType.EMAIL_VERIFICATION || record.expiresAt < new Date()) {
      throw new AppError(400, "Invalid or expired token");
    }

    await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    await prisma.token.delete({ where: { id: record.id } });

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to prevent user enumeration
    if (user) {
      await prisma.token.deleteMany({ where: { userId: user.id, type: TokenType.PASSWORD_RESET } });
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.token.create({
        data: {
          userId: user.id,
          type: TokenType.PASSWORD_RESET,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      await sendPasswordResetEmail(email, token);
    }

    res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;

    const record = await prisma.token.findUnique({ where: { token } });
    if (!record || record.type !== TokenType.PASSWORD_RESET || record.expiresAt < new Date()) {
      throw new AppError(400, "Invalid or expired token");
    }

    const hashed = await hashPassword(password);
    await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } });
    await prisma.token.delete({ where: { id: record.id } });
    // Invalidate all refresh tokens
    await prisma.token.deleteMany({ where: { userId: record.userId, type: TokenType.REFRESH } });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
}
