import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';

const router = Router();

router.get(
  '/stats',
  authorize(Permissions.PATIENT_READ),
  dashboardController.stats
);

export default router;
