import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
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

// Authenticated — user settings
router.post("/2fa/totp/setup", authenticate, totpSetup);
router.post("/2fa/totp/activate", authenticate, totpActivate);
router.post("/2fa/email/setup", authenticate, emailSetup);
router.post("/2fa/email/activate", authenticate, emailActivate);
router.post("/2fa/disable", authenticate, disable2FA);
router.post("/2fa/backup-codes/regenerate", authenticate, regenerateBackupCodes);

export default router;
