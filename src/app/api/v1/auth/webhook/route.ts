import { NextRequest, NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { withErrorHandler, createSuccessResponse } from '@/lib/utils/error-handler';
import { getAdminDb } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';
import { cache, CacheTags } from '@/lib/utils/cache';
import { 
  syncUserToSessionClaims, 
  initializeNewUserSessionClaims,
  updateOrganizationMembership,
  removeOrganizationMembership,
  updateUserRolesInSession
} from '@/lib/auth/session-management';
import {
  handleNewOrganizationMember,
  syncClerkRoleToMarketplace,
  determineOrganizationType
} from '@/lib/auth/role-mapping';
import { gdprDeletionService } from '@/lib/firebase/gdpr-deletion-service';
import { UserType } from '@/lib/firebase/storage-architecture';

/**
 * POST /api/v1/auth/webhook
 * Handle Clerk webhook events for user management
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('CLERK_WEBHOOK_SECRET is not set');
    }

    // Get headers
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      logger.logSecurityEvent('webhook_missing_headers', 'medium', {
        url: req.url,
        headers: Object.fromEntries(headerPayload.entries())
      });
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
    }

    // Get request body
    const body = await req.text();

    // Verify webhook signature
    const webhook = new Webhook(webhookSecret);
    let event: WebhookEvent;

    try {
      event = webhook.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookEvent;
    } catch (error) {
      logger.logSecurityEvent('webhook_signature_verification_failed', 'high', {
        error: (error as Error).message,
        svixId,
        url: req.url
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get Firebase Admin DB
    const adminDb = await getAdminDb();

    // Process webhook event
    const { type, data } = event;

    logger.info('Processing Clerk webhook event', {
      type,
      userId: data.id,
      svixId
    });

    switch (type) {
      case 'user.created':
        await handleUserCreated(adminDb, data);
        break;

      case 'user.updated':
        await handleUserUpdated(adminDb, data);
        break;

      case 'user.deleted':
        await handleUserDeleted(adminDb, data);
        break;

      case 'session.created':
        await handleSessionCreated(adminDb, data);
        break;

      case 'session.ended':
        await handleSessionEnded(adminDb, data);
        break;

      case 'organizationMembership.created':
        await handleOrganizationMembershipCreated(adminDb, data);
        break;

      case 'organizationMembership.updated':
        await handleOrganizationMembershipUpdated(adminDb, data);
        break;

      case 'organizationMembership.deleted':
        await handleOrganizationMembershipDeleted(adminDb, data);
        break;

      default:
        logger.info('Unhandled webhook event type', { type, userId: data.id });
    }

    return createSuccessResponse({ received: true });

  } catch (error) {
    logger.error('Webhook processing failed', error as Error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
});

/**
 * Handle user created event
 */
async function handleUserCreated(adminDb: any, userData: any) {
  try {
    const userId = userData.id;
    
    // Create user document in Firestore
    await adminDb.collection('users').doc(userId).set({
      id: userId,
      email: userData.email_addresses?.[0]?.email_address || '',
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || '',
      avatar: userData.image_url,
      roles: [], // Default empty roles
      organizationId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        clerkCreatedAt: new Date(userData.created_at),
        clerkUpdatedAt: new Date(userData.updated_at),
        emailVerified: userData.email_addresses?.[0]?.verification?.status === 'verified',
        phoneVerified: userData.phone_numbers?.[0]?.verification?.status === 'verified'
      }
    });

    // Initialize session claims for new user
    await initializeNewUserSessionClaims(userId);

    // Invalidate user cache
    cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

    logger.logAudit('user_created', userId, 'user', userId, {
      email: userData.email_addresses?.[0]?.email_address,
      createdViaClerk: true
    });

    logger.info('User created successfully with session claims', { userId });

  } catch (error) {
    logger.error('Failed to handle user created event', error as Error, {
      userId: userData.id
    });
    throw error;
  }
}

/**
 * Handle user updated event
 */
async function handleUserUpdated(adminDb: any, userData: any) {
  try {
    const userId = userData.id;

    // Update user document in Firestore
    await adminDb.collection('users').doc(userId).update({
      email: userData.email_addresses?.[0]?.email_address || '',
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || '',
      avatar: userData.image_url,
      updatedAt: new Date(),
      'metadata.clerkUpdatedAt': new Date(userData.updated_at),
      'metadata.emailVerified': userData.email_addresses?.[0]?.verification?.status === 'verified',
      'metadata.phoneVerified': userData.phone_numbers?.[0]?.verification?.status === 'verified'
    });

    // Sync updated user data to session claims
    await syncUserToSessionClaims(userId);

    // Invalidate user cache
    cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

    logger.logAudit('user_updated', userId, 'user', userId, {
      email: userData.email_addresses?.[0]?.email_address,
      updatedViaClerk: true
    });

    logger.info('User updated successfully with session claims sync', { userId });

  } catch (error) {
    logger.error('Failed to handle user updated event', error as Error, {
      userId: userData.id
    });
    throw error;
  }
}

