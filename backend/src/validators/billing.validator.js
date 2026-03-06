import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    plan: z.enum(['Starter', 'Professional', 'Clinic']),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional()
  })
});

export const stripeWebhookSchema = z.object({
  headers: z.object({
    'stripe-signature': z.string().min(1, 'Missing Stripe signature')
  })
});
