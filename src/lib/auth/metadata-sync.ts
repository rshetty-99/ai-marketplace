// Metadata Synchronization Utility
// Keeps Clerk user metadata in sync while maintaining optimal JWT claim size

import { User } from '@clerk/nextjs/server';
import { OptimizedJWTClaims } from './jwt-claims';

export interface UserMetadataUpdate {
  // Onboarding
  user_type?: 'freelancer' | 'vendor' | 'customer';
  onboarding_status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  onboarding_completed?: boolean;
  onboarding_current_step?: number;
  
  // Organization
  organization_id?: string;
  organization_name?: string;
  organization_role?: string;
  organization_type?: string;
  
  // Roles & Permissions (stored as JSON strings to save space)
  roles?: string; // JSON array
  permissions?: string; // JSON array
  
  // User Status
  user_status?: 'active' | 'inactive' | 'suspended' | 'pending';
  
  // Freelancer specific
  freelancer_tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  freelancer_verified?: boolean;
  freelancer_rating?: number;
  
  // Vendor specific
  can_invite_users?: boolean;
  max_budget_approval?: number;
  
  // API & Security
  api_access_level?: 'read' | 'write' | 'admin';
  background_check_status?: 'pending' | 'approved' | 'rejected';
  compliance_status?: 'compliant' | 'non_compliant' | 'pending';
  
  // Feature flags and preferences (stored as JSON strings)
  feature_flags?: string; // JSON object
  preferences?: string; // JSON object
}

/**
 * Update user metadata efficiently with role/permission optimization
 */
export async function updateUserMetadata(
  userId: string,
  updates: UserMetadataUpdate,
  user?: User
): Promise<void> {
  try {
    // If we have the user object, use it directly
    if (user) {
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          ...updates
        }
      });
      return;
    }

    // Otherwise, we'd need to use the Clerk admin API
    // This would require server-side implementation
    console.warn('User object not provided, metadata update requires server-side implementation');
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw error;
  }
}

/**
 * Sync RBAC data to user metadata for JWT claims
 */
export async function syncRBACToMetadata(
  userId: string,
  roleIds: string[],
  permissionIds: string[],
  user?: User
): Promise<void> {
  // Convert arrays to JSON strings to save space in JWT
  const updates: UserMetadataUpdate = {
    roles: JSON.stringify(roleIds),
    permissions: JSON.stringify(permissionIds)
  };

  await updateUserMetadata(userId, updates, user);
}

/**
 * Update onboarding progress in metadata
 */
export async function updateOnboardingProgress(
  userId: string,
  status: UserMetadataUpdate['onboarding_status'],
  currentStep: number,
  completed: boolean = false,
  user?: User
): Promise<void> {
  const updates: UserMetadataUpdate = {
    onboarding_status: status,
    onboarding_current_step: currentStep,
    onboarding_completed: completed
  };

  await updateUserMetadata(userId, updates, user);
}

/**
 * Set user organization membership
 */
export async function setUserOrganization(
  userId: string,
  organizationId: string,
  organizationName: string,
  role: string,
  organizationType?: string,
  user?: User
): Promise<void> {
  const updates: UserMetadataUpdate = {
    organization_id: organizationId,
    organization_name: organizationName,
    organization_role: role,
    organization_type: organizationType
  };

  await updateUserMetadata(userId, updates, user);
}

/**
 * Update freelancer verification status
 */
export async function updateFreelancerStatus(
  userId: string,
  verified: boolean,
  tier?: UserMetadataUpdate['freelancer_tier'],
  rating?: number,
  user?: User
): Promise<void> {
  const updates: UserMetadataUpdate = {
    freelancer_verified: verified
  };

  if (tier) updates.freelancer_tier = tier;
  if (rating !== undefined) updates.freelancer_rating = rating;

  await updateUserMetadata(userId, updates, user);
}

/**
 * Set API access level
 */
