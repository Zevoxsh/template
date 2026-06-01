import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Response, NextFunction } from "express";
import { audit } from "../lib/audit";
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

    const changes: string[] = [];
    if (role !== undefined) changes.push(`role→${role}`);
    if (banned === true) changes.push("banned");
    if (banned === false) changes.push("unbanned");
    if (emailVerified !== undefined) changes.push(`emailVerified→${emailVerified}`);
    audit({ actorId: req.user!.id, actorEmail: req.user!.email, action: "ADMIN_UPDATE_USER", targetType: "user", targetId: user.id, targetName: user.email, metadata: { changes } });

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

// ─── Bulk actions ─────────────────────────────────────────────────────────────
export async function bulkAction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { action, userIds, role, bannedReason } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) throw new AppError(400, "userIds requis");

    switch (action) {
      case "ban":
        await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { banned: true, bannedReason: bannedReason ?? null } });
        break;
      case "unban":
        await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { banned: false, bannedReason: null } });
        break;
      case "delete":
        await prisma.user.deleteMany({ where: { id: { in: userIds }, NOT: { id: req.user!.id } } });
        break;
      case "set-role":
        if (!role) throw new AppError(400, "role requis");
        await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { role } });
        break;
      case "verify-email":
        await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { emailVerified: true } });
        break;
      default:
        throw new AppError(400, `Action inconnue: ${action}`);
    }

    audit({ actorId: req.user!.id, actorEmail: req.user!.email, action: `ADMIN_BULK_${action.toUpperCase()}`, metadata: { count: userIds.length } });
    res.json({ message: `Action "${action}" appliquée à ${userIds.length} utilisateur(s)` });
  } catch (err) { next(err); }
}

// ─── Audit logs ───────────────────────────────────────────────────────────────
export async function getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const action = req.query.action as string | undefined;
    const actorId = req.query.actorId as string | undefined;

    const where = {
      ...(action && { action: { contains: action, mode: "insensitive" as const } }),
      ...(actorId && { actorId }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

// ─── Stats (time-series) ───────────────────────────────────────────────────────
export async function getDetailedStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [signupsRaw, loginsRaw, totalUsers, bannedUsers, unverifiedUsers, recentUsers] = await Promise.all([
      prisma.user.groupBy({ by: ["createdAt"], where: { createdAt: { gte: since } }, _count: true, orderBy: { createdAt: "asc" } }),
      prisma.auditLog.groupBy({ by: ["createdAt"], where: { action: "LOGIN", createdAt: { gte: since } }, _count: true, orderBy: { createdAt: "asc" } }),
      prisma.user.count(),
      prisma.user.count({ where: { banned: true } }),
      prisma.user.count({ where: { emailVerified: false } }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true } }),
    ]);

    const toDaily = (rows: { createdAt: Date; _count: number }[]) => {
      const map: Record<string, number> = {};
      for (const r of rows) {
        const day = r.createdAt.toISOString().slice(0, 10);
        map[day] = (map[day] ?? 0) + r._count;
      }
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        result.push({ date: d, count: map[d] ?? 0 });
      }
      return result;
    };

    res.json({
      totalUsers, bannedUsers, unverifiedUsers, recentUsers,
      totalAdmins: await prisma.user.count({ where: { role: "ADMIN" } }),
      totalModerators: await prisma.user.count({ where: { role: "MODERATOR" } }),
      signups: toDaily(signupsRaw.map(r => ({ createdAt: r.createdAt, _count: r._count }))),
      logins: toDaily(loginsRaw.map(r => ({ createdAt: r.createdAt, _count: r._count }))),
    });
  } catch (err) { next(err); }
}

// ─── CSV export ────────────────────────────────────────────────────────────────
export async function exportUsersCsv(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, emailVerified: true, banned: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    const header = "id,name,email,role,emailVerified,banned,createdAt";
    const rows = users.map(u =>
      [u.id, `"${u.name.replace(/"/g, '""')}"`, u.email, u.role, u.emailVerified, u.banned, u.createdAt.toISOString()].join(",")
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="users-${Date.now()}.csv"`);
    res.send([header, ...rows].join("\n"));
  } catch (err) { next(err); }
}

// ─── Rate limit blocks ─────────────────────────────────────────────────────────
export async function getRateLimitBlocks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const blocks = await prisma.rateLimitBlock.findMany({ orderBy: { blockedAt: "desc" }, take: 100 });
    res.json({ blocks });
  } catch (err) { next(err); }
}

export async function unblockIp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const blockId = String(req.params.id);
    await prisma.rateLimitBlock.update({ where: { id: blockId }, data: { unblockedAt: new Date(), attempts: 0 } });
    audit({ actorId: req.user!.id, actorEmail: req.user!.email, action: "ADMIN_UNBLOCK_IP", metadata: { id: blockId } });
    res.json({ message: "IP débloquée" });
  } catch (err) { next(err); }
}

// ─── Notifications ─────────────────────────────────────────────────────────────
export async function broadcastNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, body, link, type } = req.body;
    if (!title || !body) throw new AppError(400, "title et body requis");
    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: users.map(u => ({ userId: u.id, type: type ?? "admin", title, body, link: link ?? null })),
    });
    audit({ actorId: req.user!.id, actorEmail: req.user!.email, action: "ADMIN_BROADCAST_NOTIFICATION", metadata: { title } });
    res.json({ message: `Notification envoyée à ${users.length} utilisateurs` });
  } catch (err) { next(err); }
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
