import { Router } from 'express';
import { generate, pdf } from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { generateSchema, noteIdSchema } from './validation.js';
import { generateLimiter } from '../../middlewares/rateLimit.js';

const router = Router();

router.post('/generate', generateLimiter, validate(generateSchema), generate);
router.get('/:id/pdf', validate(noteIdSchema), pdf);

export default router;