export async function setAPIAccessLevel(
  userId: string,
  level: UserMetadataUpdate['api_access_level'],
  user?: User
): Promise<void> {
  const updates: UserMetadataUpdate = {
    api_access_level: level
  };

  await updateUserMetadata(userId, updates, user);
}

/**
 * Optimize metadata for JWT size constraints
 */
export function optimizeMetadataForJWT(metadata: Record<string, any>): UserMetadataUpdate {
  const optimized: UserMetadataUpdate = {};

  // Only include essential fields that need to be in JWT
  const essentialFields = [
    'user_type',
    'onboarding_status', 
    'onboarding_completed',
    'onboarding_current_step',
    'organization_id',
    'organization_role',
    'roles',
    'permissions',
    'user_status',
    'freelancer_tier',
    'freelancer_verified',
    'api_access_level'
  ];

  essentialFields.forEach(field => {
    if (metadata[field] !== undefined) {
      optimized[field as keyof UserMetadataUpdate] = metadata[field];
    }
  });

  return optimized;
}

/**
 * Estimate metadata size impact on JWT
 */
export function estimateMetadataSize(metadata: UserMetadataUpdate): {
  totalSize: number;
  largestFields: Array<{ field: string; size: number }>;
  recommendations: string[];
} {
  const fieldSizes: Array<{ field: string; size: number }> = [];
  let totalSize = 0;

  Object.entries(metadata).forEach(([key, value]) => {
    const size = Buffer.byteLength(JSON.stringify(value), 'utf8');
    fieldSizes.push({ field: key, size });
    totalSize += size;
  });

  const largestFields = fieldSizes
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

  const recommendations: string[] = [];
  
  if (totalSize > 1500) {
    recommendations.push('Consider reducing metadata size to avoid JWT limit');
  }
  
  largestFields.forEach(field => {
    if (field.size > 200) {
      recommendations.push(`Field '${field.field}' is large (${field.size} bytes) - consider optimization`);
    }
  });

  return {
    totalSize,
    largestFields,
    recommendations
  };
}

/**
 * Create server-side metadata update function (for API routes)
 */
export function createServerMetadataUpdater() {
  return {
    async updateUserMetadata(
      clerkUserId: string,
      updates: UserMetadataUpdate
    ): Promise<void> {
      // This would be implemented in a server action or API route
      // using Clerk's server-side SDK
      
      const response = await fetch('/api/auth/update-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: clerkUserId,
          updates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user metadata');
      }
    }
  };
}

/**
 * Batch update multiple metadata fields efficiently
 */
export async function batchUpdateMetadata(
  userId: string,
  updates: UserMetadataUpdate[],
  user?: User
): Promise<void> {
  // Merge all updates into a single update to minimize API calls
  const mergedUpdates = updates.reduce((acc, update) => ({
    ...acc,
    ...update
  }), {} as UserMetadataUpdate);

  await updateUserMetadata(userId, mergedUpdates, user);
}

/**
 * Validate metadata before updating to ensure JWT compatibility
 */
export function validateMetadataForJWT(metadata: UserMetadataUpdate): {
  isValid: boolean;
  errors: string[];
  estimatedSize: number;
} {
  const errors: string[] = [];
  const estimatedSize = Buffer.byteLength(JSON.stringify(metadata), 'utf8');

  if (estimatedSize > 1800) {
    errors.push(`Metadata size (${estimatedSize} bytes) may exceed JWT limit`);
  }

  // Validate specific fields
  if (metadata.roles) {
    try {
      const roles = JSON.parse(metadata.roles);
      if (!Array.isArray(roles)) {
        errors.push('Roles must be a JSON array');
      }
    } catch (e) {
      errors.push('Invalid JSON format for roles');
    }
  }

  if (metadata.permissions) {
    try {
      const permissions = JSON.parse(metadata.permissions);
      if (!Array.isArray(permissions)) {
        errors.push('Permissions must be a JSON array');
      }
    } catch (e) {
      errors.push('Invalid JSON format for permissions');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    estimatedSize
  };
}