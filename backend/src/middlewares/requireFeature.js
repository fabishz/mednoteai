const featureFlagService = require('../services/feature-flag.service');

/**
 * Middleware factory to require a specific feature flag to be enabled
 * @param {string} featureName - The name of the feature flag
 * @returns {Function} - Express middleware function
 */
const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      // Get clinicId from the authenticated user (if available)
      const clinicId = req.user?.clinicId || req.clinicId || null;
      
      // Check if the feature is enabled
      const isEnabled = await featureFlagService.isEnabled(featureName, clinicId);
      
      if (!isEnabled) {
        return res.status(403).json({
          error: 'Feature Not Available',
          message: `The "${featureName}" feature is currently disabled.`,
          code: 'FEATURE_DISABLED',
        });
      }
      
      next();
    } catch (error) {
      console.error(`Error in requireFeature middleware for "${featureName}":`, error);
      // Default to deny on error for safety
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Unable to verify feature availability.',
        code: 'FEATURE_CHECK_ERROR',
      });
    }
  };
};

module.exports = requireFeature;
