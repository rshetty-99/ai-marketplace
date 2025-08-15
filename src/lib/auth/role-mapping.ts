/**
 * Clerk Role Mapping and Synchronization
 * 
 * This module handles the synchronization between Clerk organization roles
 * and the internal marketplace role system.
 */

import { clerkClient } from '@clerk/nextjs/server';
import { getAdminDb } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';
import { 
  MARKETPLACE_ROLES, 
  RoleName, 
  getUserTypeRoles,
  getDefaultRole,
  getRolePermissions,
  Permission 
} from '@/lib/firebase/rbac-schema';
import { 
  updateUserRolesInSession, 
  updateOrganizationMembership,
  UserSessionMetadata 
} from '@/lib/auth/session-management';

/**
 * Mapping between Clerk organization roles and internal marketplace roles
 */
export const CLERK_ROLE_MAPPING = {
  // Clerk Admin roles map to our admin roles
  'org:admin': {
    vendor: 'vendor_admin',
    customer: 'customer_admin'
  },
  
  // Clerk Member role maps based on organization type and user preference
  'org:member': {
    vendor: 'project_engineer', // Default for new vendor members
    customer: 'project_lead_customer' // Default for new customer members
  },

  // Custom Clerk roles that map to specialized marketplace roles
  'org:finance_manager': {
    vendor: 'finance_manager_vendor',
    customer: 'finance_manager_customer'
  },
  'org:project_lead': {
    vendor: 'project_lead_vendor',
    customer: 'project_lead_customer'
  },
  'org:customer_success': {
    vendor: 'customer_success_manager',
    customer: null // Not applicable for customer orgs
  },
  'org:engineer': {
    vendor: 'project_engineer',
    customer: null // Not applicable for customer orgs
  }
} as const;

/**
 * Reverse mapping: internal roles to Clerk roles
 */
export const MARKETPLACE_TO_CLERK_MAPPING = {
  // Admin roles
  vendor_admin: 'org:admin',
  customer_admin: 'org:admin',
  
  // Specialized roles
  finance_manager_vendor: 'org:finance_manager',
  finance_manager_customer: 'org:finance_manager',
  project_lead_vendor: 'org:project_lead',
  project_lead_customer: 'org:project_lead',
  customer_success_manager: 'org:customer_success',
  project_engineer: 'org:engineer',
  
  // Freelancer doesn't map to Clerk org roles
  freelancer: null
} as const;

/**
 * Get internal marketplace role from Clerk role
 */
export function getMarketplaceRoleFromClerk(
  clerkRole: string, 
  orgType: 'vendor' | 'customer'
): RoleName | null {
  const mapping = CLERK_ROLE_MAPPING[clerkRole as keyof typeof CLERK_ROLE_MAPPING];
  if (!mapping) return null;
  
  const role = mapping[orgType];
  return role ? role as RoleName : null;
}

/**
 * Get Clerk role from internal marketplace role
 */
export function getClerkRoleFromMarketplace(marketplaceRole: RoleName): string | null {
  return MARKETPLACE_TO_CLERK_MAPPING[marketplaceRole] || null;
}

/**
 * Sync user's Clerk role to internal marketplace role system
 */
export async function syncClerkRoleToMarketplace(
  userId: string,
  clerkRole: string,
  organizationId: string,
  organizationName: string,
  orgType: 'vendor' | 'customer'
): Promise<void> {
  try {
    const adminDb = await getAdminDb();
    
    // Get the marketplace role from Clerk role
    const marketplaceRole = getMarketplaceRoleFromClerk(clerkRole, orgType);
    
    if (!marketplaceRole) {
      logger.warn('No marketplace role mapping found for Clerk role', {
        userId,
        clerkRole,
        orgType
      });
      return;
    }

    // Create role object with permissions
    const roleData = {
      id: marketplaceRole,
      name: MARKETPLACE_ROLES[marketplaceRole].name,
      type: orgType,
      permissions: getRolePermissions(marketplaceRole),
      organizationId,
      tier: orgType === 'vendor' ? 'professional' : undefined
    };

    // Update user document in Firestore
    await adminDb.collection('users').doc(userId).update({
      roles: [roleData],
      organizationId,
      organizationName,
      organizationRole: clerkRole,
      organizationType: orgType,
      updatedAt: new Date()
    });

    // Update session claims
    await updateUserRolesInSession(userId, [roleData]);
    await updateOrganizationMembership(userId, organizationId, organizationName, clerkRole, orgType);

    logger.info('Successfully synced Clerk role to marketplace role', {
      userId,
      clerkRole,
      marketplaceRole,
      organizationId,
      orgType
    });

  } catch (error) {
    logger.error('Failed to sync Clerk role to marketplace role', error as Error, {
      userId,
      clerkRole,
      organizationId,
      orgType
    });
    throw error;
  }
}

/**
 * Update user's Clerk role when marketplace role changes
 */
export async function syncMarketplaceRoleToClerk(
  userId: string,
  marketplaceRole: RoleName,
  organizationId: string
): Promise<void> {
  try {
    const clerkRole = getClerkRoleFromMarketplace(marketplaceRole);
    
    if (!clerkRole) {
      logger.warn('No Clerk role mapping found for marketplace role', {
        userId,
        marketplaceRole
      });
      return;
    }

    // Update the user's role in Clerk organization
    await clerkClient().organizations.updateOrganizationMembership({
      organizationId,
      userId,
      role: clerkRole as any
    });

    logger.info('Successfully synced marketplace role to Clerk role', {
      userId,
      marketplaceRole,
      clerkRole,
      organizationId
    });

  } catch (error) {
    logger.error('Failed to sync marketplace role to Clerk role', error as Error, {
      userId,
      marketplaceRole,
      organizationId
    });
    throw error;
  }
}

