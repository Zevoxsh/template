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
  twoFactorPolicy: z.enum(["DISABLED", "OPTIONAL", "REQUIRED"]).optional(),
  twoFactorAllowedMethods: z.array(z.enum(["totp", "email"])).optional(),
  inactivityTimeout: z.number().int().min(0).max(480).optional(),
  announcementEnabled: z.boolean().optional(),
  announcementText: z.string().max(500).optional(),
  announcementType: z.enum(["info", "warning", "success", "error"]).optional(),
  emailTemplates: z.record(z.string(), z.object({ subject: z.string(), body: z.string() })).optional(),
});
