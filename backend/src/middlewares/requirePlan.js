import { PlanGatingService } from '../services/plan-gating.service.js';

export function requirePlan(feature) {
  return async (req, res, next) => {
    try {
      if (!req.user?.clinicId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error_code: 'UNAUTHORIZED',
          meta: { requestId: req.requestId }
        });
      }

      const planContext = await PlanGatingService.getClinicPlanContext(req.user.clinicId);
      req.planContext = planContext;

      const decision = PlanGatingService.evaluateFeatureGate(feature, planContext, req);
      if (decision.allowed) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: decision.message || 'Your current subscription plan does not allow this feature.',
        error_code: 'PLAN_FEATURE_RESTRICTED',
        data: {
          feature,
          plan: planContext.plan,
          limits: planContext.limits,
          usage: planContext.usage
        },
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      return next(err);
    }
  };
}
