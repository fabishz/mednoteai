import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';
import { requirePlan } from '../middlewares/requirePlan.js';
import { PlanFeature } from '../constants/subscriptionPlans.js';

const router = Router();

router.get(
  '/stats',
  authorize(Permissions.PATIENT_READ),
  requirePlan(PlanFeature.ADVANCED_REPORTS),
  dashboardController.stats
);

export default router;
