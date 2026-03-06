import { z } from 'zod';
import { ALLOWED_VOICE_MIME_TYPES, MAX_VOICE_FILE_SIZE_BYTES } from '../utils/voiceFileValidation.js';

export const uploadUrlSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    mimeType: z.enum(ALLOWED_VOICE_MIME_TYPES),
    fileSize: z.number().int().positive().max(MAX_VOICE_FILE_SIZE_BYTES)
  })
});

export const createVoiceNoteSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    audioKey: z.string().min(1),
    durationSeconds: z.number().int().positive().max(3600),
    fileSizeBytes: z.number().int().positive().max(MAX_VOICE_FILE_SIZE_BYTES),
    mimeType: z.enum(ALLOWED_VOICE_MIME_TYPES),
    transcript: z.string().max(20000).optional()
  })
});

export const voiceNoteIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid voice note ID')
  })
});

export const listVoiceNotesSchema = z.object({
  query: z.object({
    page: z.preprocess((val) => Number(val || 1), z.number().int().min(1)).default(1),
    limit: z.preprocess((val) => Number(val || 20), z.number().int().min(1).max(100)).default(20)
  })
});
