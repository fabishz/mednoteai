import { prisma } from '../config/prisma.js';
import { getPlanRules, normalizePlan, PlanFeature, SubscriptionPlans } from '../constants/subscriptionPlans.js';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);
const DOCTOR_ROLE_VALUES = new Set(['DOCTOR', 'ADMIN']);

function shouldEnforceDoctorLimit(req) {
  const requestedRole = req?.validated?.body?.role ?? req?.body?.role;
  return DOCTOR_ROLE_VALUES.has(String(requestedRole || '').toUpperCase());
}

function isUnlimited(limitValue) {
  return limitValue === null || typeof limitValue === 'undefined';
}

export class PlanGatingService {
  static async resolveClinicSubscription(clinicId) {
    const subscription = await prisma.subscription.findFirst({ where: { clinicId } });
    if (!subscription) {
      return {
        source: 'default',
        plan: SubscriptionPlans.STARTER,
        status: 'default_starter',
        currentPeriodEnd: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      };
    }

    const normalizedPlan = normalizePlan(subscription.plan);
    const isActive = ACTIVE_SUBSCRIPTION_STATUSES.has(String(subscription.status || '').toLowerCase());

    if (!isActive) {
      return {
        ...subscription,
        source: 'downgraded_from_inactive_subscription',
        plan: SubscriptionPlans.STARTER,
        originalPlan: normalizedPlan
      };
    }

    return {
      ...subscription,
      source: 'subscription',
      plan: normalizedPlan
    };
  }

  static async getUsage(clinicId) {
    const [doctorCount, patientCount] = await Promise.all([
      prisma.user.count({
        where: {
          role: { in: Array.from(DOCTOR_ROLE_VALUES) }
        }
      }),
      prisma.patient.count()
    ]);

    return { doctorCount, patientCount };
  }

  static async getClinicPlanContext(clinicId) {
    const subscription = await this.resolveClinicSubscription(clinicId);
    const rules = getPlanRules(subscription.plan);
    const usage = await this.getUsage(clinicId);

    return {
      plan: subscription.plan,
      status: subscription.status,
      source: subscription.source,
      currentPeriodEnd: subscription.currentPeriodEnd,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      limits: {
        maxDoctors: rules.maxDoctors,
        maxPatients: rules.maxPatients
      },
      usage,
      features: {
        [PlanFeature.ADVANCED_REPORTS]: Boolean(rules.features[PlanFeature.ADVANCED_REPORTS]),
        canAddDoctor: isUnlimited(rules.maxDoctors) ? true : usage.doctorCount < rules.maxDoctors,
        canAddPatient: isUnlimited(rules.maxPatients) ? true : usage.patientCount < rules.maxPatients
      }
    };
  }

  static evaluateFeatureGate(feature, planContext, req) {
    if (feature === PlanFeature.ADVANCED_REPORTS) {
      const allowed = Boolean(planContext.features[PlanFeature.ADVANCED_REPORTS]);
      return {
        allowed,
        message: allowed ? null : 'Advanced reports are available on Professional and Clinic plans.'
      };
    }

    if (feature === PlanFeature.DOCTOR_LIMIT) {
      if (!shouldEnforceDoctorLimit(req)) {
        return { allowed: true, message: null };
      }

      const { maxDoctors } = planContext.limits;
      if (isUnlimited(maxDoctors)) {
        return { allowed: true, message: null };
      }

      const allowed = planContext.usage.doctorCount < maxDoctors;
      return {
        allowed,
        message: allowed ? null : `Doctor limit reached for ${planContext.plan} plan (${maxDoctors} max).`
      };
    }

    if (feature === PlanFeature.PATIENT_LIMIT) {
      const { maxPatients } = planContext.limits;
      if (isUnlimited(maxPatients)) {
        return { allowed: true, message: null };
      }

      const allowed = planContext.usage.patientCount < maxPatients;
      return {
        allowed,
        message: allowed ? null : `Patient limit reached for ${planContext.plan} plan (${maxPatients} max).`
      };
    }

    return {
      allowed: false,
      message: `Unknown plan feature gate: ${feature}`
    };
  }
}
