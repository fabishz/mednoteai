import { prisma } from '../config/prisma.js';
import { AuditAction, AuditEntityType } from '../constants/audit.js';
import { Roles, ASSIGNABLE_ROLE_VALUES, normalizeRole, roleRank, toStoredRole } from '../constants/roles.js';
import { AuditService } from './audit.service.js';

function ensureRoleAssignable(role) {
  if (!ASSIGNABLE_ROLE_VALUES.includes(role)) {
    throw Object.assign(new Error('Invalid role'), { status: 400, code: 'INVALID_ROLE' });
  }
}

function assertRoleAssignmentAllowed(actor, targetCurrentRole, requestedRole) {
  const actorRole = normalizeRole(actor.role);

  if (actorRole !== Roles.SUPER_ADMIN && actorRole !== Roles.CLINIC_ADMIN) {
    throw Object.assign(new Error('Only clinic admin or super admin can change roles'), {
      status: 403,
      code: 'FORBIDDEN'
    });
  }

  if (actorRole !== Roles.SUPER_ADMIN && actor.clinicId !== targetCurrentRole.clinicId) {
    throw Object.assign(new Error('Cross-clinic role management is forbidden'), {
      status: 403,
      code: 'FORBIDDEN'
    });
  }

  const actorRank = roleRank(actorRole);
  const currentTargetRank = roleRank(targetCurrentRole.role);
  const requestedRank = roleRank(requestedRole);

  if (actorRank <= currentTargetRank || actorRank <= requestedRank) {
    throw Object.assign(new Error('Cannot assign or modify role equal or higher than your own role'), {
      status: 403,
      code: 'FORBIDDEN'
    });
  }

  if (actor.id === targetCurrentRole.id && requestedRole !== targetCurrentRole.role) {
    throw Object.assign(new Error('Self role escalation is forbidden'), {
      status: 403,
      code: 'FORBIDDEN'
    });
  }
}

export class UserRoleService {
  static async updateUserRole({ actorUser, targetUserId, newRole }) {
    ensureRoleAssignable(newRole);

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, clinicId: true }
    });

    if (!targetUser) {
      throw Object.assign(new Error('User not found'), { status: 404, code: 'USER_NOT_FOUND' });
    }

    const normalizedTarget = {
      ...targetUser,
      role: normalizeRole(targetUser.role)
    };

    assertRoleAssignmentAllowed(actorUser, normalizedTarget, newRole);

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: toStoredRole(newRole) },
      select: {
        id: true,
        name: true,
        email: true,
        clinicId: true,
        clinicName: true,
        role: true,
        createdAt: true
      }
    });

    await AuditService.logEvent({
      action: AuditAction.USER_ROLE_CHANGED,
      entityType: AuditEntityType.USER,
      entityId: updatedUser.id,
      metadata: {
        targetUserId: updatedUser.id,
        newRole: normalizeRole(updatedUser.role)
      }
    });

    return {
      ...updatedUser,
      role: normalizeRole(updatedUser.role)
    };
  }
}
