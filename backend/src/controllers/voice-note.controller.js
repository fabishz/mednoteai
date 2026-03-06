import { asyncHandler } from '../utils/asyncHandler.js';
import { VoiceUploadService } from '../services/voice-upload.service.js';
import { VoiceNoteService } from '../services/voice-note.service.js';
import { VoicePlaybackService } from '../services/voice-playback.service.js';

export const getUploadUrl = asyncHandler(async (req, res) => {
  const data = await VoiceUploadService.generateUploadUrl({
    patientId: req.validated.body.patientId,
    mimeType: req.validated.body.mimeType,
    fileSize: req.validated.body.fileSize,
    actorUser: req.user
  });

  res.status(201).json({
    success: true,
    data
  });
});

export const create = asyncHandler(async (req, res) => {
  const voiceNote = await VoiceNoteService.createVoiceNote({
    actorUser: req.user,
    ...req.validated.body
  });

  res.status(201).json({
    success: true,
    data: voiceNote
  });
});

export const getPlaybackUrl = asyncHandler(async (req, res) => {
  const data = await VoicePlaybackService.getPlaybackUrl({
    actorUser: req.user,
    voiceNoteId: req.validated.params.id
  });

  res.json({
    success: true,
    data
  });
});
