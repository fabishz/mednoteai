import { jest } from '@jest/globals';

const prismaMock = {
  patient: {
    findFirst: jest.fn(),
    findUnique: jest.fn()
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

jest.unstable_mockModule('../src/services/dashboard.service.js', () => ({
  DashboardService: {
    invalidateClinicStats: jest.fn()
  }
}));

const { PatientService } = await import('../src/services/patient.service.js');

describe('PatientService GDPR anonymization', () => {
  beforeEach(() => {
    prismaMock.patient.findFirst.mockReset();
    prismaMock.patient.findUnique.mockReset();
    prismaMock.$transaction.mockReset();
    auditLogEvent.mockReset();
  });

  it('anonymizes a patient permanently and logs audit event', async () => {
    prismaMock.patient.findFirst.mockResolvedValue({
      id: 'p-1',
      clinicId: 'c-1',
      fullName: 'Jane Doe',
      phone: '555-0101',
      deletedAt: null,
      anonymizedAt: null
    });

    const txMock = {
      patient: {
        update: jest.fn().mockResolvedValue({
          id: 'p-1',
          fullName: 'Deleted Patient',
          phone: 'REDACTED',
          anonymizedAt: new Date('2026-03-06T10:00:00.000Z')
        })
      },
      medicalNote: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      voiceNote: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback) => callback(txMock));

    const result = await PatientService.permanentDelete('u-1', 'p-1');

    expect(result.fullName).toBe('Deleted Patient');
    expect(result.phone).toBe('REDACTED');
    expect(txMock.patient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p-1' },
        data: expect.objectContaining({
          fullName: 'Deleted Patient',
          phone: 'REDACTED'
        })
      })
    );

    expect(auditLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PATIENT_ANONYMIZED',
        userId: 'u-1',
        entityId: 'p-1'
      })
    );
  });

  it('blocks restore for anonymized patients', async () => {
    prismaMock.patient.findFirst.mockResolvedValue({
      id: 'p-1',
      deletedAt: new Date('2026-03-06T10:00:00.000Z'),
      anonymizedAt: new Date('2026-03-06T10:00:00.000Z')
    });

    await expect(PatientService.restorePatient('p-1')).rejects.toMatchObject({
      status: 409,
      code: 'PATIENT_ANONYMIZED'
    });
  });
});
