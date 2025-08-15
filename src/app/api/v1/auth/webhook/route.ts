import { NextRequest, NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { withErrorHandler, createSuccessResponse } from '@/lib/utils/error-handler';
import { getAdminDb } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';
import { cache, CacheTags } from '@/lib/utils/cache';

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

    // Invalidate user cache
    cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

    logger.logAudit('user_created', userId, 'user', userId, {
      email: userData.email_addresses?.[0]?.email_address,
      createdViaClerk: true
    });

    logger.info('User created successfully', { userId });

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

    // Invalidate user cache
    cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

    logger.logAudit('user_updated', userId, 'user', userId, {
      email: userData.email_addresses?.[0]?.email_address,
      updatedViaClerk: true
    });

    logger.info('User updated successfully', { userId });

  } catch (error) {
    logger.error('Failed to handle user updated event', error as Error, {
      userId: userData.id
    });
    throw error;
  }
}

/**
 * Handle user deleted event
 */
async function handleUserDeleted(adminDb: any, userData: any) {
  try {
    const userId = userData.id;

    // Soft delete - mark as inactive instead of deleting
    await adminDb.collection('users').doc(userId).update({
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date()
    });

    // TODO: Handle cascading deletes for user's projects, services, etc.
    // This should be done carefully to preserve business data integrity

    // Invalidate user cache
    cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

    logger.logAudit('user_deleted', userId, 'user', userId, {
      deletedViaClerk: true,
      softDelete: true
    });

    logger.info('User marked as deleted', { userId });

  } catch (error) {
    logger.error('Failed to handle user deleted event', error as Error, {
      userId: userData.id
    });
    throw error;
  }
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
    const role = membershipData.role;

    if (!userId || !organizationId) {
      logger.warn('Missing user or organization ID in membership event', membershipData);
      return;
    }

    // Update user's organization and roles
    await adminDb.collection('users').doc(userId).update({
      organizationId,
      updatedAt: new Date()
    });

    // TODO: Map Clerk roles to internal permission system
    // For now, store the Clerk role directly

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

    logger.info('Organization membership created', { userId, organizationId, role });

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
    const role = membershipData.role;

    if (!userId || !organizationId) {
      logger.warn('Missing user or organization ID in membership event', membershipData);
      return;
    }

    // TODO: Update user roles based on new membership role

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

    logger.info('Organization membership updated', { userId, organizationId, role });

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
      updatedAt: new Date()
    });

    // TODO: Handle cleanup of organization-specific roles and permissions

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

    logger.info('Organization membership deleted', { userId, organizationId });

  } catch (error) {
    logger.error('Failed to handle organization membership deleted event', error as Error, {
      membershipData
    });
    throw error;
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';