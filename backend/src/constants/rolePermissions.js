import { Roles, LegacyRoles, normalizeRole } from './roles.js';
import { Permissions } from './permissions.js';

export const rolePermissions = Object.freeze({
  [Roles.SUPER_ADMIN]: Object.freeze(Object.values(Permissions)),
  [Roles.CLINIC_ADMIN]: Object.freeze([
    Permissions.PATIENT_CREATE,
    Permissions.PATIENT_READ,
    Permissions.PATIENT_UPDATE,
    Permissions.PATIENT_DELETE,
    Permissions.NOTE_CREATE,
    Permissions.NOTE_READ,
    Permissions.NOTE_UPDATE,
    Permissions.NOTE_DELETE,
    Permissions.USER_INVITE,
    Permissions.USER_DELETE,
    Permissions.AUDIT_VIEW,
    Permissions.BILLING_MANAGE
  ]),
  [Roles.DOCTOR]: Object.freeze([
    Permissions.PATIENT_CREATE,
    Permissions.PATIENT_READ,
    Permissions.PATIENT_UPDATE,
    Permissions.NOTE_CREATE,
    Permissions.NOTE_READ,
    Permissions.NOTE_UPDATE
  ]),
  [Roles.NURSE]: Object.freeze([
    Permissions.PATIENT_READ,
    Permissions.NOTE_READ,
    Permissions.NOTE_CREATE
  ]),
  [Roles.STAFF]: Object.freeze([
    Permissions.PATIENT_READ,
    Permissions.NOTE_READ
  ])
});

export function getPermissionsForRole(role) {
  const normalizedRole = normalizeRole(role);
  return rolePermissions[normalizedRole] ?? [];
}

export function hasPermission(role, permission) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === Roles.SUPER_ADMIN) {
    return true;
  }
  return getPermissionsForRole(normalizedRole).includes(permission);
}

export function isSupportedRole(role) {
  const normalizedRole = normalizeRole(role);
  return Boolean(rolePermissions[normalizedRole]) || role === LegacyRoles.ADMIN;
}
