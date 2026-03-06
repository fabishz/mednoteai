import { prisma } from '../config/prisma.js';
import { getRequestContext } from '../middlewares/requestContext.js';

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'unknown';
  }
  const [local, domain] = email.split('@');
  if (!domain) {
    return 'unknown';
  }
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 0))}@${domain}`;
}

export class AuditService {
  // Intentionally exposes create/list patterns only to keep audit logs immutable.
  static async logEvent({
    action,
    entityType,
    entityId = null,
    metadata,
    userId,
    clinicId,
    ipAddress,
    userAgent
  }) {
    try {
      const context = getRequestContext();
      const resolvedUserId = userId ?? context?.user?.id ?? 'UNKNOWN_USER';
      const resolvedClinicId = clinicId ?? context?.user?.clinicId ?? context?.clinicId ?? 'UNKNOWN_CLINIC';
      const resolvedIp = ipAddress ?? context?.ipAddress ?? 'unknown';
      const resolvedAgent = userAgent ?? context?.userAgent ?? 'unknown';

      await prisma.auditLog.create({
        data: {
          clinicId: resolvedClinicId,
          userId: resolvedUserId,
          action,
          entityType,
          entityId,
          metadata: metadata ?? undefined,
          ipAddress: resolvedIp,
          userAgent: resolvedAgent
        }
      });
    } catch {
      // Audit logging failures are intentionally swallowed to avoid impacting user flows.
    }
  }

  static safeEmail(email) {
    return normalizeEmail(email);
  }
}
