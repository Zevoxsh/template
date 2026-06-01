import path from "path";
import fs from "fs";
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  getStats, listUsers, getUser, updateUser, deleteUser,
  createUser, sendPasswordReset, sendEmailVerification,
  getSettings, updateSettings, resetUserAvatar,
  getAuditLogs, getDetailedStats, exportUsersCsv,
  getRateLimitBlocks, unblockIp, broadcastNotification, bulkAction,
} from "../controllers/admin.controller";
import { testSmtp } from "../lib/mail";
import { updateUserSchema, updateSettingsSchema } from "../validations/admin.validation";

const logoDir = path.join(process.cwd(), "uploads", "logo");
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: logoDir,
    filename: (_req, file, cb) => cb(null, `logo${path.extname(file.originalname).toLowerCase() || ".png"}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Images only"));
    cb(null, true);
  },
});

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/stats", getDetailedStats);
router.get("/stats/legacy", getStats);
router.get("/audit-logs", getAuditLogs);
router.get("/users/export/csv", exportUsersCsv);
router.post("/users/bulk", bulkAction);
router.get("/rate-limits", getRateLimitBlocks);
router.post("/rate-limits/:id/unblock", unblockIp);
router.post("/notifications/broadcast", broadcastNotification);
router.get("/users", listUsers);
router.post("/users", createUser);
router.get("/users/:id", getUser);
router.put("/users/:id", validate(updateUserSchema), updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/reset-password", sendPasswordReset);
router.post("/users/:id/reset-avatar", resetUserAvatar);
router.post("/users/:id/send-verification", sendEmailVerification);
router.get("/settings", getSettings);
router.put("/settings", validate(updateSettingsSchema), updateSettings);
router.post("/settings/logo", logoUpload.single("logo"), async (req, res, next) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file" }); return; }
    const logoUrl = `/uploads/logo/${req.file.filename}`;
    const { prisma } = await import("../lib/prisma");
    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { logoUrl },
      create: { id: "singleton", logoUrl },
    });
    res.json({ logoUrl: settings.logoUrl });
  } catch (err) { next(err); }
});
router.delete("/settings/logo", async (_req, res, next) => {
  try {
    const { prisma } = await import("../lib/prisma");
    const current = await prisma.siteSettings.findUnique({ where: { id: "singleton" }, select: { logoUrl: true } });
    if (current?.logoUrl) {
      const file = path.join(process.cwd(), "uploads", "logo", path.basename(current.logoUrl));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    await prisma.siteSettings.upsert({ where: { id: "singleton" }, update: { logoUrl: null }, create: { id: "singleton" } });
    res.json({ message: "Logo supprimé" });
  } catch (err) { next(err); }
});

router.post("/test-smtp", async (_req, res, next) => {
  try {
    await testSmtp();
    res.json({ ok: true, message: "Connexion SMTP réussie" });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

export default router;
