import { prisma } from '../config/prisma.js';
import { AuditAction, AuditEntityType } from '../constants/audit.js';
import { Roles, normalizeRole } from '../constants/roles.js';
import { AuditService } from './audit.service.js';
import { PatientService } from './patient.service.js';

const EXPORT_ALLOWED_ROLES = new Set([
  Roles.CLINIC_ADMIN,
  Roles.DOCTOR
]);

function assertExportRole(user) {
  const role = normalizeRole(user?.role);
  if (!EXPORT_ALLOWED_ROLES.has(role)) {
    throw Object.assign(new Error('You do not have permission to export patient data'), {
      status: 403,
      code: 'FORBIDDEN'
    });
  }
}

function mapPatientProfile(patient) {
  return {
    id: patient.id,
    fullName: patient.fullName,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    doctorId: patient.doctorId,
    clinicId: patient.clinicId,
    createdAt: patient.createdAt,
    deletedAt: patient.deletedAt
  };
}

function mapEncounter(voiceNote) {
  return {
    id: voiceNote.id,
    createdAt: voiceNote.createdAt,
    durationSeconds: voiceNote.durationSeconds,
    transcript: voiceNote.transcript,
    createdBy: voiceNote.createdByUser ? {
      id: voiceNote.createdByUser.id,
      name: voiceNote.createdByUser.name
    } : null
  };
}

function mapClinicalNote(note) {
  return {
    id: note.id,
    createdAt: note.createdAt,
    rawInputText: note.rawInputText,
    structuredOutput: note.structuredOutput,
    doctor: note.doctor ? {
      id: note.doctor.id,
      name: note.doctor.name
    } : null
  };
}

function mapAuditRecord(record) {
  return {
    id: record.id,
    action: record.action,
    userId: record.userId,
    entityType: record.entityType,
    entityId: record.entityId,
    metadata: record.metadata,
    createdAt: record.createdAt
  };
}

export class PatientExportService {
  static async exportPatientData({ actorUser, patientId, format }) {
    assertExportRole(actorUser);

    const patient = await PatientService.ensurePatientExistsWithTenantCheck(patientId, {
      includeDeleted: true
    });

    const [encounters, clinicalNotes, auditRecords] = await Promise.all([
      prisma.voiceNote.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true
            }
          }
        },
        __includeDeleted: true
      }),
      prisma.medicalNote.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            select: {
              id: true,
              name: true
            }
          }
        },
        __includeDeleted: true
      }),
      prisma.auditLog.findMany({
        where: {
          entityType: AuditEntityType.PATIENT,
          entityId: patientId
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const generatedAt = new Date();
    const encounterHistory = encounters.map(mapEncounter);

    const payload = {
      patientProfile: mapPatientProfile(patient),
      encounters: encounterHistory,
      clinicalNotes: clinicalNotes.map(mapClinicalNote),
      voiceNoteTranscripts: encounterHistory
        .filter((item) => typeof item.transcript === 'string' && item.transcript.trim().length > 0)
        .map((item) => ({
          encounterId: item.id,
          createdAt: item.createdAt,
          transcript: item.transcript
        })),
      auditMetadata: {
        generatedAt: generatedAt.toISOString(),
        generatedBy: {
          userId: actorUser.id,
          clinicId: actorUser.clinicId,
          role: normalizeRole(actorUser.role)
        },
        records: auditRecords.map(mapAuditRecord)
      }
    };

    await AuditService.logEvent({
      action: AuditAction.PATIENT_EXPORT,
      entityType: AuditEntityType.PATIENT,
      entityId: patientId,
      metadata: {
        patientId,
        format,
        timestamp: generatedAt.toISOString()
      }
    });

    return payload;
  }
}
