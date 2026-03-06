import { Router } from 'express';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';
import { validate } from '../middlewares/validate.js';
import * as auditLogValidator from '../validators/audit-log.validator.js';
import * as auditLogController from '../controllers/audit-log.controller.js';

const router = Router();

router.get(
  '/',
  authorize(Permissions.AUDIT_VIEW),
  validate(auditLogValidator.listAuditLogsSchema),
  auditLogController.list
);

export default router;
