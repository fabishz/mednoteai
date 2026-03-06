export const Roles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLINIC_ADMIN: 'CLINIC_ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  STAFF: 'STAFF',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const Permissions = {
  PATIENT_CREATE: 'PATIENT_CREATE',
  PATIENT_READ: 'PATIENT_READ',
  PATIENT_UPDATE: 'PATIENT_UPDATE',
  PATIENT_DELETE: 'PATIENT_DELETE',
  NOTE_CREATE: 'NOTE_CREATE',
  NOTE_READ: 'NOTE_READ',
  NOTE_UPDATE: 'NOTE_UPDATE',
  NOTE_DELETE: 'NOTE_DELETE',
  USER_INVITE: 'USER_INVITE',
  USER_DELETE: 'USER_DELETE',
  AUDIT_VIEW: 'AUDIT_VIEW',
  BILLING_MANAGE: 'BILLING_MANAGE',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const rolePermissions: Record<Role, readonly Permission[]> = {
  [Roles.SUPER_ADMIN]: Object.values(Permissions),
  [Roles.CLINIC_ADMIN]: [
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
    Permissions.BILLING_MANAGE,
  ],
  [Roles.DOCTOR]: [
    Permissions.PATIENT_CREATE,
    Permissions.PATIENT_READ,
    Permissions.PATIENT_UPDATE,
    Permissions.NOTE_CREATE,
    Permissions.NOTE_READ,
    Permissions.NOTE_UPDATE,
  ],
  [Roles.NURSE]: [
    Permissions.PATIENT_READ,
    Permissions.NOTE_READ,
    Permissions.NOTE_CREATE,
  ],
  [Roles.STAFF]: [
    Permissions.PATIENT_READ,
    Permissions.NOTE_READ,
  ],
};
