import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    plan: z.enum(['Starter', 'Professional', 'Clinic']),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional()
  })
});
