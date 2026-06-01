import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import {
  totpSetup, totpActivate,
  emailSetup, emailActivate,
  disable2FA, regenerateBackupCodes,
  verifyChallenge, sendChallengeEmailOtp,
} from "../controllers/twoFactor.controller";

const router = Router();

// Public — during login challenge (no auth cookie yet)
router.post("/2fa/verify", verifyChallenge as any);
router.post("/2fa/email/send", sendChallengeEmailOtp as any);

// Public (authenticated) — returns 2FA policy for the current site
router.get("/2fa/policy", authenticate, async (_req, res, next) => {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    res.json({
      policy: s?.twoFactorPolicy ?? "OPTIONAL",
      methods: s?.twoFactorAllowedMethods ?? ["totp", "email"],
    });
  } catch (err) { next(err); }
});

// Authenticated — user settings
router.post("/2fa/totp/setup", authenticate, totpSetup);
router.post("/2fa/totp/activate", authenticate, totpActivate);
router.post("/2fa/email/setup", authenticate, emailSetup);
router.post("/2fa/email/activate", authenticate, emailActivate);
router.post("/2fa/disable", authenticate, disable2FA);
router.post("/2fa/backup-codes/regenerate", authenticate, regenerateBackupCodes);

export default router;
