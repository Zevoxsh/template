import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { getProfile, updateProfile, changePassword } from "../controllers/user.controller";
import { updateProfileSchema, changePasswordSchema } from "../validations/auth.validation";

const router = Router();

router.use(authenticate);

router.get("/profile", getProfile);
router.put("/profile", validate(updateProfileSchema), updateProfile);
router.put("/password", validate(changePasswordSchema), changePassword);

export default router;
