import { prisma } from '../config/prisma.js';
import { normalizeRole, Roles } from '../constants/roles.js';

export class AuditLogService {
  static async list({ actor, page = 1, limit = 20, userId, action, dateFrom, dateTo }) {
    const skip = (page - 1) * limit;

    const where = {};
    const normalizedRole = normalizeRole(actor.role);

    if (normalizedRole !== Roles.SUPER_ADMIN) {
      if (!actor.clinicId) {
        throw Object.assign(new Error('Missing clinic context'), { status: 403, code: 'FORBIDDEN' });
      }
      where.clinicId = actor.clinicId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {})
      };
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
