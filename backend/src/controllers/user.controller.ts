import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../lib/password";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../types";

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
    });
    if (!user) throw new AppError(404, "User not found");
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: { id: true, name: true, email: true, role: true, emailVerified: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
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
  } catch (err) {
    next(err);
  }
}
