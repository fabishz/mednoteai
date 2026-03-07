const express = require('express');
const router = express.Router();
const featureFlagService = require('../services/feature-flag.service');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { Roles } = require('../constants/roles');

/**
 * GET /api/feature-flags
 * Get all feature flags for the current clinic
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const clinicId = req.user?.clinicId || null;
    const flags = await featureFlagService.getAll(clinicId);
    res.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

/**
 * GET /api/feature-flags/:name
 * Check if a specific feature is enabled
 */
router.get('/:name', authenticate, async (req, res) => {
  try {
    const { name } = req.params;
    const clinicId = req.user?.clinicId || null;
    const enabled = await featureFlagService.isEnabled(name, clinicId);
    res.json({ name, enabled });
  } catch (error) {
    console.error('Error checking feature flag:', error);
    res.status(500).json({ error: 'Failed to check feature flag' });
  }
});

/**
 * POST /api/feature-flags
 * Create or update a feature flag (admin only)
 */
router.post('/', authenticate, authorize([Roles.SUPER_ADMIN, Roles.ADMIN]), async (req, res) => {
  try {
    const { name, enabled, clinicId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Feature flag name is required' });
    }
    
    // Only SUPER_ADMIN can create global flags
    const isGlobalFlag = !clinicId;
    if (isGlobalFlag && req.user.role !== Roles.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Only super admins can create global feature flags' });
    }
    
    // Admins can only modify flags for their own clinic
    if (clinicId && clinicId !== req.user.clinicId && req.user.role !== Roles.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Cannot modify feature flags for other clinics' });
    }
    
    const flag = enabled 
      ? await featureFlagService.enable(name, clinicId || null)
      : await featureFlagService.disable(name, clinicId || null);
    
    res.json({ flag });
  } catch (error) {
    console.error('Error creating/updating feature flag:', error);
    res.status(500).json({ error: 'Failed to create/update feature flag' });
  }
});

/**
 * PUT /api/feature-flags/:name
 * Enable or disable a feature flag (admin only)
 */
router.put('/:name', authenticate, authorize([Roles.SUPER_ADMIN, Roles.ADMIN]), async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled, clinicId } = req.body;
    
    // Only SUPER_ADMIN can modify global flags
    const currentFlags = await featureFlagService.getAll(clinicId || null);
    const existingFlag = currentFlags.find(f => f.name === name);
    
    if (!existingFlag?.clinicId && req.user.role !== Roles.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Only super admins can modify global feature flags' });
    }
    
    // Admins can only modify flags for their own clinic
    if (clinicId && clinicId !== req.user.clinicId && req.user.role !== Roles.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Cannot modify feature flags for other clinics' });
    }
    
    const flag = enabled 
      ? await featureFlagService.enable(name, clinicId || null)
      : await featureFlagService.disable(name, clinicId || null);
    
    res.json({ flag });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
});

/**
 * DELETE /api/feature-flags/:name
 * Delete a feature flag (admin only)
 */
router.delete('/:name', authenticate, authorize([Roles.SUPER_ADMIN, Roles.ADMIN]), async (req, res) => {
  try {
    const { name } = req.params;
    const { clinicId } = req.query;
    
    // Only SUPER_ADMIN can delete global flags
    if (!clinicId && req.user.role !== Roles.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Only super admins can delete global feature flags' });
    }
    
    // Admins can only delete flags for their own clinic
    if (clinicId && clinicId !== req.user.clinicId && req.user.role !== Roles.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Cannot delete feature flags for other clinics' });
    }
    
    await featureFlagService.delete(name, clinicId || null);
    res.json({ message: 'Feature flag deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    res.status(500).json({ error: 'Failed to delete feature flag' });
  }
});

module.exports = router;
