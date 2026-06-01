import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { prisma } from "../lib/prisma";
import { ALL_PERMISSIONS, DEFAULT_PERMISSIONS } from "../lib/permissions";
import { AppError } from "../middleware/error.middleware";
import { Role } from "@prisma/client";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));

router.get("/", async (_req, res, next) => {
  try {
    const rows = await prisma.rolePermission.findMany();
    const map: Record<string, string[]> = { ADMIN: [], MODERATOR: [], USER: [] };
    for (const r of rows) {
      if (!map[r.role]) map[r.role] = [];
      map[r.role].push(r.permission);
    }
    res.json({ permissions: map, available: ALL_PERMISSIONS });
  } catch (err) { next(err); }
});

router.put("/:role", async (req, res, next) => {
  try {
    const role = req.params.role as Role;
    if (!Object.values(Role).includes(role)) throw new AppError(400, "Rôle invalide");

    const permissions: string[] = req.body.permissions ?? [];
    const invalid = permissions.filter((p) => !(ALL_PERMISSIONS as readonly string[]).includes(p));
    if (invalid.length) throw new AppError(400, `Permissions inconnues : ${invalid.join(", ")}`);

    await prisma.rolePermission.deleteMany({ where: { role } });
    if (permissions.length) {
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ role, permission: p })),
      });
    }
    res.json({ role, permissions });
  } catch (err) { next(err); }
});

router.post("/reset", async (_req, res, next) => {
  try {
    await prisma.rolePermission.deleteMany();
    for (const [role, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
      await prisma.rolePermission.createMany({
        data: perms.map((p) => ({ role: role as Role, permission: p })),
      });
    }
    res.json({ message: "Permissions réinitialisées" });
  } catch (err) { next(err); }
});

export default router;
