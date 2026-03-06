import { Router } from 'express';
import { create, list, getById, remove } from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { createPatientSchema, patientIdSchema } from './validation.js';

const router = Router();

router.post('/', validate(createPatientSchema), create);
router.get('/', list);
router.get('/:id', validate(patientIdSchema), getById);
router.delete('/:id', validate(patientIdSchema), remove);

export default router;
