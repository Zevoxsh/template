import path from "path";
import fs from "fs";
import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../lib/password";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../types";

const SELECTS = {
  id: true, name: true, email: true, role: true,
  emailVerified: true, avatarUrl: true, avatarFlagged: true,
  twoFactorEnabled: true, twoFactorMethod: true,
  onboardingDone: true, notifPrefs: true, createdAt: true,
};

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: SELECTS });
    if (!user) throw new AppError(404, "User not found");

    const oauthAccounts = await prisma.oAuthAccount.findMany({
      where: { userId: req.user!.id },
      select: { provider: true, providerAccountId: true },
    });

    res.json({ user, oauthAccounts });
  } catch (err) { next(err); }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: SELECTS,
    });
    res.json({ user });
  } catch (err) { next(err); }
}

export async function changeEmail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError(400, "Email and password required");

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError(404, "User not found");

    if (!(await comparePassword(password, user.password))) {
      throw new AppError(400, "Incorrect password");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) throw new AppError(409, "Email already in use");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email, emailVerified: false },
      select: SELECTS,
    });
    res.json({ user: updated });
  } catch (err) { next(err); }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError(404, "User not found");

    if (!(await comparePassword(currentPassword, user.password))) {
      throw new AppError(400, "Current password is incorrect");
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: "Password changed successfully" });
  } catch (err) { next(err); }
}

export async function uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError(400, "No file uploaded");

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Delete old avatar file
    const current = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { avatarUrl: true } });
    if (current?.avatarUrl) {
      const oldPath = path.join(process.cwd(), "uploads", "avatars", path.basename(current.avatarUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl, avatarFlagged: false },
      select: SELECTS,
    });
    res.json({ user });
  } catch (err) { next(err); }
}

export async function deleteAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { avatarUrl: true } });
    if (current?.avatarUrl) {
      const filePath = path.join(process.cwd(), "uploads", "avatars", path.basename(current.avatarUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: null },
      select: SELECTS,
    });
    res.json({ user });
  } catch (err) { next(err); }
}

// ─── Sessions ────────────────────────────────────────────────────────────────
export async function getSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const currentRefresh = req.cookies?.refresh_token as string | undefined;
    const sessions = await prisma.token.findMany({
      where: { userId: req.user!.id, type: "REFRESH" },
      select: { id: true, userAgent: true, ipAddress: true, lastUsed: true, createdAt: true, expiresAt: true, token: true },
      orderBy: { lastUsed: "desc" },
    });
    res.json({ sessions: sessions.map(s => ({ ...s, isCurrent: s.token === currentRefresh, token: undefined })) });
  } catch (err) { next(err); }
}

export async function revokeSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const session = await prisma.token.findUnique({ where: { id } });
    if (!session || session.userId !== req.user!.id) throw new AppError(404, "Session introuvable");
    await prisma.token.delete({ where: { id } });
    res.json({ message: "Session révoquée" });
  } catch (err) { next(err); }
}

export async function revokeAllSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const currentRefresh = req.cookies?.refresh_token as string | undefined;
    await prisma.token.deleteMany({
      where: { userId: req.user!.id, type: "REFRESH", NOT: { token: currentRefresh } },
    });
    res.json({ message: "Toutes les autres sessions révoquées" });
  } catch (err) { next(err); }
}

// ─── Account deletion ─────────────────────────────────────────────────────────
export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { password: true } });
    if (!user) throw new AppError(404, "Utilisateur introuvable");
    if (user.password && !(await comparePassword(password, user.password))) {
      throw new AppError(400, "Mot de passe incorrect");
    }
    await prisma.user.delete({ where: { id: req.user!.id } });
    const COOKIE_OPTS = { httpOnly: true, secure: false, sameSite: "lax" as const, path: "/" };
    res.clearCookie("access_token", COOKIE_OPTS);
    res.clearCookie("refresh_token", COOKIE_OPTS);
    res.json({ message: "Compte supprimé" });
  } catch (err) { next(err); }
}

// ─── Data export ──────────────────────────────────────────────────────────────
export async function exportData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, role: true, emailVerified: true,
        createdAt: true, updatedAt: true, avatarUrl: true, notifPrefs: true,
        oauthAccounts: { select: { provider: true, createdAt: true } },
      },
    });
    res.setHeader("Content-Disposition", `attachment; filename="my-data-${Date.now()}.json"`);
    res.json({ exportedAt: new Date(), user });
  } catch (err) { next(err); }
}

// ─── Notification preferences ─────────────────────────────────────────────────
export async function getNotifPrefs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { notifPrefs: true } });
    res.json({ notifPrefs: user?.notifPrefs ?? { security: true, updates: true, marketing: false } });
  } catch (err) { next(err); }
}

export async function updateNotifPrefs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { security, updates, marketing } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { notifPrefs: { security: !!security, updates: !!updates, marketing: !!marketing } },
      select: { notifPrefs: true },
    });
    res.json({ notifPrefs: user.notifPrefs });
  } catch (err) { next(err); }
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export async function completeOnboarding(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.user.update({ where: { id: req.user!.id }, data: { onboardingDone: true } });
    res.json({ message: "ok" });
  } catch (err) { next(err); }
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const unreadOnly = req.query.unread === "true";
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id, ...(unreadOnly && { read: false }) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ notifications });
  } catch (err) { next(err); }
}

export async function markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.notification.updateMany({ where: { id: String(req.params.id), userId: req.user!.id }, data: { read: true } });
    res.json({ message: "ok" });
  } catch (err) { next(err); }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
    res.json({ message: "ok" });
  } catch (err) { next(err); }
}

export async function unlinkOAuthAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const provider = String(req.params.provider);
    const count = await prisma.oAuthAccount.count({ where: { userId: req.user!.id } });
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { password: true } });

    // Must have either a real password or at least 2 OAuth accounts
    const hasPassword = user?.password && user.password.length > 0;
    if (!hasPassword && count <= 1) {
      throw new AppError(400, "Impossible de déconnecter — aucune autre méthode de connexion");
    }

    await prisma.oAuthAccount.deleteMany({ where: { userId: req.user!.id, provider } });
    res.json({ message: "Account unlinked" });
  } catch (err) { next(err); }
}
