import Stripe from 'stripe';
import { env } from './env.js';

let stripeClient = null;

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw Object.assign(new Error('Stripe secret key is not configured'), {
      status: 500,
      code: 'STRIPE_NOT_CONFIGURED'
    });
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: '2024-06-20'
    });
  }

  return stripeClient;
}
