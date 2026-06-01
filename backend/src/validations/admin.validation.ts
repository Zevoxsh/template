import { z } from "zod";
import { Role } from "@prisma/client";

export const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  banned: z.boolean().optional(),
  bannedReason: z.string().max(255).optional(),
  emailVerified: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  siteDescription: z.string().max(500).optional(),
  registrationEnabled: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
});
