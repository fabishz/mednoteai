import { prisma } from '../config/prisma.js';
import { AuditAction, AuditEntityType } from '../constants/audit.js';
import { AuditService } from './audit.service.js';
import { assertValidVoiceUpload } from '../utils/voiceFileValidation.js';
import { assertSafeVoiceObjectKey, sanitizePatientId } from '../utils/voiceKeySecurity.js';

export class VoiceNoteService {
  static async createVoiceNote({
    actorUser,
    patientId,
    audioKey,
    durationSeconds,
    fileSizeBytes,
    mimeType,
    transcript
  }) {
    if (!actorUser?.clinicId) {
      throw Object.assign(new Error('Missing tenant context'), { status: 403, code: 'FORBIDDEN' });
    }

    assertValidVoiceUpload({ mimeType, fileSizeBytes });
    const safePatientId = sanitizePatientId(patientId);
    assertSafeVoiceObjectKey({ clinicId: actorUser.clinicId, patientId: safePatientId, audioKey });

    const patient = await prisma.patient.findFirst({
      where: { id: safePatientId },
      select: { id: true }
    });

    if (!patient) {
      throw Object.assign(new Error('Patient not found'), { status: 404, code: 'PATIENT_NOT_FOUND' });
    }

    const voiceNote = await prisma.voiceNote.create({
      data: {
        clinicId: actorUser.clinicId,
        patientId: safePatientId,
        createdByUserId: actorUser.id,
        audioKey,
        transcript: transcript || null,
        durationSeconds,
        fileSizeBytes,
        mimeType
      }
    });

    await AuditService.logEvent({
      action: AuditAction.NOTE_CREATED,
      entityType: AuditEntityType.VOICE_NOTE,
      entityId: voiceNote.id,
      metadata: {
        patientId: safePatientId,
        durationSeconds,
        fileSizeBytes,
        mimeType
      }
    });

    return voiceNote;
  }
}
