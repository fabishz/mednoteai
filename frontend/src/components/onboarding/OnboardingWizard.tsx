/**
 * src/components/onboarding/OnboardingWizard.tsx
 * 
 * Onboarding Wizard Component
 * Multi-step wizard for clinic onboarding
 */

import { useState, useEffect } from 'react';
import { onboardingService, ONBOARDING_STEPS, type OnboardingStatus } from '@/services/onboarding';

interface OnboardingWizardProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const data = await onboardingService.getOnboardingStatus();
      setStatus(data);
      
      if (data.isComplete && onComplete) {
        onComplete();
      }
    } catch (err) {
      setError('Failed to load onboarding status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = async (step: string) => {
    try {
      setIsLoading(true);
      await onboardingService.completeStep(step);
      await loadStatus();
    } catch (err) {
      setError('Failed to complete step');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadStatus}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const renderStep = () => {
    switch (status.currentStep) {
      case ONBOARDING_STEPS.CLINIC_SETUP:
        return (
          <ClinicSetupStep 
            onComplete={() => handleStepComplete(ONBOARDING_STEPS.CLINIC_SETUP)}
          />
        );
      case ONBOARDING_STEPS.ADD_DOCTORS:
        return (
          <AddDoctorsStep 
            doctorCount={status.context.doctorCount}
            onComplete={() => handleStepComplete(ONBOARDING_STEPS.ADD_DOCTORS)}
          />
        );
      case ONBOARDING_STEPS.ADD_PATIENTS:
        return (
          <AddPatientsStep 
            patientCount={status.context.patientCount}
            onComplete={() => handleStepComplete(ONBOARDING_STEPS.ADD_PATIENTS)}
          />
        );
      case ONBOARDING_STEPS.RECORD_NOTE:
        return (
          <RecordNoteStep 
            noteCount={status.context.noteCount}
            onComplete={() => handleStepComplete(ONBOARDING_STEPS.RECORD_NOTE)}
          />
        );
      case ONBOARDING_STEPS.COMPLETE:
        return (
          <OnboardingComplete 
            onDone={onComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {status.nextSteps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center ${
                index < status.nextSteps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  status.completedSteps.includes(step.id)
                    ? 'bg-green-500 text-white'
                    : step.id === status.currentStep
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {status.completedSteps.includes(step.id) ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < status.nextSteps.length - 1 && (
                <div 
                  className={`flex-1 h-1 mx-2 ${
                    status.completedSteps.includes(step.id) 
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">
          {status.nextSteps.find(s => s.id === status.currentStep)?.label}
        </h2>
        <p className="text-gray-600 mb-6">
          {status.nextSteps.find(s => s.id === status.currentStep)?.description}
        </p>
        
        {renderStep()}
      </div>

      {/* Skip Button */}
      {onSkip && status.currentStep !== ONBOARDING_STEPS.COMPLETE && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}

// Individual Step Components

function ClinicSetupStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div>
      <p className="text-gray-600 mb-4">
        Configure your clinic settings including name, contact information, and preferences.
      </p>
      <button
        onClick={onComplete}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Go to Clinic Settings
      </button>
    </div>
  );
}

function AddDoctorsStep({ doctorCount, onComplete }: { doctorCount: number; onComplete: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p className="font-medium">Doctors & Staff</p>
          <p className="text-sm text-gray-500">{doctorCount} team members</p>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Invite Team Members
      </button>
    </div>
  );
}

function AddPatientsStep({ patientCount, onComplete }: { patientCount: number; onComplete: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p className="font-medium">Patients</p>
          <p className="text-sm text-gray-500">{patientCount} patients registered</p>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Add First Patient
      </button>
    </div>
  );
}

function RecordNoteStep({ noteCount, onComplete }: { noteCount: number; onComplete: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="font-medium">Medical Notes</p>
          <p className="text-sm text-gray-500">{noteCount} notes created</p>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Create First Note
      </button>
    </div>
  );
}

function OnboardingComplete({ onDone }: { onDone?: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">Congratulations!</h3>
      <p className="text-gray-600 mb-6">
        You've completed the onboarding process. Your clinic is now ready to use MedNote AI.
      </p>
      <button
        onClick={onDone}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Get Started
      </button>
    </div>
  );
}

export default OnboardingWizard;
