import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { withErrorHandler, createSuccessResponse } from '@/lib/utils/error-handler';
import { withAuth } from '@/lib/auth/middleware';
import { validateSchema, ValidationSchemas } from '@/lib/validators';
import { logger } from '@/lib/utils/logger';
import { cache, CacheKeys } from '@/lib/utils/cache';
import { AuthValidateResponse } from '@/types/api';

/**
 * POST /api/v1/auth/validate
 * Validate authentication token and return user information
 */
export const POST = withErrorHandler(
  withAuth({ requireAuth: true, rateLimitRule: 'auth' })(
    async (req: NextRequest): Promise<NextResponse<AuthValidateResponse>> => {
      try {
        // Validate request body
        const body = await req.json();
        const { token } = validateSchema(ValidationSchemas.AuthValidate, body);

        // Get current auth context
        const { userId, sessionId } = await auth();

        if (!userId || !sessionId) {
          return createSuccessResponse<AuthValidateResponse>({
            valid: false
          });
        }

        // Check cache first
        const cacheKey = CacheKeys.user(userId);
        let userData = cache.get(cacheKey);

        if (!userData) {
          // Get user data from Clerk
          const clerkUser = await clerkClient().users.getUser(userId);
          const session = await clerkClient().sessions.getSession(sessionId);

          // Get user roles and permissions from custom claims
          // TODO: Integrate with Firebase custom claims
          const roles: string[] = []; // Get from Firebase custom claims
          const permissions: string[] = []; // Get from Firebase custom claims

          userData = {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            organizationId: undefined, // Get from custom claims
            roles,
            permissions
          };

          // Cache for 5 minutes
          cache.set(cacheKey, userData, { ttl: 5 * 60 * 1000, tags: ['user', `user:${userId}`] });
        }

        // Get session information
        const session = await clerkClient().sessions.getSession(sessionId);
        const expiresAt = new Date(session.expireAt).toISOString();

        logger.logAuth('token_validation', userId, true, {
          sessionId,
          expiresAt
        });

        return createSuccessResponse<AuthValidateResponse>({
          valid: true,
          user: userData,
          expiresAt
        });

      } catch (error) {
        logger.error('Auth validation failed', error as Error);
        return createSuccessResponse<AuthValidateResponse>({
          valid: false
        });
      }
    }
  )
);

// Export allowed methods
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';