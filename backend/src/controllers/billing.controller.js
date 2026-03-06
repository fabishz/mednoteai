import { asyncHandler } from '../utils/asyncHandler.js';
import { BillingService } from '../services/billing.service.js';

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const result = await BillingService.createCheckoutSession(req.user, req.validated.body);
  res.status(201).json({
    success: true,
    message: 'Checkout session created',
    data: result
  });
});

export const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    throw Object.assign(new Error('Missing Stripe signature'), {
      status: 400,
      code: 'INVALID_STRIPE_SIGNATURE'
    });
  }

  const result = await BillingService.handleWebhook(req.body, signature);
  res.json(result);
});
