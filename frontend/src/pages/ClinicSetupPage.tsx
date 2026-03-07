/**
 * src/pages/ClinicSetupPage.tsx
 * 
 * Clinic Setup Page
 * Full page for clinic onboarding setup
 */

import { useState } from 'react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { InviteUsersForm } from '@/components/onboarding/InviteUsersForm';

interface ClinicSetupPageProps {
  onComplete?: () => void;
}

export function ClinicSetupPage({ onComplete }: ClinicSetupPageProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to MedNote AI
          </h1>
          <p className="text-gray-600">
            Let's set up your clinic in just a few steps
          </p>
        </div>

        {/* Main Content */}
        {!showInviteForm ? (
          <OnboardingWizard 
            onComplete={onComplete}
            onSkip={() => setShowInviteForm(true)}
          />
        ) : (
          <div className="space-y-6">
            <InviteUsersForm 
              onSuccess={() => {
                // After inviting, show wizard again
                setShowInviteForm(false);
              }}
            />
            
            <div className="text-center">
              <button
                onClick={() => setShowInviteForm(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClinicSetupPage;
