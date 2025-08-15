/**
 * Session Token Management Utilities
 * 
 * This module provides utilities for managing custom session token claims
 * and synchronizing user metadata between Clerk and your database.
 */

import { clerkClient } from '@clerk/nextjs/server';
import { UserType, OnboardingStatus } from '@/lib/firebase/onboarding-schema';
import { Permission, FreelancerTier } from '@/lib/rbac/types';
import { getAdminDb } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';

/**
 * User metadata that will be stored in Clerk's publicMetadata
 * and included in session tokens
 */
export interface UserSessionMetadata {
  user_type?: UserType;
  onboarding_status: OnboardingStatus;
  onboarding_completed: boolean;
  onboarding_current_step: number;
  organization_id?: string;
  organization_name?: string;
  organization_role?: string;
  roles: string; // JSON string of role objects
  permissions: string; // JSON string of permission array
  user_status: 'active' | 'inactive' | 'suspended' | 'pending';
  freelancer_tier?: FreelancerTier;
  freelancer_verified: boolean;
  freelancer_rating?: number;
  organization_type?: UserType;
  can_invite_users: boolean;
  max_budget_approval: number;
  feature_flags: string; // JSON string of feature flags object
  preferences: string; // JSON string of user preferences
  background_check_status: 'not_started' | 'in_progress' | 'verified' | 'failed';
  compliance_status: 'pending' | 'compliant' | 'non_compliant' | 'under_review';
  api_access_level: 'none' | 'basic' | 'professional' | 'enterprise';
}

/**
 * Update user's session token claims in Clerk
 */
export async function updateUserSessionClaims(
  userId: string, 
  metadata: Partial<UserSessionMetadata>
): Promise<void> {
  try {
    const client = clerkClient();
    if (!client || !client.users) {
      throw new Error('Clerk client not properly initialized. Check CLERK_SECRET_KEY environment variable.');
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: metadata
    });

    logger.info('User session claims updated', { 
      userId, 
      updatedFields: Object.keys(metadata) 
    });
  } catch (error) {
    logger.error('Failed to update user session claims', error as Error, { userId });
    throw error;
  }
}

/**
 * Sync user data from Firestore to Clerk session claims
 */
