/**
 * src/services/onboarding.ts
 * 
 * Onboarding Service
 * Handles clinic onboarding progress and invitations
 */

import { apiClient } from './api/client';

export interface OnboardingStatus {
  currentStep: string;
  completedSteps: string[];
  isComplete: boolean;
  startedAt: string;
  completedAt: string | null;
  context: {
    doctorCount: number;
    patientCount: number;
    noteCount: number;
  };
  nextSteps: {
    id: string;
    label: string;
    description: string;
  }[];
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  email: string;
  role?: string;
}

export class OnboardingService {
  /**
   * Get onboarding progress for the current clinic
   */
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const response = await apiClient.get<OnboardingStatus>('/clinics/onboarding');
    return response.data;
  }

  /**
   * Mark a step as complete
   */
  async completeStep(step: string): Promise<{ progress: any }> {
    const response = await apiClient.post<{ progress: any }>('/clinics/onboarding/complete', {
      step,
    });
    return response.data;
  }

  /**
   * Initialize onboarding for a clinic
   */
  async initializeOnboarding(): Promise<{ progress: any }> {
    const response = await apiClient.post<{ progress: any }>('/clinics/onboarding/initialize');
    return response.data;
  }

  /**
   * Send an invitation to join the clinic
   */
  async inviteStaff(data: CreateInvitationRequest): Promise<Invitation> {
    const response = await apiClient.post<{ invitation: Invitation }>('/clinics/invite', data);
    return response.data.invitation;
  }

  /**
   * Get all pending invitations for the clinic
   */
  async getInvitations(): Promise<Invitation[]> {
    const response = await apiClient.get<{ invitations: Invitation[] }>('/clinics/invitations');
    return response.data.invitations;
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    await apiClient.delete(`/clinics/invitations/${invitationId}`);
  }

  /**
   * Validate an invitation token (public)
   */
  async validateInviteToken(token: string): Promise<{ valid: boolean; clinic: { name: string }; role: string }> {
    const response = await apiClient.get<{ valid: boolean; clinic: { name: string }; role: string }>(`/clinics/validate-invite/${token}`);
    return response.data;
  }

  /**
   * Accept an invitation and join a clinic
   */
  async acceptInvitation(token: string, userId: string): Promise<void> {
    await apiClient.post(`/clinics/join/${token}`, { userId });
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService();

// Step definitions
export const ONBOARDING_STEPS = {
  CLINIC_SETUP: 'CLINIC_SETUP',
  ADD_DOCTORS: 'ADD_DOCTORS',
  ADD_PATIENTS: 'ADD_PATIENTS',
  RECORD_NOTE: 'RECORD_NOTE',
  COMPLETE: 'COMPLETE',
} as const;

// Step labels for display
export const STEP_LABELS: Record<string, string> = {
  CLINIC_SETUP: 'Clinic Setup',
  ADD_DOCTORS: 'Add Doctors',
  ADD_PATIENTS: 'Add Patients',
  RECORD_NOTE: 'Record First Note',
  COMPLETE: 'Onboarding Complete',
};

// Step descriptions
export const STEP_DESCRIPTIONS: Record<string, string> = {
  CLINIC_SETUP: 'Set up your clinic details and preferences',
  ADD_DOCTORS: 'Invite doctors and staff to join your clinic',
  ADD_PATIENTS: 'Add your first patients to the system',
  RECORD_NOTE: 'Create your first medical note',
  COMPLETE: 'You have completed all onboarding steps',
};
