import { randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../config/prisma.js';
import { s3Client, s3VoiceBucket } from '../config/s3.js';
import { assertValidVoiceUpload } from '../utils/voiceFileValidation.js';
import { sanitizePatientId } from '../utils/voiceKeySecurity.js';

const MIME_EXTENSION = Object.freeze({
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a'
});

export class VoiceUploadService {
  static async generateUploadUrl({ patientId, mimeType, fileSize, actorUser }) {
    if (!actorUser?.clinicId) {
      throw Object.assign(new Error('Missing tenant context'), { status: 403, code: 'FORBIDDEN' });
    }

    assertValidVoiceUpload({ mimeType, fileSizeBytes: fileSize });
    const safePatientId = sanitizePatientId(patientId);

    const patient = await prisma.patient.findFirst({
      where: { id: safePatientId },
      select: { id: true }
    });

    if (!patient) {
      throw Object.assign(new Error('Patient not found'), { status: 404, code: 'PATIENT_NOT_FOUND' });
    }

    const extension = MIME_EXTENSION[mimeType] ?? 'webm';
    const objectKey = `${actorUser.clinicId}/patients/${safePatientId}/voice-notes/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: s3VoiceBucket,
      Key: objectKey,
      ContentType: mimeType,
      ContentLength: fileSize,
      ServerSideEncryption: 'AES256'
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return { uploadUrl, objectKey };
  }
}