export async function syncUserToSessionClaims(userId: string): Promise<void> {
  try {
    const adminDb = await getAdminDb();
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found in database`);
    }

    const userData = userDoc.data();
    const onboardingDoc = await adminDb.collection('onboarding').doc(userId).get();
    const onboardingData = onboardingDoc.exists ? onboardingDoc.data() : {};

    // Build metadata object for session claims
    const metadata: UserSessionMetadata = {
      user_type: userData.userType || onboardingData.userType,
      onboarding_status: onboardingData.status || OnboardingStatus.NOT_STARTED,
      onboarding_completed: onboardingData.completedAt ? true : false,
      onboarding_current_step: onboardingData.currentStep || 0,
      organization_id: userData.organizationId,
      organization_name: userData.organizationName,
      organization_role: userData.organizationRole,
      roles: JSON.stringify(userData.roles || []),
      permissions: JSON.stringify(
        userData.roles?.flatMap((role: any) => role.permissions) || []
      ),
      user_status: userData.isActive ? 'active' : 'inactive',
      freelancer_tier: userData.freelancerTier,
      freelancer_verified: userData.freelancerVerified || false,
      freelancer_rating: userData.freelancerRating,
      organization_type: userData.organizationType,
      can_invite_users: userData.canInviteUsers || false,
      max_budget_approval: userData.maxBudgetApproval || 0,
      feature_flags: JSON.stringify(userData.featureFlags || {}),
      preferences: JSON.stringify(userData.preferences || {}),
      background_check_status: userData.backgroundCheckStatus || 'not_started',
      compliance_status: userData.complianceStatus || 'pending',
      api_access_level: userData.apiAccessLevel || 'basic'
    };

    await updateUserSessionClaims(userId, metadata);

    logger.info('User data synced to session claims', { userId });
  } catch (error) {
    logger.error('Failed to sync user to session claims', error as Error, { userId });
    throw error;
  }
}

/**
 * Initialize session claims for a new user
 */
export async function initializeNewUserSessionClaims(
  userId: string, 
  userType?: UserType
): Promise<void> {
  try {
    const metadata: UserSessionMetadata = {
      user_type: userType,
      onboarding_status: OnboardingStatus.NOT_STARTED,
      onboarding_completed: false,
      onboarding_current_step: 0,
      roles: JSON.stringify([]),
      permissions: JSON.stringify([]),
      user_status: 'active',
      freelancer_verified: false,
      can_invite_users: false,
      max_budget_approval: 0,
      feature_flags: JSON.stringify({}),
      preferences: JSON.stringify({}),
      background_check_status: 'not_started',
      compliance_status: 'pending',
      api_access_level: 'basic'
    };

    await updateUserSessionClaims(userId, metadata);

    logger.info('New user session claims initialized', { userId, userType });
  } catch (error) {
    logger.error('Failed to initialize new user session claims', error as Error, { userId });
    throw error;
  }
}

/**
 * Update onboarding progress in session claims
 */
export async function updateOnboardingProgress(
  userId: string,
  step: number,
  status: OnboardingStatus,
  userType?: UserType,
  completed?: boolean
): Promise<void> {
  try {
    const metadata: Partial<UserSessionMetadata> = {
      onboarding_current_step: step,
      onboarding_status: status,
      onboarding_completed: completed || false
    };

    if (userType) {
      metadata.user_type = userType;
    }

    await updateUserSessionClaims(userId, metadata);

    logger.info('Onboarding progress updated in session claims', { 
      userId, 
      step, 
      status, 
      userType 
    });
  } catch (error) {
    logger.error('Failed to update onboarding progress in session claims', error as Error, { 
      userId, 
      step, 
      status 
    });
    throw error;
  }
}

/**
 * Update user roles and permissions in session claims
 */
export async function updateUserRolesInSession(
  userId: string,
  roles: Array<{
    id: string;
    name: string;
    type: string;
    permissions: Permission[];
    organizationId?: string;
    tier?: FreelancerTier;
  }>
): Promise<void> {
  try {
    const permissions = roles.flatMap(role => role.permissions);
    
    const metadata: Partial<UserSessionMetadata> = {
      roles: JSON.stringify(roles),
      permissions: JSON.stringify(permissions)
    };

    await updateUserSessionClaims(userId, metadata);

    logger.info('User roles updated in session claims', { 
      userId, 
      roleCount: roles.length,
      permissionCount: permissions.length 
    });
  } catch (error) {
    logger.error('Failed to update user roles in session claims', error as Error, { userId });
    throw error;
  }
}

/**
 * Update organization membership in session claims
 */
export async function updateOrganizationMembership(
  userId: string,
  organizationId: string,
  organizationName: string,
  organizationRole: string,
  organizationType?: UserType
): Promise<void> {
  try {
    const metadata: Partial<UserSessionMetadata> = {
      organization_id: organizationId,
      organization_name: organizationName,
      organization_role: organizationRole,
      organization_type: organizationType
    };

    await updateUserSessionClaims(userId, metadata);

    logger.info('Organization membership updated in session claims', { 
      userId, 
      organizationId, 
      organizationRole 
    });
  } catch (error) {
    logger.error('Failed to update organization membership in session claims', error as Error, { 
      userId, 
      organizationId 
    });
    throw error;
  }
}

/**
 * Remove organization membership from session claims
 */
export async function removeOrganizationMembership(userId: string): Promise<void> {
  try {
    const metadata: Partial<UserSessionMetadata> = {
      organization_id: undefined,
      organization_name: undefined,
      organization_role: undefined,
      organization_type: undefined
    };

    await updateUserSessionClaims(userId, metadata);

    logger.info('Organization membership removed from session claims', { userId });
  } catch (error) {
    logger.error('Failed to remove organization membership from session claims', error as Error, { 
      userId 
    });
    throw error;
  }
}

/**
 * Update freelancer verification status
 */
export async function updateFreelancerVerification(
  userId: string,
  verified: boolean,
  tier?: FreelancerTier,
  rating?: number
): Promise<void> {
  try {
    const metadata: Partial<UserSessionMetadata> = {
      freelancer_verified: verified
    };

    if (tier !== undefined) {
      metadata.freelancer_tier = tier;
    }

    if (rating !== undefined) {
      metadata.freelancer_rating = rating;
    }

    await updateUserSessionClaims(userId, metadata);

    logger.info('Freelancer verification updated in session claims', { 
      userId, 
      verified, 
      tier, 
      rating 
    });
  } catch (error) {
    logger.error('Failed to update freelancer verification in session claims', error as Error, { 
      userId 
    });
    throw error;
  }
}

/**
 * Update user feature flags
 */
export async function updateUserFeatureFlags(
  userId: string,
  featureFlags: Record<string, boolean>
): Promise<void> {
  try {
    const metadata: Partial<UserSessionMetadata> = {
      feature_flags: JSON.stringify(featureFlags)
    };

    await updateUserSessionClaims(userId, metadata);

    logger.info('User feature flags updated in session claims', { 
      userId, 
      flagCount: Object.keys(featureFlags).length 
    });
  } catch (error) {
    logger.error('Failed to update user feature flags in session claims', error as Error, { 
      userId 
    });
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, any>
): Promise<void> {
  try {
    const metadata: Partial<UserSessionMetadata> = {
      preferences: JSON.stringify(preferences)
    };

    await updateUserSessionClaims(userId, metadata);

    logger.info('User preferences updated in session claims', { 
      userId, 
      preferenceCount: Object.keys(preferences).length 
    });
  } catch (error) {
    logger.error('Failed to update user preferences in session claims', error as Error, { 
      userId 
    });
    throw error;
  }
}

/**
 * Update user status (active/inactive/suspended)
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive' | 'suspended' | 'pending'
): Promise<void> {
  try {
    const metadata: Partial<UserSessionMetadata> = {
      user_status: status
    };

    await updateUserSessionClaims(userId, metadata);

    logger.info('User status updated in session claims', { userId, status });
  } catch (error) {
    logger.error('Failed to update user status in session claims', error as Error, { 
      userId, 
      status 
    });
    throw error;
  }
}

/**
 * Update compliance and verification statuses
 */
export async function updateComplianceStatus(
  userId: string,
  backgroundCheckStatus?: 'not_started' | 'in_progress' | 'verified' | 'failed',
  complianceStatus?: 'pending' | 'compliant' | 'non_compliant' | 'under_review'
): Promise<void> {
  try {
    const metadata: Partial<UserSessionMetadata> = {};

    if (backgroundCheckStatus !== undefined) {
      metadata.background_check_status = backgroundCheckStatus;
    }

    if (complianceStatus !== undefined) {
      metadata.compliance_status = complianceStatus;
    }

    await updateUserSessionClaims(userId, metadata);

    logger.info('Compliance status updated in session claims', { 
      userId, 
      backgroundCheckStatus, 
      complianceStatus 
    });
  } catch (error) {
    logger.error('Failed to update compliance status in session claims', error as Error, { 
      userId 
    });
    throw error;
  }
}

/**
 * Bulk sync multiple users to session claims (for data migration)
 */
export async function bulkSyncUsersToSessionClaims(
  userIds: string[],
  batchSize: number = 10
): Promise<{ succeeded: string[]; failed: Array<{ userId: string; error: string }> }> {
  const succeeded: string[] = [];
  const failed: Array<{ userId: string; error: string }> = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    
    await Promise.allSettled(
      batch.map(async (userId) => {
        try {
          await syncUserToSessionClaims(userId);
          succeeded.push(userId);
        } catch (error) {
          failed.push({ 
            userId, 
            error: (error as Error).message 
          });
        }
      })
    );

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  logger.info('Bulk sync completed', { 
    total: userIds.length, 
    succeeded: succeeded.length, 
    failed: failed.length 
  });

  return { succeeded, failed };
}

/**
 * Get current user metadata from Clerk
 */
export async function getCurrentUserMetadata(userId: string): Promise<UserSessionMetadata | null> {
  try {
    const client = clerkClient();
    if (!client || !client.users) {
      throw new Error('Clerk client not properly initialized. Check CLERK_SECRET_KEY environment variable.');
    }

    const user = await client.users.getUser(userId);
    return user.publicMetadata as UserSessionMetadata || null;
  } catch (error) {
    logger.error('Failed to get current user metadata', error as Error, { userId });
    return null;
  }
}

/**
 * Export types and interfaces
 */
export type { UserSessionMetadata };