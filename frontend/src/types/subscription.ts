export type SubscriptionPlan = 'STARTER' | 'PROFESSIONAL' | 'CLINIC';

export interface SubscriptionLimits {
  maxDoctors: number | null;
  maxPatients: number | null;
}

export interface SubscriptionUsage {
  doctorCount: number;
  patientCount: number;
}

export interface SubscriptionFeatures {
  advanced_reports: boolean;
  canAddDoctor: boolean;
  canAddPatient: boolean;
}

export interface SubscriptionContext {
  plan: SubscriptionPlan;
  status: string;
  source: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
  features: SubscriptionFeatures;
}
