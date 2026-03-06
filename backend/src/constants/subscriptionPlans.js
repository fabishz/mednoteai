export const SubscriptionPlans = Object.freeze({
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  CLINIC: 'CLINIC'
});

export const PlanFeature = Object.freeze({
  ADVANCED_REPORTS: 'advanced_reports',
  DOCTOR_LIMIT: 'doctor_limit',
  PATIENT_LIMIT: 'patient_limit'
});

const PLAN_ORDER = Object.freeze({
  [SubscriptionPlans.STARTER]: 1,
  [SubscriptionPlans.PROFESSIONAL]: 2,
  [SubscriptionPlans.CLINIC]: 3
});

export const PLAN_MATRIX = Object.freeze({
  [SubscriptionPlans.STARTER]: {
    maxDoctors: 1,
    maxPatients: 100,
    features: {
      [PlanFeature.ADVANCED_REPORTS]: false
    }
  },
  [SubscriptionPlans.PROFESSIONAL]: {
    maxDoctors: 5,
    maxPatients: 2000,
    features: {
      [PlanFeature.ADVANCED_REPORTS]: true
    }
  },
  [SubscriptionPlans.CLINIC]: {
    maxDoctors: null,
    maxPatients: null,
    features: {
      [PlanFeature.ADVANCED_REPORTS]: true
    }
  }
});

export function normalizePlan(plan) {
  if (plan === SubscriptionPlans.PROFESSIONAL) return SubscriptionPlans.PROFESSIONAL;
  if (plan === SubscriptionPlans.CLINIC) return SubscriptionPlans.CLINIC;
  return SubscriptionPlans.STARTER;
}

export function isPlanAtLeast(plan, requiredPlan) {
  const normalizedPlan = normalizePlan(plan);
  const normalizedRequired = normalizePlan(requiredPlan);
  return PLAN_ORDER[normalizedPlan] >= PLAN_ORDER[normalizedRequired];
}

export function getPlanRules(plan) {
  return PLAN_MATRIX[normalizePlan(plan)];
}
