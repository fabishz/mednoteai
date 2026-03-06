import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { getStripeClient } from '../config/stripe.js';
import { Roles } from '../constants/roles.js';
import { runWithRequestContext } from '../middlewares/requestContext.js';

const PLAN_TO_ENUM = Object.freeze({
  Starter: 'STARTER',
  Professional: 'PROFESSIONAL',
  Clinic: 'CLINIC'
});

const ENUM_TO_PLAN = Object.freeze({
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  CLINIC: 'Clinic'
});

function getPriceIdForPlan(plan) {
  if (plan === 'Starter') return env.stripePriceStarter;
  if (plan === 'Professional') return env.stripePriceProfessional;
  if (plan === 'Clinic') return env.stripePriceClinic;
  return null;
}

function inferPlanFromPriceId(priceId) {
  if (!priceId) return null;
  if (priceId === env.stripePriceStarter) return 'STARTER';
  if (priceId === env.stripePriceProfessional) return 'PROFESSIONAL';
  if (priceId === env.stripePriceClinic) return 'CLINIC';
  return null;
}

function resolveCheckoutUrls(payload) {
  const successUrl = payload.successUrl ?? env.billingSuccessUrl;
  const cancelUrl = payload.cancelUrl ?? env.billingCancelUrl;

  if (!successUrl || !cancelUrl) {
    throw Object.assign(new Error('Billing redirect URLs are not configured'), {
      status: 400,
      code: 'BILLING_URLS_NOT_CONFIGURED'
    });
  }

  return { successUrl, cancelUrl };
}

async function upsertSubscriptionByClinic({
  clinicId,
  stripeCustomerId,
  stripeSubscriptionId,
  plan,
  status,
  currentPeriodEnd
}) {
  const existing = await prisma.subscription.findFirst({ where: { clinicId } });

  if (!existing) {
    return prisma.subscription.create({
      data: {
        clinicId,
        stripeCustomerId,
        stripeSubscriptionId,
        plan,
        status,
        currentPeriodEnd
      }
    });
  }

  return prisma.subscription.update({
    where: { id: existing.id },
    data: {
      stripeCustomerId,
      stripeSubscriptionId,
      plan,
      status,
      currentPeriodEnd
    }
  });
}

function extractPeriodEnd(subscriptionObj) {
  if (!subscriptionObj?.current_period_end) {
    return null;
  }
  return new Date(subscriptionObj.current_period_end * 1000);
}

export class BillingService {
  static async createCheckoutSession(user, payload) {
    const stripe = getStripeClient();
    const { successUrl, cancelUrl } = resolveCheckoutUrls(payload);
    const priceId = getPriceIdForPlan(payload.plan);

    if (!priceId) {
      throw Object.assign(new Error(`Stripe price ID is not configured for plan: ${payload.plan}`), {
        status: 500,
        code: 'PRICE_NOT_CONFIGURED'
      });
    }

    const existing = await prisma.subscription.findFirst({ where: { clinicId: user.clinicId } });

    let stripeCustomerId = existing?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { clinicId: user.clinicId }
      });
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.clinicId,
      metadata: {
        clinicId: user.clinicId,
        plan: payload.plan
      },
      subscription_data: {
        metadata: {
          clinicId: user.clinicId,
          plan: payload.plan
        }
      }
    });

    await upsertSubscriptionByClinic({
      clinicId: user.clinicId,
      stripeCustomerId,
      stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
      plan: PLAN_TO_ENUM[payload.plan],
      status: existing?.status ?? 'checkout_pending',
      currentPeriodEnd: existing?.currentPeriodEnd ?? null
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url
    };
  }

  static async handleWebhook(rawBody, signature) {
    if (!env.stripeWebhookSecret) {
      throw Object.assign(new Error('Stripe webhook secret is not configured'), {
        status: 500,
        code: 'STRIPE_WEBHOOK_NOT_CONFIGURED'
      });
    }

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

    await runWithRequestContext(
      { user: { id: 'SYSTEM_STRIPE_WEBHOOK', role: Roles.SUPER_ADMIN, clinicId: null } },
      async () => {
        switch (event.type) {
          case 'invoice.paid':
            await this.handleInvoicePaid(event.data.object, stripe);
            break;
          case 'customer.subscription.updated':
            await this.handleSubscriptionUpdated(event.data.object);
            break;
          case 'customer.subscription.deleted':
            await this.handleSubscriptionDeleted(event.data.object);
            break;
          default:
            break;
        }
      }
    );

    return { received: true };
  }

  static async handleInvoicePaid(invoice, stripe) {
    if (!invoice.subscription) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    await this.upsertFromStripeSubscription(subscription);
  }

  static async handleSubscriptionUpdated(subscription) {
    await this.upsertFromStripeSubscription(subscription);
  }

  static async handleSubscriptionDeleted(subscription) {
    await this.upsertFromStripeSubscription(subscription);
  }

  static async upsertFromStripeSubscription(subscription) {
    const stripeSubscriptionId = subscription.id;
    const stripeCustomerId = String(subscription.customer);
    const priceId = subscription.items?.data?.[0]?.price?.id;

    let plan = inferPlanFromPriceId(priceId);
    const metadataPlan = PLAN_TO_ENUM[subscription.metadata?.plan];
    if (!plan && metadataPlan) {
      plan = metadataPlan;
    }

    const existingBySubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId }
    });

    const existingByCustomer = await prisma.subscription.findFirst({
      where: { stripeCustomerId }
    });

    const existing = existingBySubscription ?? existingByCustomer;
    const metadataClinicId = subscription.metadata?.clinicId || null;
    const clinicId = existing?.clinicId ?? metadataClinicId;

    if (!clinicId) {
      return;
    }

    const status = String(subscription.status);
    const currentPeriodEnd = extractPeriodEnd(subscription);

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          stripeCustomerId,
          stripeSubscriptionId,
          status,
          currentPeriodEnd,
          plan: plan ?? existing.plan
        }
      });
      return;
    }

    await prisma.subscription.create({
      data: {
        clinicId,
        stripeCustomerId,
        stripeSubscriptionId,
        plan: plan ?? 'STARTER',
        status,
        currentPeriodEnd
      }
    });
  }

  static serializeSubscription(subscription) {
    return {
      ...subscription,
      planLabel: ENUM_TO_PLAN[subscription.plan] ?? subscription.plan
    };
  }
}
