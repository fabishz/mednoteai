import { jest } from '@jest/globals';

const prismaMock = {
  voiceNote: {
    findMany: jest.fn()
  },
  medicalNote: {
    findMany: jest.fn()
  },
  auditLog: {
    findMany: jest.fn()
  }
};

const auditLogEvent = jest.fn();
const ensurePatientExistsWithTenantCheck = jest.fn();

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: prismaMock
}));

jest.unstable_mockModule('../src/services/audit.service.js', () => ({
  AuditService: {
    logEvent: auditLogEvent
  }
}));

jest.unstable_mockModule('../src/services/patient.service.js', () => ({
  PatientService: {
    ensurePatientExistsWithTenantCheck
  }
}));

const { PatientExportService } = await import('../src/services/patient-export.service.js');

describe('PatientExportService', () => {
  beforeEach(() => {
    prismaMock.voiceNote.findMany.mockReset();
    prismaMock.medicalNote.findMany.mockReset();
    prismaMock.auditLog.findMany.mockReset();
    auditLogEvent.mockReset();
    ensurePatientExistsWithTenantCheck.mockReset();
  });

  it('throws forbidden for disallowed roles', async () => {
    await expect(
      PatientExportService.exportPatientData({
        actorUser: { id: 'u-1', role: 'STAFF', clinicId: 'c-1' },
        patientId: 'p-1',
        format: 'json'
      })
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN'
    });
  });

  it('returns patient export payload and logs audit action', async () => {
    ensurePatientExistsWithTenantCheck.mockResolvedValue({
      id: 'p-1',
      fullName: 'Jane Doe',
      age: 36,
      gender: 'female',
      phone: '555-0111',
      doctorId: 'd-1',
      clinicId: 'c-1',
      createdAt: new Date('2026-03-05T10:00:00.000Z'),
      deletedAt: null
    });

    prismaMock.voiceNote.findMany.mockResolvedValue([
      {
        id: 'v-1',
        createdAt: new Date('2026-03-05T11:00:00.000Z'),
        durationSeconds: 45,
        transcript: 'Patient reports mild headache',
        createdByUser: { id: 'd-1', name: 'Dr. A' }
      }
    ]);
    prismaMock.medicalNote.findMany.mockResolvedValue([
      {
        id: 'n-1',
        createdAt: new Date('2026-03-05T11:30:00.000Z'),
        rawInputText: 'Headache for 2 days',
        structuredOutput: 'Assessment: tension headache',
        doctor: { id: 'd-1', name: 'Dr. A' }
      }
    ]);
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        id: 'a-1',
        action: 'PATIENT_UPDATED',
        userId: 'd-1',
        entityType: 'PATIENT',
        entityId: 'p-1',
        metadata: { field: 'phone' },
        createdAt: new Date('2026-03-05T12:00:00.000Z')
      }
    ]);

    const result = await PatientExportService.exportPatientData({
      actorUser: { id: 'd-1', role: 'DOCTOR', clinicId: 'c-1' },
      patientId: 'p-1',
      format: 'pdf'
    });

    expect(result.patientProfile.id).toBe('p-1');
    expect(result.encounters).toHaveLength(1);
    expect(result.clinicalNotes).toHaveLength(1);
    expect(result.voiceNoteTranscripts).toEqual([
      {
        encounterId: 'v-1',
        createdAt: new Date('2026-03-05T11:00:00.000Z'),
        transcript: 'Patient reports mild headache'
      }
    ]);

    expect(auditLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PATIENT_EXPORT',
        entityType: 'PATIENT',
        entityId: 'p-1',
        metadata: expect.objectContaining({
          patientId: 'p-1',
          format: 'pdf'
        })
      })
    );
  });
});
