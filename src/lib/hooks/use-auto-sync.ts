'use client';

import { useCallback } from 'react';

/**
 * Hook for triggering automatic synchronization between collections
 * Use this in components that update organization or onboarding data
 */
export function useAutoSync() {
  
  /**
   * Trigger sync when organization data is updated
   */
  const syncAfterOrganizationUpdate = useCallback(async (organizationId: string) => {
    try {
      const response = await fetch('/api/sync/organization-updated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId })
      });

      if (!response.ok) {
        console.error('Failed to sync onboarding after organization update');
      }

      return await response.json();
    } catch (error) {
      console.error('Auto-sync error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  /**
   * Trigger sync when onboarding data is updated
   */
  const syncAfterOnboardingUpdate = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/sync/onboarding-updated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        console.error('Failed to sync organization after onboarding update');
      }

      return await response.json();
    } catch (error) {
      console.error('Auto-sync error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  /**
   * Generic sync trigger based on type
   */
  const triggerSync = useCallback(async (
    type: 'organization' | 'onboarding',
    id: string
  ) => {
    if (type === 'organization') {
      return await syncAfterOrganizationUpdate(id);
    } else {
      return await syncAfterOnboardingUpdate(id);
    }
  }, [syncAfterOrganizationUpdate, syncAfterOnboardingUpdate]);

  return {
    syncAfterOrganizationUpdate,
    syncAfterOnboardingUpdate,
    triggerSync
  };
}