/**
 * Determine organization type from organization data
 */
export async function determineOrganizationType(
  organizationId: string,
  organizationName: string,
  organizationSlug?: string
): Promise<'vendor' | 'customer'> {
  try {
    const adminDb = await getAdminDb();
    
    // Check if organization exists in our system
    const orgDoc = await adminDb.collection('organizations').doc(organizationId).get();
    
    if (orgDoc.exists) {
      const orgData = orgDoc.data();
      return orgData?.type || 'customer'; // Default to customer
    }

    // If organization doesn't exist, try to infer from name/slug
    const nameOrSlug = organizationName.toLowerCase() || organizationSlug?.toLowerCase() || '';
    
    // Simple heuristics for determining org type
    const vendorKeywords = ['agency', 'studio', 'dev', 'tech', 'consulting', 'services', 'solutions'];
    const customerKeywords = ['inc', 'corp', 'company', 'enterprise', 'business', 'group'];
    
    const isVendor = vendorKeywords.some(keyword => nameOrSlug.includes(keyword));
    const isCustomer = customerKeywords.some(keyword => nameOrSlug.includes(keyword));
    
    // Default logic: if contains vendor keywords, it's vendor; otherwise customer
    const orgType = isVendor && !isCustomer ? 'vendor' : 'customer';
    
    // Create organization record for future reference
    await adminDb.collection('organizations').doc(organizationId).set({
      id: organizationId,
      name: organizationName,
      slug: organizationSlug,
      type: orgType,
      createdAt: new Date(),
      updatedAt: new Date(),
      autoDetected: true
    });

    logger.info('Auto-determined organization type', {
      organizationId,
      organizationName,
      detectedType: orgType,
      isVendor,
      isCustomer
    });

    return orgType;

  } catch (error) {
    logger.error('Failed to determine organization type', error as Error, {
      organizationId,
      organizationName
    });
    
    // Default to customer on error
    return 'customer';
  }
}

/**
 * Handle new organization member - assign appropriate default role
 */
export async function handleNewOrganizationMember(
  userId: string,
  organizationId: string,
  organizationName: string,
  clerkRole: string,
  organizationSlug?: string
): Promise<void> {
  try {
    const adminDb = await getAdminDb();

    // Determine organization type
    const orgType = await determineOrganizationType(organizationId, organizationName, organizationSlug);

    // Check if this is the first member of the organization
    const orgMembersQuery = await adminDb
      .collection('users')
      .where('organizationId', '==', organizationId)
      .get();
    
    const isFirstMember = orgMembersQuery.empty;
    
    // Get default role based on organization type and member count
    let marketplaceRole: RoleName;
    
    if (clerkRole === 'org:admin' || isFirstMember) {
      // Admin role or first member gets admin access
      marketplaceRole = orgType === 'vendor' ? 'vendor_admin' : 'customer_admin';
    } else {
      // Regular members get default roles
      marketplaceRole = orgType === 'vendor' ? 'project_engineer' : 'project_lead_customer';
    }

    // Sync the role
    await syncClerkRoleToMarketplace(
      userId, 
      clerkRole, 
      organizationId, 
      organizationName, 
      orgType
    );

    logger.info('Successfully handled new organization member', {
      userId,
      organizationId,
      orgType,
      isFirstMember,
      assignedRole: marketplaceRole
    });

  } catch (error) {
    logger.error('Failed to handle new organization member', error as Error, {
      userId,
      organizationId,
      clerkRole
    });
    throw error;
  }
}

/**
 * Bulk sync all organization members (for migration)
 */
export async function bulkSyncOrganizationMembers(
  organizationId: string
): Promise<{ succeeded: string[]; failed: Array<{ userId: string; error: string }> }> {
  const succeeded: string[] = [];
  const failed: Array<{ userId: string; error: string }> = [];

  try {
    // Get organization from Clerk
    const organization = await clerkClient().organizations.getOrganization({
      organizationId
    });

    // Get all organization memberships
    const memberships = await clerkClient().organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100
    });

    // Determine organization type
    const orgType = await determineOrganizationType(
      organizationId, 
      organization.name, 
      organization.slug
    );

    // Process each membership
    for (const membership of memberships.data) {
      try {
        const userId = membership.publicUserData.userId;
        const clerkRole = membership.role;
        
        await syncClerkRoleToMarketplace(
          userId!,
          clerkRole,
          organizationId,
          organization.name,
          orgType
        );
        
        succeeded.push(userId!);
      } catch (error) {
        failed.push({
          userId: membership.publicUserData.userId!,
          error: (error as Error).message
        });
      }
    }

    logger.info('Bulk sync completed for organization', {
      organizationId,
      total: memberships.data.length,
      succeeded: succeeded.length,
      failed: failed.length
    });

  } catch (error) {
    logger.error('Failed to bulk sync organization members', error as Error, {
      organizationId
    });
    throw error;
  }

  return { succeeded, failed };
}

/**
 * Export types for external use
 */
export type { UserSessionMetadata };

/**
 * Get dashboard menu permissions for role
 */
export function getDashboardPermissionsForRole(roleName: RoleName): Permission[] {
  return getRolePermissions(roleName);
}

/**
 * Check if user can perform action based on role
 */
export function canPerformAction(
  userRole: RoleName,
  requiredPermission: Permission
): boolean {
  const rolePermissions = getRolePermissions(userRole);
  return rolePermissions.includes(requiredPermission);
}