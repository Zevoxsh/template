import path from "path";
import fs from "fs";
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  getProfile, updateProfile, changePassword, changeEmail,
  uploadAvatar, deleteAvatar, unlinkOAuthAccount,
} from "../controllers/user.controller";
import { updateProfileSchema, changePasswordSchema } from "../validations/auth.validation";
import { z } from "zod";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Images only"));
    cb(null, true);
  },
});

const router = Router();
router.use(authenticate);

router.get("/profile", getProfile);
router.put("/profile", validate(updateProfileSchema), updateProfile);
router.put("/email", validate(z.object({ email: z.string().email(), password: z.string().min(1) })), changeEmail);
router.put("/password", validate(changePasswordSchema), changePassword);
router.post("/avatar", upload.single("avatar"), uploadAvatar);
router.delete("/avatar", deleteAvatar);
router.delete("/connections/:provider", unlinkOAuthAccount);

export default router;
