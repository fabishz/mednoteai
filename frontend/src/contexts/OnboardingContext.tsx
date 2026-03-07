/**
 * src/contexts/OnboardingContext.tsx
 * 
 * Onboarding Context
 * Provides onboarding state management throughout the application
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onboardingService, type OnboardingStatus } from '@/services/onboarding';

interface OnboardingContextType {
  status: OnboardingStatus | null;
  isLoading: boolean;
  isComplete: boolean;
  currentStep: string | null;
  refreshStatus: () => Promise<void>;
  completeStep: (step: string) => Promise<void>;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await onboardingService.getOnboardingStatus();
      setStatus(data);
      
      // Show onboarding if not complete
      if (!data.isComplete) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const refreshStatus = useCallback(async () => {
    await loadStatus();
  }, [loadStatus]);

  const completeStep = useCallback(async (step: string) => {
    await onboardingService.completeStep(step);
    await loadStatus();
  }, [loadStatus]);

  const isComplete = status?.isComplete ?? false;
  const currentStep = status?.currentStep ?? null;

  return (
    <OnboardingContext.Provider
      value={{
        status,
        isLoading,
        isComplete,
        currentStep,
        refreshStatus,
        completeStep,
        showOnboarding,
        setShowOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

/**
 * Hook to check if onboarding is pending for the current user
 */
export function useOnboardingCheck() {
  const { isComplete, isLoading } = useOnboarding();
  
  return {
    shouldShowOnboarding: !isLoading && !isComplete,
    isLoading,
    isComplete,
  };
}
