const { prisma } = require('../config/prisma');

/**
 * Onboarding Progress Service
 * Tracks and manages clinic onboarding steps
 */
class OnboardingService {
  // Step definitions
  STEPS = {
    CLINIC_SETUP: 'CLINIC_SETUP',
    ADD_DOCTORS: 'ADD_DOCTORS',
    ADD_PATIENTS: 'ADD_PATIENTS',
    RECORD_NOTE: 'RECORD_NOTE',
    COMPLETE: 'COMPLETE',
  };

  // Step order for progression
  STEP_ORDER = [
    'CLINIC_SETUP',
    'ADD_DOCTORS',
    'ADD_PATIENTS',
    'RECORD_NOTE',
    'COMPLETE',
  ];

  /**
   * Initialize onboarding progress for a new clinic
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<Object>} - Created onboarding progress
   */
  async initialize(clinicId) {
    // Check if already exists
    const existing = await prisma.onboardingProgress.findUnique({
      where: { clinicId },
    });

    if (existing) {
      return existing;
    }

    return prisma.onboardingProgress.create({
      data: {
        clinicId,
        currentStep: 'CLINIC_SETUP',
        completedSteps: [],
      },
    });
  }

  /**
   * Get onboarding progress for a clinic
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<Object>} - Onboarding progress
   */
  async getProgress(clinicId) {
    let progress = await prisma.onboardingProgress.findUnique({
      where: { clinicId },
    });

    if (!progress) {
      progress = await this.initialize(clinicId);
    }

    return progress;
  }

  /**
   * Mark a step as complete and advance to next
   * @param {string} clinicId - ID of the clinic
   * @param {string} step - Step to mark complete
   * @returns {Promise<Object>} - Updated onboarding progress
   */
  async completeStep(clinicId, step) {
    const progress = await this.getProgress(clinicId);
    
    // Validate step
    if (!this.STEPS[step]) {
      throw new Error('Invalid step');
    }

    // Check if step is already completed
    if (progress.completedSteps.includes(step)) {
      return progress;
    }

    // Add to completed steps
    const completedSteps = [...progress.completedSteps, step];
    
    // Find next step
    const currentIndex = this.STEP_ORDER.indexOf(step);
    const nextStep = this.STEP_ORDER[currentIndex + 1] || 'COMPLETE';
    
    // Update progress
    const updated = await prisma.onboardingProgress.update({
      where: { clinicId },
      data: {
        completedSteps,
        currentStep: nextStep,
        ...(nextStep === 'COMPLETE' ? { completedAt: new Date() } : {}),
      },
    });

    return updated;
  }

  /**
   * Check if onboarding is complete
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<boolean>} - Whether onboarding is complete
   */
  async isComplete(clinicId) {
    const progress = await this.getProgress(clinicId);
    return progress.currentStep === 'COMPLETE';
  }

  /**
   * Get next step for the clinic
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<string>} - Next step to complete
   */
  async getNextStep(clinicId) {
    const progress = await this.getProgress(clinicId);
    return progress.currentStep;
  }

  /**
   * Skip to a specific step (admin override)
   * @param {string} clinicId - ID of the clinic
   * @param {string} step - Step to skip to
   * @returns {Promise<Object>} - Updated onboarding progress
   */
  async skipToStep(clinicId, step) {
    if (!this.STEPS[step]) {
      throw new Error('Invalid step');
    }

    // Get all steps up to and including target step
    const stepIndex = this.STEP_ORDER.indexOf(step);
    const completedSteps = this.STEP_ORDER.slice(0, stepIndex + 1);

    return prisma.onboardingProgress.upsert({
      where: { clinicId },
      update: {
        currentStep: step,
        completedSteps,
        ...(step === 'COMPLETE' ? { completedAt: new Date() } : {}),
      },
      create: {
        clinicId,
        currentStep: step,
        completedSteps,
        ...(step === 'COMPLETE' ? { completedAt: new Date() } : {}),
      },
    });
  }

  /**
   * Reset onboarding progress
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<Object>} - Reset onboarding progress
   */
  async resetProgress(clinicId) {
    return prisma.onboardingProgress.update({
      where: { clinicId },
      data: {
        currentStep: 'CLINIC_SETUP',
        completedSteps: [],
        completedAt: null,
      },
    });
  }

  /**
   * Get onboarding status summary
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<Object>} - Status summary
   */
  async getStatusSummary(clinicId) {
    const progress = await this.getProgress(clinicId);
    
    // Get counts for context
    const [doctorCount, patientCount, noteCount] = await Promise.all([
      prisma.user.count({ where: { clinicId, role: { in: ['DOCTOR', 'NURSE'] } } }),
      prisma.patient.count({ where: { clinicId, deletedAt: null } }),
      prisma.medicalNote.count({ where: { clinicId, deletedAt: null } }),
    ]);

    return {
      currentStep: progress.currentStep,
      completedSteps: progress.completedSteps,
      isComplete: progress.currentStep === 'COMPLETE',
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      context: {
        doctorCount,
        patientCount,
        noteCount,
      },
      nextSteps: this.getNextStepsInfo(progress),
    };
  }

  /**
   * Get information about next steps
   * @param {Object} progress - Onboarding progress
   * @returns {Array} - Next steps with metadata
   */
  getNextStepsInfo(progress) {
    const currentIndex = this.STEP_ORDER.indexOf(progress.currentStep);
    const remainingSteps = this.STEP_ORDER.slice(currentIndex);

    return remainingSteps.map(step => ({
      id: step,
      label: this.getStepLabel(step),
      description: this.getStepDescription(step),
    }));
  }

  /**
   * Get human-readable step label
   * @param {string} step - Step key
   * @returns {string} - Step label
   */
  getStepLabel(step) {
    const labels = {
      CLINIC_SETUP: 'Clinic Setup',
      ADD_DOCTORS: 'Add Doctors',
      ADD_PATIENTS: 'Add Patients',
      RECORD_NOTE: 'Record First Note',
      COMPLETE: 'Onboarding Complete',
    };
    return labels[step] || step;
  }

  /**
   * Get step description
   * @param {string} step - Step key
   * @returns {string} - Step description
   */
  getStepDescription(step) {
    const descriptions = {
      CLINIC_SETUP: 'Set up your clinic details and preferences',
      ADD_DOCTORS: 'Invite doctors and staff to join your clinic',
      ADD_PATIENTS: 'Add your first patients to the system',
      RECORD_NOTE: 'Create your first medical note',
      COMPLETE: 'You have completed all onboarding steps',
    };
    return descriptions[step] || '';
  }
}

module.exports = new OnboardingService();
