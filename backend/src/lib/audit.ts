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

export function audit(params: AuditParams) {
  setImmediate(() => {
    prisma.auditLog.create({ data: params }).catch(() => {});
  });
}
