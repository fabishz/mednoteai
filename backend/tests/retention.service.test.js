import { jest } from '@jest/globals';

const prismaMock = {
  clinic: {
    findMany: jest.fn()
  },
  auditLog: {
    deleteMany: jest.fn()
  },
  retentionPolicy: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  patient: {
    findMany: jest.fn()
  },
  $transaction: jest.fn()
};

const auditLogEvent = jest.fn();

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: prismaMock
}));

jest.unstable_mockModule('../src/services/audit.service.js', () => ({
  AuditService: {
    logEvent: auditLogEvent
  }
}));

jest.unstable_mockModule('../src/config/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

jest.unstable_mockModule('../src/middlewares/requestContext.js', () => ({
  runWithRequestContext: (_ctx, callback) => callback()
}));

const { RetentionService } = await import('../src/services/retention.service.js');

describe('RetentionService', () => {
  beforeEach(() => {
    prismaMock.clinic.findMany.mockReset();
    prismaMock.auditLog.deleteMany.mockReset();
    prismaMock.retentionPolicy.findFirst.mockReset();
    prismaMock.retentionPolicy.create.mockReset();
    prismaMock.retentionPolicy.update.mockReset();
    prismaMock.patient.findMany.mockReset();
    prismaMock.$transaction.mockReset();
    auditLogEvent.mockReset();
  });

  it('creates default policy when missing', async () => {
    prismaMock.retentionPolicy.findFirst.mockResolvedValue(null);
    prismaMock.retentionPolicy.create.mockResolvedValue({
      id: 'r-1',
      clinicId: 'c-1',
      patientRecordRetentionYears: 7,
      auditLogRetentionYears: 7
    });

    const result = await RetentionService.getPolicy({ clinicId: 'c-1' });

    expect(result.patientRecordRetentionYears).toBe(7);
    expect(result.auditLogRetentionYears).toBe(7);
    expect(prismaMock.retentionPolicy.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clinicId: 'c-1',
          patientRecordRetentionYears: 7,
          auditLogRetentionYears: 7
        })
      })
    );
  });

  it('forbids non-admin update', async () => {
    await expect(
      RetentionService.updatePolicy(
        { role: 'DOCTOR', clinicId: 'c-1' },
        { patientRecordRetentionYears: 5, auditLogRetentionYears: 5 }
      )
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('anonymizes expired patients from policy sweep', async () => {
    prismaMock.clinic.findMany.mockResolvedValue([{ id: 'c-1' }]);
    prismaMock.retentionPolicy.findFirst.mockResolvedValue({
      id: 'r-1',
      clinicId: 'c-1',
      patientRecordRetentionYears: 7,
      auditLogRetentionYears: 7
    });
    prismaMock.patient.findMany.mockResolvedValue([{ id: 'p-1' }]);
    prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 0 });

    const txMock = {
      patient: { update: jest.fn().mockResolvedValue({ id: 'p-1' }) },
      medicalNote: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      voiceNote: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) }
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(txMock));

    const count = await RetentionService.anonymizeExpiredPatientsNow();

    expect(count).toBe(1);
    expect(txMock.patient.update).toHaveBeenCalled();
    expect(auditLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PATIENT_ANONYMIZED',
        userId: 'SYSTEM_RETENTION_JOB',
        entityId: 'p-1'
      })
    );
  });

  it('deletes expired audit logs using clinic policy', async () => {
    prismaMock.clinic.findMany.mockResolvedValue([{ id: 'c-1' }]);
    prismaMock.retentionPolicy.findFirst.mockResolvedValue({
      id: 'r-1',
      clinicId: 'c-1',
      patientRecordRetentionYears: 7,
      auditLogRetentionYears: 5
    });
    prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 3 });

    const count = await RetentionService.purgeExpiredAuditLogsNow();

    expect(count).toBe(3);
    expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clinicId: 'c-1',
          createdAt: expect.objectContaining({ lt: expect.any(Date) })
        })
      })
    );
  });
});
