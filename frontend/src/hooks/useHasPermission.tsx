import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permissions, type Permission, Roles, rolePermissions, type Role } from '@/security/rbac';

const LEGACY_TO_ROLE: Record<string, Role> = {
  ADMIN: Roles.CLINIC_ADMIN,
  SUPER_ADMIN: Roles.SUPER_ADMIN,
  CLINIC_ADMIN: Roles.CLINIC_ADMIN,
  DOCTOR: Roles.DOCTOR,
  NURSE: Roles.NURSE,
  STAFF: Roles.STAFF,
};

export function useHasPermission(permission: Permission): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.role) {
      return false;
    }

    const normalizedRole = LEGACY_TO_ROLE[user.role] as Role | undefined;
    if (!normalizedRole) {
      return false;
    }

    if (normalizedRole === Roles.SUPER_ADMIN) {
      return true;
    }

    return rolePermissions[normalizedRole].includes(permission);
  }, [permission, user?.role]);
}

export function ExamplePermissionGuard(): JSX.Element | null {
  const canDeletePatient = useHasPermission(Permissions.PATIENT_DELETE);

  if (!canDeletePatient) {
    return null;
  }

  return <button type="button">Delete Patient</button>;
}
