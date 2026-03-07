/**
 * src/contexts/FeatureFlagContext.tsx
 * 
 * Feature Flag Context
 * Provides feature flag checking throughout the application
 */

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { featureFlagService, FeatureFlag, DEFAULT_FEATURE_FLAGS } from "@/services/featureFlags";

interface FeatureFlagContextType {
  flags: Map<string, boolean>;
  isLoading: boolean;
  isFeatureEnabled: (featureName: string) => boolean;
  checkFeature: (featureName: string) => Promise<boolean>;
  preloadFlags: () => Promise<void>;
  // Convenience helpers for default features
  isVoiceNotesEnabled: () => boolean;
  isAiDiagnosisEnabled: () => boolean;
  isAdvancedReportsEnabled: () => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Load all flags on mount
  useEffect(() => {
    const loadFlags = async () => {
      try {
        await featureFlagService.preloadFlags();
        const allFlags = await featureFlagService.getAll();
        const flagMap = new Map<string, boolean>();
        allFlags.forEach(flag => {
          flagMap.set(flag.name, flag.enabled);
        });
        setFlags(flagMap);
      } catch (error) {
        console.error("Error loading feature flags:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlags();
  }, []);

  /**
   * Synchronously check if a feature is enabled (uses cached value)
   */
  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    return flags.get(featureName) ?? false;
  }, [flags]);

  /**
   * Asynchronously check if a feature is enabled (bypasses cache)
   */
  const checkFeature = useCallback(async (featureName: string): Promise<boolean> => {
    const enabled = await featureFlagService.isEnabled(featureName, true);
    // Update local state
    setFlags(prev => new Map(prev).set(featureName, enabled));
    return enabled;
  }, []);

  /**
   * Preload all feature flags
   */
  const preloadFlags = useCallback(async () => {
    setIsLoading(true);
    try {
      await featureFlagService.preloadFlags();
      const allFlags = await featureFlagService.getAll();
      const flagMap = new Map<string, boolean>();
      allFlags.forEach(flag => {
        flagMap.set(flag.name, flag.enabled);
      });
      setFlags(flagMap);
    } catch (error) {
      console.error("Error preloading feature flags:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convenience helpers for default features
  const isVoiceNotesEnabled = useCallback(() => 
    isFeatureEnabled(DEFAULT_FEATURE_FLAGS.voice_notes), 
    [isFeatureEnabled]
  );

  const isAiDiagnosisEnabled = useCallback(() => 
    isFeatureEnabled(DEFAULT_FEATURE_FLAGS.ai_diagnosis), 
    [isFeatureEnabled]
  );

  const isAdvancedReportsEnabled = useCallback(() => 
    isFeatureEnabled(DEFAULT_FEATURE_FLAGS.advanced_reports), 
    [isFeatureEnabled]
  );

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        isLoading,
        isFeatureEnabled,
        checkFeature,
        preloadFlags,
        isVoiceNotesEnabled,
        isAiDiagnosisEnabled,
        isAdvancedReportsEnabled,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error("useFeatureFlags must be used within FeatureFlagProvider");
  return ctx;
}

/**
 * Hook to conditionally render UI based on feature flag
 * Returns null if feature is disabled, children otherwise
 */
export function FeatureGuard({ 
  featureName, 
  children, 
  fallback = null 
}: { 
  featureName: string; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();

  if (isLoading) {
    // Optionally show loading state, or just render children
    return <>{children}</>;
  }

  if (!isFeatureEnabled(featureName)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
