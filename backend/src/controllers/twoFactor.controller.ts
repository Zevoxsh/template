import crypto from "crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../types";
import { TokenType } from "@prisma/client";
import { sendTwoFactorEmail } from "../lib/mail";
import { config } from "../config";

const BACKUP_CODE_COUNT = 8;

function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// ─── TOTP setup ──────────────────────────────────────────────────────────────
export async function totpSetup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!settings?.twoFactorAllowedMethods.includes("totp")) {
      throw new AppError(403, "TOTP n'est pas activé par l'administrateur");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } });
    if (!user) throw new AppError(404, "User not found");

    const totp = new OTPAuth.TOTP({
      issuer: config.siteName,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromUTF8(crypto.randomBytes(16).toString("hex")),
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();
    const qrCode = await QRCode.toDataURL(uri);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorSecret: secret, twoFactorMethod: "totp", twoFactorEnabled: false },
    });

    res.json({ secret, qrCode, uri });
  } catch (err) { next(err); }
}

// ─── TOTP activate (verify first code) ───────────────────────────────────────
export async function totpActivate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { twoFactorSecret: true, email: true },
    });
    if (!user?.twoFactorSecret) throw new AppError(400, "Configurez d'abord le TOTP");

    const totp = new OTPAuth.TOTP({
      issuer: config.siteName,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    const delta = totp.validate({ token: String(code), window: 1 });
    if (delta === null) throw new AppError(400, "Code invalide");

    const backupCodes = generateBackupCodes();
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        twoFactorEnabled: true,
        backupCodes: backupCodes.map(hashCode),
      },
    });

    res.json({ backupCodes });
  } catch (err) { next(err); }
}

// ─── Email 2FA — send code ────────────────────────────────────────────────────
export async function emailSetup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!settings?.twoFactorAllowedMethods.includes("email")) {
      throw new AppError(403, "L'OTP par email n'est pas activé par l'administrateur");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true } });
    if (!user) throw new AppError(404, "User not found");

    await prisma.token.deleteMany({ where: { userId: req.user!.id, type: TokenType.TWO_FACTOR_EMAIL } });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.token.create({
      data: {
        userId: req.user!.id,
        type: TokenType.TWO_FACTOR_EMAIL,
        token: hashCode(code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorMethod: "email", twoFactorEnabled: false, twoFactorSecret: null },
    });

    await sendTwoFactorEmail(user.email, code);
    res.json({ message: "Code envoyé" });
  } catch (err) { next(err); }
}

// ─── Email 2FA — activate ─────────────────────────────────────────────────────
export async function emailActivate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const record = await prisma.token.findFirst({
      where: { userId: req.user!.id, type: TokenType.TWO_FACTOR_EMAIL, token: hashCode(String(code)) },
    });
    if (!record || record.expiresAt < new Date()) throw new AppError(400, "Code invalide ou expiré");

    await prisma.token.delete({ where: { id: record.id } });
    const backupCodes = generateBackupCodes();
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorEnabled: true, backupCodes: backupCodes.map(hashCode) },
    });

    res.json({ backupCodes });
  } catch (err) { next(err); }
}

// ─── Disable 2FA ──────────────────────────────────────────────────────────────
export async function disable2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (settings?.twoFactorPolicy === "REQUIRED") {
      throw new AppError(400, "La 2FA est obligatoire sur ce site");
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorEnabled: false, twoFactorMethod: null, twoFactorSecret: null, backupCodes: [] },
    });

    res.json({ message: "2FA désactivée" });
  } catch (err) { next(err); }
}

// ─── Regenerate backup codes ───────────────────────────────────────────────────
export async function regenerateBackupCodes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { twoFactorEnabled: true } });
    if (!user?.twoFactorEnabled) throw new AppError(400, "La 2FA n'est pas activée");

    const backupCodes = generateBackupCodes();
    await prisma.user.update({ where: { id: req.user!.id }, data: { backupCodes: backupCodes.map(hashCode) } });
    res.json({ backupCodes });
  } catch (err) { next(err); }
}

// ─── Verify during login challenge ────────────────────────────────────────────
export async function verifyChallenge(req: Request & { body: any }, res: Response, next: NextFunction) {
  try {
    const { challengeToken, code } = (req as any).body;
    if (!challengeToken || !code) throw new AppError(400, "Données manquantes");

    const challenge = await prisma.token.findUnique({ where: { token: challengeToken } });
    if (!challenge || challenge.type !== TokenType.TWO_FACTOR_CHALLENGE || challenge.expiresAt < new Date()) {
      throw new AppError(401, "Session 2FA expirée, veuillez vous reconnecter");
    }

    const user = await prisma.user.findUnique({
      where: { id: challenge.userId },
      select: { id: true, email: true, name: true, role: true, twoFactorMethod: true, twoFactorSecret: true, backupCodes: true },
    });
    if (!user) throw new AppError(404, "Utilisateur introuvable");

    let valid = false;

    if (user.twoFactorMethod === "totp" && user.twoFactorSecret) {
      const totp = new OTPAuth.TOTP({
        issuer: config.siteName,
        label: user.email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
      });
      valid = totp.validate({ token: String(code), window: 1 }) !== null;
    } else if (user.twoFactorMethod === "email") {
      const emailToken = await prisma.token.findFirst({
        where: { userId: user.id, type: TokenType.TWO_FACTOR_EMAIL, token: hashCode(String(code)) },
      });
      if (emailToken && emailToken.expiresAt >= new Date()) {
        valid = true;
        await prisma.token.delete({ where: { id: emailToken.id } });
      }
    }

    if (!valid) {
      const codeStr = String(code).replace(/\s/g, "").toUpperCase();
      const matchIndex = user.backupCodes.findIndex(h => h === hashCode(codeStr));
      if (matchIndex !== -1) {
        valid = true;
        const updatedCodes = [...user.backupCodes];
        updatedCodes.splice(matchIndex, 1);
        await prisma.user.update({ where: { id: user.id }, data: { backupCodes: updatedCodes } });
      }
    }

    if (!valid) throw new AppError(400, "Code invalide");

    await prisma.token.delete({ where: { id: challenge.id } });

    const { signAccessToken, signRefreshToken } = await import("../lib/jwt");
    const COOKIE_OPTS = {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
    const refreshToken = signRefreshToken(user.id);
    await prisma.token.create({
      data: { userId: user.id, type: TokenType.REFRESH, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
    res.cookie("access_token", accessToken, { ...COOKIE_OPTS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie("refresh_token", refreshToken, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}

// ─── Send email OTP during login challenge ────────────────────────────────────
export async function sendChallengeEmailOtp(req: Request & { body: any }, res: Response, next: NextFunction) {
  try {
    const { challengeToken } = (req as any).body;
    if (!challengeToken) throw new AppError(400, "Token manquant");

    const challenge = await prisma.token.findUnique({ where: { token: challengeToken } });
    if (!challenge || challenge.type !== TokenType.TWO_FACTOR_CHALLENGE || challenge.expiresAt < new Date()) {
      throw new AppError(401, "Session 2FA expirée");
    }

    const user = await prisma.user.findUnique({ where: { id: challenge.userId }, select: { email: true } });
    if (!user) throw new AppError(404, "Utilisateur introuvable");

    await prisma.token.deleteMany({ where: { userId: challenge.userId, type: TokenType.TWO_FACTOR_EMAIL } });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.token.create({
      data: {
        userId: challenge.userId,
        type: TokenType.TWO_FACTOR_EMAIL,
        token: hashCode(code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendTwoFactorEmail(user.email, code);
    res.json({ message: "Code envoyé" });
  } catch (err) { next(err); }
}
