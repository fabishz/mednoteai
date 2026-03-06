import { jest } from '@jest/globals';
import { Roles } from '../src/constants/roles.js';

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn()
  }
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: prismaMock
}));

const { UserRoleService } = await import('../src/services/user-role.service.js');

describe('UserRoleService.updateUserRole', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
  });

  it('blocks doctor self-promotion', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'doctor-1',
      role: Roles.DOCTOR,
      clinicId: 'clinic-1'
    });

    await expect(
      UserRoleService.updateUserRole({
        actorUser: { id: 'doctor-1', role: Roles.DOCTOR, clinicId: 'clinic-1' },
        targetUserId: 'doctor-1',
        newRole: Roles.CLINIC_ADMIN
      })
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('blocks assigning a role equal or higher than actor', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'doctor-2',
      role: Roles.DOCTOR,
      clinicId: 'clinic-1'
    });

    await expect(
      UserRoleService.updateUserRole({
        actorUser: { id: 'admin-1', role: Roles.CLINIC_ADMIN, clinicId: 'clinic-1' },
        targetUserId: 'doctor-2',
        newRole: Roles.CLINIC_ADMIN
      })
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('allows super admin to update role', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'staff-1',
      role: Roles.STAFF,
      clinicId: 'clinic-2'
    });
    prismaMock.user.update.mockResolvedValue({
      id: 'staff-1',
      name: 'Staff One',
      email: 'staff1@example.com',
      clinicId: 'clinic-2',
      clinicName: 'Clinic 2',
      role: Roles.DOCTOR,
      createdAt: new Date('2026-03-04T00:00:00.000Z')
    });

    const updated = await UserRoleService.updateUserRole({
      actorUser: { id: 'super-1', role: Roles.SUPER_ADMIN, clinicId: null },
      targetUserId: 'staff-1',
      newRole: Roles.DOCTOR
    });

    expect(updated.role).toBe(Roles.DOCTOR);
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
  });
});
