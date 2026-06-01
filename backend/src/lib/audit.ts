import { prisma } from "./prisma";

interface AuditParams {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export async function audit(params: AuditParams) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // never throw — logging must be non-blocking
  }
}
