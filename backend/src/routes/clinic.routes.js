const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { Roles } = require('../constants/roles');
const invitationService = require('../services/invitation.service');
const onboardingService = require('../services/onboarding.service');
const { prisma } = require('../config/prisma');

/**
 * POST /api/clinics/invite
 * Invite staff members to join the clinic
 */
router.post('/invite', authenticate, authorize([Roles.SUPER_ADMIN, Roles.ADMIN]), async (req, res) => {
  try {
    const { email, role = 'DOCTOR' } = req.body;
    const clinicId = req.user.clinicId;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate role
    const validRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'STAFF'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const invitation = await invitationService.createInvitation(
      email,
      clinicId,
      role,
      req.user.id
    );

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/clinics/invitations
 * Get all pending invitations for the clinic
 */
router.get('/invitations', authenticate, authorize([Roles.SUPER_ADMIN, Roles.ADMIN]), async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const invitations = await invitationService.getClinicInvitations(clinicId);

    res.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

/**
 * DELETE /api/clinics/invitations/:id
 * Cancel an invitation
 */
router.delete('/invitations/:id', authenticate, authorize([Roles.SUPER_ADMIN, Roles.ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    await invitationService.cancelInvitation(id, clinicId);

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/clinics/onboarding
 * Get onboarding progress for the clinic
 */
router.get('/onboarding', authenticate, async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const status = await onboardingService.getStatusSummary(clinicId);

    res.json(status);
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

/**
 * POST /api/clinics/onboarding/complete
 * Mark a step as complete
 */
router.post('/onboarding/complete', authenticate, async (req, res) => {
  try {
    const { step } = req.body;
    const clinicId = req.user.clinicId;

    if (!step) {
      return res.status(400).json({ error: 'Step is required' });
    }

    const progress = await onboardingService.completeStep(clinicId, step);

    res.json({
      message: `Step ${step} completed`,
      progress,
    });
  } catch (error) {
    console.error('Error completing onboarding step:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/clinics/onboarding/initialize
 * Initialize onboarding for a clinic (first setup)
 */
router.post('/onboarding/initialize', authenticate, authorize([Roles.SUPER_ADMIN, Roles.ADMIN]), async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    const progress = await onboardingService.initialize(clinicId);

    res.json({
      message: 'Onboarding initialized',
      progress,
    });
  } catch (error) {
    console.error('Error initializing onboarding:', error);
    res.status(500).json({ error: 'Failed to initialize onboarding' });
  }
});

/**
 * POST /api/clinics/join/:token
 * Accept an invitation and join a clinic
 */
router.post('/join/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const invitation = await invitationService.acceptInvitation(token, userId);

    res.json({
      message: 'Successfully joined the clinic',
      invitation,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/clinics/validate-invite/:token
 * Validate an invitation token (public)
 */
router.get('/validate-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await invitationService.validateToken(token);

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invitation is no longer valid' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    res.json({
      valid: true,
      clinic: {
        name: invitation.clinic.name,
      },
      role: invitation.role,
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(500).json({ error: 'Failed to validate invitation' });
  }
});

module.exports = router;
