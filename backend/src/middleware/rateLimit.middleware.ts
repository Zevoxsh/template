import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const recordBlock = async (req: Request, route: string) => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  try {
    await prisma.rateLimitBlock.upsert({
      where: { ipAddress_route: { ipAddress: ip, route } },
      update: { attempts: { increment: 1 }, blockedAt: new Date(), unblockedAt: null },
      create: { ipAddress: ip, route, attempts: 1 },
    });
  } catch { /* non-blocking */ }
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    await recordBlock(req, "auth");
    res.status(429).json({ error: "Trop de tentatives. Réessayez dans 15 minutes." });
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
