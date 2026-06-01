import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  getStats, listUsers, getUser, updateUser, deleteUser,
  createUser, sendPasswordReset, sendEmailVerification,
  getSettings, updateSettings,
} from "../controllers/admin.controller";
import { updateUserSchema, updateSettingsSchema } from "../validations/admin.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.post("/users", createUser);
router.get("/users/:id", getUser);
router.put("/users/:id", validate(updateUserSchema), updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/reset-password", sendPasswordReset);
router.post("/users/:id/send-verification", sendEmailVerification);
router.get("/settings", getSettings);
router.put("/settings", validate(updateSettingsSchema), updateSettings);

export default router;
