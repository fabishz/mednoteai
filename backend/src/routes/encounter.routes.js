import { Router } from 'express';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';
import { validate } from '../middlewares/validate.js';
import * as voiceNoteController from '../controllers/voice-note.controller.js';
import * as voiceNoteValidator from '../validators/voice-note.validator.js';

const router = Router();

router.get(
  '/',
  authorize(Permissions.NOTE_READ),
  validate(voiceNoteValidator.listVoiceNotesSchema),
  voiceNoteController.listEncounters
);

export default router;
