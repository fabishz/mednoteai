import { Router } from 'express';
import * as templateController from '../controllers/template.controller.js';
import { validate } from '../middlewares/validate.js';
import * as templateValidator from '../validators/template.validator.js';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';

const router = Router();

router.get(
  '/',
  authorize(Permissions.TEMPLATE_READ),
  templateController.list
);

router.post(
  '/',
  authorize(Permissions.TEMPLATE_CREATE),
  validate(templateValidator.createTemplateSchema),
  templateController.create
);

router.put(
  '/:id',
  authorize(Permissions.TEMPLATE_UPDATE),
  validate(templateValidator.updateTemplateSchema),
  templateController.update
);

router.delete(
  '/:id',
  authorize(Permissions.TEMPLATE_DELETE),
  validate(templateValidator.templateIdSchema),
  templateController.remove
);

export default router;
