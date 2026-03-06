import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';
import * as retentionValidator from '../validators/retention.validator.js';
import * as retentionController from '../controllers/retention.controller.js';

const router = Router();

router.get(
  '/retention',
  authorize(Permissions.PATIENT_READ),
  retentionController.getPolicy
);

router.put(
  '/retention',
  authorize(Permissions.PATIENT_READ),
  validate(retentionValidator.updateRetentionPolicySchema),
  retentionController.updatePolicy
);

export default router;
