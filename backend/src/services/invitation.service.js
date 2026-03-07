const { prisma } = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Invitation Service
 * Handles clinic staff invitations and onboarding progress
 */
class InvitationService {
  /**
   * Create an invitation to join a clinic
   * @param {string} email - Email address of the invitee
   * @param {string} clinicId - ID of the clinic
   * @param {string} role - Role to assign (default: DOCTOR)
   * @param {string} invitedById - ID of the user sending the invitation
   * @returns {Promise<Object>} - Created invitation
   */
  async createInvitation(email, clinicId, role = 'DOCTOR', invitedById) {
    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        clinicId: clinicId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        clinicId,
        role,
        token,
        expiresAt,
        invitedById,
      },
      include: {
        clinic: true,
        invitedBy: {
          select: { name: true },
        },
      },
    });

    // TODO: Send invitation email
    await this.sendInvitationEmail(invitation);

    return invitation;
  }

  /**
   * Send invitation email
   * @param {Object} invitation - Invitation object
   */
  async sendInvitationEmail(invitation) {
    // TODO: Implement email sending
    // For now, just log the invitation
    console.log(`
      ========================================
      INVITATION EMAIL
      ========================================
      To: ${invitation.email}
      Clinic: ${invitation.clinic.name}
      Role: ${invitation.role}
      Invited by: ${invitation.invitedBy.name}
      Expires: ${invitation.expiresAt}
      Join link: /join/${invitation.token}
      ========================================
    `);
    
    // In production, integrate with email service (SendGrid, SES, etc.)
    return true;
  }

  /**
   * Accept an invitation
   * @param {string} token - Invitation token
   * @param {string} userId - ID of the user accepting
   * @returns {Promise<Object>} - Updated invitation
   */
  async acceptInvitation(token, userId) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { clinic: true },
    });

    if (!invitation) {
      throw new Error('Invalid invitation');
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation has already been used or expired');
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Invitation has expired');
    }

    // Update user clinic association
    await prisma.user.update({
      where: { id: userId },
      data: {
        clinicId: invitation.clinicId,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    return prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });
  }

  /**
   * Get all invitations for a clinic
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<Array>} - List of invitations
   */
  async getClinicInvitations(clinicId) {
    return prisma.invitation.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancel an invitation
   * @param {string} invitationId - ID of the invitation
   * @param {string} clinicId - ID of the clinic (for authorization)
   */
  async cancelInvitation(invitationId, clinicId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.clinicId !== clinicId) {
      throw new Error('Invitation not found');
    }

    if (invitation.status === 'ACCEPTED') {
      throw new Error('Cannot cancel an accepted invitation');
    }

    return prisma.invitation.delete({
      where: { id: invitationId },
    });
  }

  /**
   * Validate invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object|null>} - Invitation or null
   */
  async validateToken(token) {
    return prisma.invitation.findUnique({
      where: { token },
      include: { clinic: true },
    });
  }
}

module.exports = new InvitationService();
