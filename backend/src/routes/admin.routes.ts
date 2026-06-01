import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  getStats, listUsers, getUser, updateUser, deleteUser, getSettings, updateSettings,
} from "../controllers/admin.controller";
import { updateUserSchema, updateSettingsSchema } from "../validations/admin.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.put("/users/:id", validate(updateUserSchema), updateUser);
router.delete("/users/:id", deleteUser);
router.get("/settings", getSettings);
router.put("/settings", validate(updateSettingsSchema), updateSettings);

export default router;