/**
 * Handle user deleted event with GDPR-compliant storage cleanup
 */
async function handleUserDeleted(adminDb: any, userData: any) {
  try {
    const userId = userData.id;

    // Get user data to determine user type and organization
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userInfo = userDoc.exists ? userDoc.data() : null;
    
    const userType = determineUserType(userInfo);
    const organizationId = userInfo?.organizationId;

    // Soft delete - mark as inactive instead of deleting
    await adminDb.collection('users').doc(userId).update({
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date(),
      gdprDeletionInitiated: true
    });

    // Initiate GDPR-compliant storage cleanup
    try {
      const cleanupJob = await gdprDeletionService.executeGDPRUserDeletion(
        userId,
        userType,
        'user_request', // User account deletion via Clerk
        organizationId
      );

      logger.logAudit('gdpr_deletion_initiated', userId, 'cleanup_job', cleanupJob.id, {
        userType,
        organizationId,
        deletionReason: 'user_request',
        deletedViaClerk: true
      });

      // Update user record with cleanup job reference
      await adminDb.collection('users').doc(userId).update({
        gdprCleanupJobId: cleanupJob.id,
        updatedAt: new Date()
      });

      logger.info('GDPR deletion initiated', { 
        userId, 
        userType, 
        cleanupJobId: cleanupJob.id,
        organizationId
      });

    } catch (cleanupError) {
      logger.error('Failed to initiate GDPR cleanup', cleanupError as Error, {
        userId,
        userType
      });
      
      // Mark cleanup as failed but continue with user deletion
      await adminDb.collection('users').doc(userId).update({
        gdprDeletionFailed: true,
        gdprDeletionError: cleanupError.message,
        updatedAt: new Date()
      });
    }

    // Invalidate user cache
    cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

    logger.logAudit('user_deleted', userId, 'user', userId, {
      deletedViaClerk: true,
      softDelete: true,
      gdprCompliant: true,
      userType,
      organizationId
    });

    logger.info('User deletion completed with GDPR compliance', { userId });

  } catch (error) {
    logger.error('Failed to handle user deleted event', error as Error, {
      userId: userData.id
    });
    throw error;
  }
}

/**
 * Helper function to determine user type from user data
 */
function determineUserType(userInfo: any): UserType {
  if (!userInfo) return UserType.FREELANCER; // Default
  
  // Check user roles or organization type to determine user type
  if (userInfo.roles?.includes('vendor') || userInfo.organizationType === 'vendor') {
    return UserType.VENDOR;
  }
  
  if (userInfo.roles?.includes('customer') || userInfo.organizationType === 'customer') {
    return UserType.CUSTOMER;
  }
  
  if (userInfo.organizationId) {
    return UserType.ORGANIZATION;
  }
  
  // Default to freelancer
  return UserType.FREELANCER;
}

/**
 * Handle session created event
 */
async function handleSessionCreated(adminDb: any, sessionData: any) {
  try {
    const userId = sessionData.user_id;
    const sessionId = sessionData.id;

    // Log session creation for audit
    logger.logAudit('session_created', userId, 'session', sessionId, {
      sessionId,
      ipAddress: sessionData.last_active_at,
      userAgent: 'unknown' // Not available in webhook
    });

    // Update user last active timestamp
    await adminDb.collection('users').doc(userId).update({
      lastActiveAt: new Date(),
      updatedAt: new Date()
    });

    logger.info('Session created', { userId, sessionId });

  } catch (error) {
    logger.error('Failed to handle session created event', error as Error, {
      userId: sessionData.user_id,
      sessionId: sessionData.id
    });
    throw error;
  }
}

/**
 * Handle session ended event
 */
async function handleSessionEnded(adminDb: any, sessionData: any) {
  try {
    const userId = sessionData.user_id;
    const sessionId = sessionData.id;

    // Log session end for audit
    logger.logAudit('session_ended', userId, 'session', sessionId, {
      sessionId,
      endedAt: new Date()
    });

    // Invalidate any cached data for this user session
    cache.invalidateByTags([`user:${userId}`, `session:${sessionId}`]);

    logger.info('Session ended', { userId, sessionId });

  } catch (error) {
    logger.error('Failed to handle session ended event', error as Error, {
      userId: sessionData.user_id,
      sessionId: sessionData.id
    });
    throw error;
  }
}

