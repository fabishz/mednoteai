import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../config/prisma.js';
import { s3Client, s3VoiceBucket } from '../config/s3.js';
import { assertSafeVoiceObjectKey } from '../utils/voiceKeySecurity.js';

export class VoicePlaybackService {
  static async getPlaybackUrl({ actorUser, voiceNoteId }) {
    const voiceNote = await prisma.voiceNote.findFirst({
      where: { id: voiceNoteId },
      select: {
        id: true,
        clinicId: true,
        patientId: true,
        audioKey: true
      }
    });

    if (!voiceNote) {
      throw Object.assign(new Error('Voice note not found'), { status: 404, code: 'VOICE_NOTE_NOT_FOUND' });
    }

    assertSafeVoiceObjectKey({
      clinicId: voiceNote.clinicId,
      patientId: voiceNote.patientId,
      audioKey: voiceNote.audioKey
    });

    const command = new GetObjectCommand({
      Bucket: s3VoiceBucket,
      Key: voiceNote.audioKey
    });

    const playbackUrl = await getSignedUrl(s3Client, command, { expiresIn: 120 });
    return { playbackUrl };
  }
}
