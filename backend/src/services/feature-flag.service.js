const { prisma } = require('../config/prisma');

/**
 * Feature Flag Service
 * Provides methods to check and manage feature flags for safe feature rollout during beta.
 */
class FeatureFlagService {
  /**
   * Check if a feature is enabled for a clinic
   * @param {string} featureName - The name of the feature flag
   * @param {string} [clinicId] - Optional clinic ID to check clinic-specific flag
   * @returns {Promise<boolean>} - Whether the feature is enabled
   */
  async isEnabled(featureName, clinicId = null) {
    try {
      // First check for clinic-specific flag
      if (clinicId) {
        const clinicFlag = await prisma.featureFlag.findUnique({
          where: {
            name_clinicId: {
              name: featureName,
              clinicId: clinicId,
            },
          },
        });
        
        if (clinicFlag) {
          return clinicFlag.enabled;
        }
      }
      
      // Fall back to global flag (clinicId = null)
      const globalFlag = await prisma.featureFlag.findUnique({
        where: {
          name_clinicId: {
            name: featureName,
            clinicId: null,
          },
        },
      });
      
      // Default to false if flag doesn't exist
      return globalFlag ? globalFlag.enabled : false;
    } catch (error) {
      console.error(`Error checking feature flag "${featureName}":`, error);
      // Default to false on error for safety
      return false;
    }
  }

  /**
   * Enable a feature flag
   * @param {string} featureName - The name of the feature flag
   * @param {string} [clinicId] - Optional clinic ID for clinic-specific flag
   * @returns {Promise<Object>} - The created or updated feature flag
   */
  async enable(featureName, clinicId = null) {
    return prisma.featureFlag.upsert({
      where: {
        name_clinicId: {
          name: featureName,
          clinicId: clinicId,
        },
      },
      update: {
        enabled: true,
      },
      create: {
        name: featureName,
        enabled: true,
        clinicId: clinicId,
      },
    });
  }

  /**
   * Disable a feature flag
   * @param {string} featureName - The name of the feature flag
   * @param {string} [clinicId] - Optional clinic ID for clinic-specific flag
   * @returns {Promise<Object>} - The created or updated feature flag
   */
  async disable(featureName, clinicId = null) {
    return prisma.featureFlag.upsert({
      where: {
        name_clinicId: {
          name: featureName,
          clinicId: clinicId,
        },
      },
      update: {
        enabled: false,
      },
      create: {
        name: featureName,
        enabled: false,
        clinicId: clinicId,
      },
    });
  }

  /**
   * Get all feature flags for a clinic (includes global flags)
   * @param {string} [clinicId] - Optional clinic ID to get clinic-specific flags
   * @returns {Promise<Array>} - Array of feature flags
   */
  async getAll(clinicId = null) {
    const flags = await prisma.featureFlag.findMany({
      where: {
        OR: [
          { clinicId: null }, // Global flags
          { clinicId: clinicId }, // Clinic-specific flags
        ],
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Merge global and clinic-specific flags, with clinic-specific taking precedence
    const flagMap = new Map();
    
    // Add global flags first
    flags.filter(f => f.clinicId === null).forEach(f => {
      flagMap.set(f.name, f);
    });
    
    // Override with clinic-specific flags
    flags.filter(f => f.clinicId !== null).forEach(f => {
      flagMap.set(f.name, f);
    });
    
    return Array.from(flagMap.values());
  }

  /**
   * Create a new feature flag
   * @param {string} featureName - The name of the feature flag
   * @param {boolean} enabled - Whether the feature is enabled
   * @param {string} [clinicId] - Optional clinic ID for clinic-specific flag
   * @returns {Promise<Object>} - The created feature flag
   */
  async create(featureName, enabled = false, clinicId = null) {
    return prisma.featureFlag.create({
      data: {
        name: featureName,
        enabled: enabled,
        clinicId: clinicId,
      },
    });
  }

  /**
   * Delete a feature flag
   * @param {string} featureName - The name of the feature flag
   * @param {string} [clinicId] - Optional clinic ID for clinic-specific flag
   * @returns {Promise<void>}
   */
  async delete(featureName, clinicId = null) {
    await prisma.featureFlag.delete({
      where: {
        name_clinicId: {
          name: featureName,
          clinicId: clinicId,
        },
      },
    });
  }
}

module.exports = new FeatureFlagService();
