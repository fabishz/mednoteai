import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';
import * as billingValidator from '../validators/billing.validator.js';
import * as billingController from '../controllers/billing.controller.js';

const router = Router();

router.post(
  '/create-checkout-session',
  authMiddleware,
  authorize(Permissions.BILLING_MANAGE),
  validate(billingValidator.createCheckoutSessionSchema),
  billingController.createCheckoutSession
);

router.post(
  '/webhook',
  validate(billingValidator.stripeWebhookSchema),
  billingController.webhook
);

export default router;
