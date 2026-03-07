/**
 * src/services/featureFlags.ts
 * 
 * Feature Flag Service
 * Handles fetching and checking feature flags from the backend
 */

import { apiClient } from './api/client';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  clinicId: string | null;
}

export interface FeatureFlagsResponse {
  flags: FeatureFlag[];
}

export interface FeatureFlagCheckResponse {
  name: string;
  enabled: boolean;
}

export class FeatureFlagService {
  private cachedFlags: Map<string, boolean> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  /**
   * Get all feature flags for the current clinic
   */
  async getAll(): Promise<FeatureFlag[]> {
    try {
      const response = await apiClient.get<FeatureFlagsResponse>('/feature-flags');
      // Backend returns: { success, message, data: { flags } }
      return response.data.flags || [];
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return [];
    }
  }

  /**
   * Check if a specific feature is enabled
   * Uses caching to avoid excessive API calls
   */
  async isEnabled(featureName: string, bypassCache = false): Promise<boolean> {
    // Check cache first (unless bypassed)
    if (!bypassCache && this.cachedFlags.has(featureName)) {
      const cached = this.cachedFlags.get(featureName);
      if (cached !== undefined && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
        return cached;
      }
    }

    try {
      const response = await apiClient.get<FeatureFlagCheckResponse>(`/feature-flags/${featureName}`);
      const enabled = response.data.enabled ?? false;
      this.cachedFlags.set(featureName, enabled);
      this.cacheTimestamp = Date.now();
      return enabled;
    } catch (error) {
      console.error(`Error checking feature flag "${featureName}":`, error);
      // Default to false on error for safety
      return false;
    }
  }

  /**
   * Enable a feature flag (admin only)
   */
  async enable(featureName: string, clinicId?: string): Promise<FeatureFlag> {
    const response = await apiClient.post<{ flag: FeatureFlag }>('/feature-flags', {
      name: featureName,
      enabled: true,
      clinicId,
    });
    
    // Update cache
    this.cachedFlags.set(featureName, true);
    return response.data.flag;
  }

  /**
   * Disable a feature flag (admin only)
   */
  async disable(featureName: string, clinicId?: string): Promise<FeatureFlag> {
    const response = await apiClient.post<{ flag: FeatureFlag }>('/feature-flags', {
      name: featureName,
      enabled: false,
      clinicId,
    });
    
    // Update cache
    this.cachedFlags.set(featureName, false);
    return response.data.flag;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cachedFlags.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Preload all feature flags into cache
   */
  async preloadFlags(): Promise<void> {
    const flags = await this.getAll();
    flags.forEach(flag => {
      this.cachedFlags.set(flag.name, flag.enabled);
    });
    this.cacheTimestamp = Date.now();
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();

// Default feature flags for the application
export const DEFAULT_FEATURE_FLAGS = {
  voice_notes: 'voice_notes',
  ai_diagnosis: 'ai_diagnosis',
  advanced_reports: 'advanced_reports',
} as const;

export type FeatureFlagName = typeof DEFAULT_FEATURE_FLAGS[keyof typeof DEFAULT_FEATURE_FLAGS];