/**
 * Handle organization membership created event
 */
async function handleOrganizationMembershipCreated(adminDb: any, membershipData: any) {
  try {
    const userId = membershipData.public_user_data?.user_id;
    const organizationId = membershipData.organization?.id;
    const organizationName = membershipData.organization?.name;
    const role = membershipData.role;

    if (!userId || !organizationId) {
      logger.warn('Missing user or organization ID in membership event', membershipData);
      return;
    }

    // Update user's organization and roles
    await adminDb.collection('users').doc(userId).update({
      organizationId,
      organizationName,
      organizationRole: role,
      updatedAt: new Date()
    });

    // Handle new organization member with role mapping
    await handleNewOrganizationMember(
      userId, 
      organizationId, 
      organizationName, 
      role,
      membershipData.organization?.slug
    );

    // Organization membership session claims are updated in handleNewOrganizationMember

    // Invalidate caches
    cache.invalidateByTags([
      CacheTags.USER,
      CacheTags.ORGANIZATION,
      `user:${userId}`,
      `org:${organizationId}`
    ]);

    logger.logAudit('organization_membership_created', userId, 'membership', membershipData.id, {
      organizationId,
      role
    });

    logger.info('Organization membership created with session claims update', { userId, organizationId, role });

  } catch (error) {
    logger.error('Failed to handle organization membership created event', error as Error, {
      membershipData
    });
    throw error;
  }
}

/**
 * Handle organization membership updated event
 */
async function handleOrganizationMembershipUpdated(adminDb: any, membershipData: any) {
  try {
    const userId = membershipData.public_user_data?.user_id;
    const organizationId = membershipData.organization?.id;
    const organizationName = membershipData.organization?.name;
    const role = membershipData.role;

    if (!userId || !organizationId) {
      logger.warn('Missing user or organization ID in membership event', membershipData);
      return;
    }

    // Update user's organization role
    await adminDb.collection('users').doc(userId).update({
      organizationRole: role,
      updatedAt: new Date()
    });

    // Determine organization type for role mapping
    const orgType = await determineOrganizationType(
      organizationId, 
      organizationName,
      membershipData.organization?.slug
    );

    // Sync the updated Clerk role to marketplace role
    await syncClerkRoleToMarketplace(
      userId,
      role,
      organizationId,
      organizationName,
      orgType
    );

    // Organization membership session claims are updated in syncClerkRoleToMarketplace

    // Invalidate caches
    cache.invalidateByTags([
      CacheTags.USER,
      CacheTags.ORGANIZATION,
      `user:${userId}`,
      `org:${organizationId}`
    ]);

    logger.logAudit('organization_membership_updated', userId, 'membership', membershipData.id, {
      organizationId,
      role
    });

    logger.info('Organization membership updated with session claims', { userId, organizationId, role });

  } catch (error) {
    logger.error('Failed to handle organization membership updated event', error as Error, {
      membershipData
    });
    throw error;
  }
}

/**
 * Handle organization membership deleted event
 */
async function handleOrganizationMembershipDeleted(adminDb: any, membershipData: any) {
  try {
    const userId = membershipData.public_user_data?.user_id;
    const organizationId = membershipData.organization?.id;

    if (!userId) {
      logger.warn('Missing user ID in membership deletion event', membershipData);
      return;
    }

    // Remove user's organization association
    await adminDb.collection('users').doc(userId).update({
      organizationId: null,
      organizationName: null,
      organizationRole: null,
      updatedAt: new Date()
    });

    // Remove organization membership from session claims
    await removeOrganizationMembership(userId);

    // Clean up organization-specific roles in database
    await adminDb.collection('users').doc(userId).update({
      roles: [], // Clear all roles when leaving organization
      organizationType: null,
      updatedAt: new Date()
    });

    // Clear roles from session claims
    await updateUserRolesInSession(userId, []);

    // Invalidate caches
    cache.invalidateByTags([
      CacheTags.USER,
      CacheTags.ORGANIZATION,
      `user:${userId}`,
      `org:${organizationId}`
    ]);

    logger.logAudit('organization_membership_deleted', userId, 'membership', membershipData.id, {
      organizationId
    });

    logger.info('Organization membership deleted with session claims cleanup', { userId, organizationId });

  } catch (error) {
    logger.error('Failed to handle organization membership deleted event', error as Error, {
      membershipData
    });
    throw error;
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';