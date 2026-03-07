import { Router } from 'express';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';
import { validate } from '../middlewares/validate.js';
import requireFeature from '../middlewares/requireFeature.js';
import * as voiceNoteController from '../controllers/voice-note.controller.js';
import * as voiceNoteValidator from '../validators/voice-note.validator.js';

const router = Router();

router.post(
  '/upload-url',
  authorize(Permissions.NOTE_CREATE),
  requireFeature('voice_notes'),
  validate(voiceNoteValidator.uploadUrlSchema),
  voiceNoteController.getUploadUrl
);

router.post(
  '/',
  authorize(Permissions.NOTE_CREATE),
  requireFeature('voice_notes'),
  validate(voiceNoteValidator.createVoiceNoteSchema),
  voiceNoteController.create
);

router.get(
  '/:id/playback',
  authorize(Permissions.NOTE_READ),
  requireFeature('voice_notes'),
  validate(voiceNoteValidator.voiceNoteIdSchema),
  voiceNoteController.getPlaybackUrl
);

export default router;
