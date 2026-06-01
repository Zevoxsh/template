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
  twoFactorEnabled: true, twoFactorMethod: true, createdAt: true,
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
