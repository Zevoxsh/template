import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/mail";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../types";
import { TokenType } from "@prisma/client";

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [totalUsers, totalAdmins, totalModerators, bannedUsers, unverifiedUsers, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "MODERATOR" } }),
      prisma.user.count({ where: { banned: true } }),
      prisma.user.count({ where: { emailVerified: false } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    res.json({ totalUsers, totalAdmins, totalModerators, bannedUsers, unverifiedUsers, recentUsers });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string) ?? "";
    const role = req.query.role as string | undefined;
    const banned = req.query.banned === "true" ? true : req.query.banned === "false" ? false : undefined;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(role && { role: role as any }),
      ...(banned !== undefined && { banned }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true,
          emailVerified: true, banned: true, bannedReason: true, avatarUrl: true, avatarFlagged: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(req.params.id) },
      select: {
        id: true, name: true, email: true, role: true,
        emailVerified: true, banned: true, bannedReason: true, avatarUrl: true, avatarFlagged: true, createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new AppError(404, "User not found");
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { role, banned, bannedReason, emailVerified } = req.body;

    const targetId = String(req.params.id);
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new AppError(404, "User not found");

    // Prevent admin from demoting themselves
    if (target.id === req.user!.id && role && role !== "ADMIN") {
      throw new AppError(400, "Cannot change your own role");
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(role !== undefined && { role }),
        ...(banned !== undefined && { banned }),
        ...(banned === false && { bannedReason: null }),
        ...(banned === true && bannedReason && { bannedReason }),
        ...(emailVerified !== undefined && { emailVerified }),
      },
      select: {
        id: true, name: true, email: true, role: true,
        emailVerified: true, banned: true, bannedReason: true,
      },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function resetUserAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const targetId = String(req.params.id);
    const current = await prisma.user.findUnique({ where: { id: targetId }, select: { avatarUrl: true } });
    if (!current) throw new AppError(404, "User not found");

    if (current.avatarUrl) {
      const filePath = path.join(process.cwd(), "uploads", "avatars", path.basename(current.avatarUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { avatarUrl: null, avatarFlagged: true },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, banned: true, bannedReason: true, avatarUrl: true, avatarFlagged: true, createdAt: true, updatedAt: true },
    });
    res.json({ user });
  } catch (err) { next(err); }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const targetId = String(req.params.id);
    if (targetId === req.user!.id) throw new AppError(400, "Cannot delete your own account");

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new AppError(404, "User not found");

    await prisma.user.delete({ where: { id: targetId } });
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getSettings(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email) throw new AppError(400, "Name and email are required");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Email already in use");

    if (password) {
      // Admin sets a password directly
      const hashed = await hashPassword(password);
      const user = await prisma.user.create({
        data: { name, email, password: hashed, role: role ?? "USER", emailVerified: true },
        select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
      });
      return res.status(201).json({ user, passwordSet: true });
    }

    // No password — send setup email
    const placeholder = await hashPassword(crypto.randomUUID());
    const user = await prisma.user.create({
      data: { name, email, password: placeholder, role: role ?? "USER", emailVerified: false },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.token.create({
      data: { userId: user.id, type: TokenType.PASSWORD_RESET, token, expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) },
    });
    await sendPasswordResetEmail(email, token);

    res.status(201).json({ user, passwordSet: false, message: "Setup email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendPasswordReset(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
    if (!user) throw new AppError(404, "User not found");

    await prisma.token.deleteMany({ where: { userId: user.id, type: TokenType.PASSWORD_RESET } });
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.token.create({
      data: { userId: user.id, type: TokenType.PASSWORD_RESET, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await sendPasswordResetEmail(user.email, token);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendEmailVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
    if (!user) throw new AppError(404, "User not found");
    if (user.emailVerified) throw new AppError(400, "Email already verified");

    await prisma.token.deleteMany({ where: { userId: user.id, type: TokenType.EMAIL_VERIFICATION } });
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.token.create({
      data: { userId: user.id, type: TokenType.EMAIL_VERIFICATION, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    await sendVerificationEmail(user.email, token);

    res.json({ message: "Verification email sent" });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: req.body,
      create: { id: "singleton", ...req.body },
    });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}
