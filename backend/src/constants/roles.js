export const Roles = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLINIC_ADMIN: 'CLINIC_ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  STAFF: 'STAFF'
});

// Legacy role kept for backward compatibility during rollout.
export const LegacyRoles = Object.freeze({
  ADMIN: 'ADMIN'
});

export const ROLE_VALUES = Object.freeze([
  ...Object.values(Roles),
  ...Object.values(LegacyRoles)
]);

export const ASSIGNABLE_ROLE_VALUES = Object.freeze([
  Roles.CLINIC_ADMIN,
  Roles.DOCTOR,
  Roles.NURSE,
  Roles.STAFF
]);

export function normalizeRole(role) {
  if (role === LegacyRoles.ADMIN) {
    return Roles.CLINIC_ADMIN;
  }
  return role;
}

export function toStoredRole(role) {
  if (role === Roles.CLINIC_ADMIN) {
    return LegacyRoles.ADMIN;
  }
  return role;
}

export function roleRank(role) {
  const normalizedRole = normalizeRole(role);
  switch (normalizedRole) {
    case Roles.SUPER_ADMIN:
      return 100;
    case Roles.CLINIC_ADMIN:
      return 80;
    case Roles.DOCTOR:
      return 60;
    case Roles.NURSE:
      return 40;
    case Roles.STAFF:
      return 20;
    default:
      return 0;
  }
}
