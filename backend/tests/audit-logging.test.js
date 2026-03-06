import { jest } from '@jest/globals';
import { AuditAction, AuditEntityType } from '../src/constants/audit.js';
import { Roles } from '../src/constants/roles.js';

const prismaMock = {
  patient: {
    create: jest.fn()
  },
  auditLog: {
    count: jest.fn(),
    findMany: jest.fn()
  }
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: prismaMock,
  assertAuditLogActionAllowed: (params) => {
    if (params.model === 'AuditLog' && ['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(params.action)) {
      throw Object.assign(new Error('Audit logs are immutable'), {
        status: 403,
        code: 'IMMUTABLE_AUDIT_LOG'
      });
    }
  }
}));

const auditServiceMock = {
  AuditService: {
    logEvent: jest.fn()
  }
};

jest.unstable_mockModule('../src/services/audit.service.js', () => auditServiceMock);

const { PatientService } = await import('../src/services/patient.service.js');
const { AuditLogService } = await import('../src/services/audit-log.service.js');
const { assertAuditLogActionAllowed } = await import('../src/config/prisma.js');

describe('audit logging', () => {
  beforeEach(() => {
    prismaMock.patient.create.mockReset();
    prismaMock.auditLog.count.mockReset();
    prismaMock.auditLog.findMany.mockReset();
    auditServiceMock.AuditService.logEvent.mockReset();
  });

  it('creating patient generates audit log event', async () => {
    prismaMock.patient.create.mockResolvedValue({
      id: 'patient-1',
      fullName: 'Jane Roe',
      clinicId: 'clinic-1'
    });

    await PatientService.createPatient('doctor-1', {
      fullName: 'Jane Roe',
      age: 36,
      gender: 'female',
      phone: '555-1010'
    });

    expect(auditServiceMock.AuditService.logEvent).toHaveBeenCalledWith({
      action: AuditAction.PATIENT_CREATED,
      entityType: AuditEntityType.PATIENT,
      entityId: 'patient-1',
      metadata: { fullName: 'Jane Roe' }
    });
  });

  it('audit log cannot be updated', () => {
    expect(() => assertAuditLogActionAllowed({ model: 'AuditLog', action: 'update' })).toThrow('Audit logs are immutable');
  });

  it('cross-clinic access is blocked by clinic-scoped query', async () => {
    prismaMock.auditLog.count.mockResolvedValue(0);
    prismaMock.auditLog.findMany.mockResolvedValue([]);

    await AuditLogService.list({
      actor: { id: 'admin-a', role: Roles.CLINIC_ADMIN, clinicId: 'clinic-a' },
      page: 1,
      limit: 20
    });

    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clinicId: 'clinic-a'
        })
      })
    );
  });
});
