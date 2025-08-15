import { autoSyncCollections } from './sync-utilities';

/**
 * Server-side helpers for automatic synchronization
 * Use these in API routes, server actions, or anywhere you update Firebase data
 */

/**
 * Call this after any organization update operation
 * Example: After updating organization profile, services, team, etc.
 */
export async function triggerOrganizationSync(organizationId: string): Promise<void> {
  try {
    const result = await autoSyncCollections('organization', organizationId);
    
    if (!result.success) {
      console.error('Failed to sync onboarding after organization update:', result.error);
    } else {
      console.log(`Successfully synced onboarding for organization ${organizationId}`);
    }
  } catch (error) {
    console.error('Organization sync trigger error:', error);
  }
}

/**
 * Call this after any onboarding update operation
 * Example: After user completes onboarding steps, updates progress, etc.
 */
export async function triggerOnboardingSync(userId: string): Promise<void> {
  try {
    const result = await autoSyncCollections('onboarding', userId);
    
    if (!result.success) {
      console.error('Failed to sync organization after onboarding update:', result.error);
    } else {
      console.log(`Successfully synced organization for user ${userId}`);
    }
  } catch (error) {
    console.error('Onboarding sync trigger error:', error);
  }
}

/**
 * Enhanced organization update wrapper that automatically triggers sync
 */
export async function updateOrganizationWithSync(
  organizationId: string,
  updateData: any,
  adminDb: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update the organization
    await adminDb.collection('organizations').doc(organizationId).update({
      ...updateData,
      updatedAt: new Date()
    });

    // Trigger automatic sync
    await triggerOrganizationSync(organizationId);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: (error as Error).message 
    };
  }
}

/**
 * Enhanced onboarding update wrapper that automatically triggers sync
 */
export async function updateOnboardingWithSync(
  userId: string,
  updateData: any,
  adminDb: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update the onboarding record
    await adminDb.collection('onboarding').doc(userId).update({
      ...updateData,
      updatedAt: new Date()
    });

    // Trigger automatic sync
    await triggerOnboardingSync(userId);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: (error as Error).message 
    };
  }
}

/**
 * Organization creation wrapper that sets up synced onboarding
 */
export async function createOrganizationWithOnboarding(
  organizationData: any,
  userId: string,
  adminDb: any
): Promise<{ success: boolean; organizationId?: string; error?: string }> {
  try {
    const organizationId = organizationData.id || adminDb.collection('organizations').doc().id;
    
    // Create organization
    await adminDb.collection('organizations').doc(organizationId).set({
      ...organizationData,
      id: organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create initial onboarding record
    await adminDb.collection('onboarding').doc(userId).set({
      userId,
      userType: organizationData.type,
      organizationId,
      status: 'not_started',
      currentStep: 0,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      onboardingData: getInitialOnboardingData(organizationData.type),
      progress: {
        totalSteps: organizationData.type === 'vendor' ? 8 : 6,
        completedSteps: 0,
        percentageComplete: 0,
        estimatedTimeRemaining: organizationData.type === 'vendor' ? 240 : 180, // minutes
        nextRecommendedAction: 'Complete basic organization information'
      },
      metadata: {
        createdBySync: true,
        syncedFromOrganization: false
      }
    });

    // Trigger initial sync to align data
    await triggerOrganizationSync(organizationId);

    return { success: true, organizationId };
  } catch (error) {
    return { 
      success: false, 
      error: (error as Error).message 
    };
  }
}

/**
 * Get initial onboarding data structure based on organization type
 */
function getInitialOnboardingData(orgType: string) {
  const baseData = {
    organizationSetup: false,
    companyProfileCompleted: false,
    teamMembersAdded: false,
    paymentMethodVerified: false,
    profilePublished: false
  };

  if (orgType === 'vendor') {
    return {
      ...baseData,
      servicesListed: false,
      portfolioUploaded: false,
      pricingConfigured: false,
      verificationSubmitted: false,
      certificationsAdded: false,
      businessMetricsSetup: false,
      workingHoursConfigured: false,
      firstClientOnboarded: false
    };
  }

  if (orgType === 'customer') {
    return {
      ...baseData,
      teamMembersInvited: false,
      firstProjectCreated: false,
      billingConfigured: false
    };
  }

  return baseData;
}

/**
 * Middleware function to wrap any Firebase write operation with auto-sync
 */
export function withAutoSync<T extends any[]>(
  operation: (...args: T) => Promise<any>,
  syncType: 'organization' | 'onboarding',
  getIdFromArgs: (...args: T) => string
) {
  return async (...args: T) => {
    try {
      // Perform the original operation
      const result = await operation(...args);
      
      // Trigger appropriate sync
      const id = getIdFromArgs(...args);
      await autoSyncCollections(syncType, id);
      
      return result;
    } catch (error) {
      console.error('Operation with auto-sync failed:', error);
      throw error;
    }
  };
}