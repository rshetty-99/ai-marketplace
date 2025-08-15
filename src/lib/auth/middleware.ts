import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getAdminAuth } from '@/lib/firebase';
import { PermissionManager, Permission, User, Role } from '@/lib/rbac/permissions';
import { AuthenticationError, AuthorizationError, RateLimitExceededError } from '@/lib/utils/error-handler';
import { rateLimiter } from '@/lib/utils/rate-limiter';
import { logger } from '@/lib/utils/logger';
import { cache, CacheKeys } from '@/lib/utils/cache';

/**
 * Enhanced authentication and authorization middleware for API routes
 * Provides multi-tenant access control and comprehensive permission checking
 */

export interface AuthenticatedUser extends User {
  clerkUserId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
  organizationId?: string;
  permissions: Permission[];
  roles: Role[];
  session: {
    id: string;
    isValid: boolean;
    expiresAt: Date;
  };
}

/**
 * Authentication middleware options
 */
export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  permissions?: Permission[];
  roles?: string[];
  organizationRequired?: boolean;
  rateLimitRule?: string;
  skipRateLimit?: boolean;
  cacheUserData?: boolean;
  auditLog?: boolean;
}

/**
 * Extract user context from Clerk session
 */
async function getUserContext(req: NextRequest): Promise<AuthContext | null> {
  try {
    const { userId, sessionId } = await auth();
    
    if (!userId || !sessionId) {
      return null;
    }

    // Check cache first
    const cacheKey = CacheKeys.user(userId);
    let userData = cache.get<AuthenticatedUser>(cacheKey);

    if (!userData) {
      // Get user data from Clerk
      const clerkUser = await clerkClient().users.getUser(userId);
      const adminAuth = await getAdminAuth();
      
      // Get custom claims with roles and permissions
      const customClaims = await adminAuth.getUser(userId).then((user: any) => user.customClaims || {});
      
      userData = {
        id: userId,
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || '',
        organizationId: customClaims.organizationId,
        roles: customClaims.roles || [],
        isActive: !clerkUser.banned && !clerkUser.locked,
        createdAt: new Date(clerkUser.createdAt),
        updatedAt: new Date(clerkUser.updatedAt),
        ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      };

      // Cache user data for 5 minutes
      cache.set(cacheKey, userData, { ttl: 5 * 60 * 1000, tags: ['user', `user:${userId}`] });
    }

    // Get session info
    const session = await clerkClient().sessions.getSession(sessionId);
    
    return {
      user: userData,
      organizationId: userData.organizationId,
      permissions: userData.roles.flatMap(role => role.permissions),
      roles: userData.roles,
      session: {
        id: sessionId,
        isValid: session.status === 'active',
        expiresAt: new Date(session.expireAt)
      }
    };
  } catch (error) {
    logger.error('Failed to get user context', error as Error, {
      url: req.url,
      method: req.method
    });
    return null;
  }
}

/**
 * Check if user has required permissions
 */
function hasRequiredPermissions(
  context: AuthContext,
  requiredPermissions: Permission[],
  resourceId?: string
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every(permission =>
    PermissionManager.hasPermission(context.user, permission, resourceId)
  );
}

/**
 * Check if user has required roles
 */
function hasRequiredRoles(context: AuthContext, requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) {
    return true;
  }

  const userRoleNames = context.roles.map(role => role.name.toLowerCase());
  return requiredRoles.some(role => userRoleNames.includes(role.toLowerCase()));
}

/**
 * Extract resource ID from request for permission checking
 */
function extractResourceId(req: NextRequest): string | undefined {
  // Try to get resource ID from URL path
  const pathParts = req.nextUrl.pathname.split('/');
  
  // Look for common patterns like /api/v1/organizations/{id}
  const idIndex = pathParts.findIndex(part => 
    part.match(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/) || // UUID
    part.match(/^[a-zA-Z0-9]{20,}$/) // Long alphanumeric ID
  );

  if (idIndex > -1) {
    return pathParts[idIndex];
  }

  // Try to get from query parameters
  const resourceId = req.nextUrl.searchParams.get('id') || 
                     req.nextUrl.searchParams.get('resourceId') ||
                     req.nextUrl.searchParams.get('organizationId') ||
                     req.nextUrl.searchParams.get('projectId');

  return resourceId || undefined;
}

/**
 * Log authentication events for audit trail
 */
function logAuthEvent(
  event: string,
  success: boolean,
  context?: Partial<AuthContext>,
  req?: NextRequest,
  details?: Record<string, any>
): void {
  logger.logAuth(event, context?.user?.id, success, {
    ...details,
    organizationId: context?.organizationId,
    sessionId: context?.session?.id,
    url: req?.url,
    method: req?.method,
    ip: req?.ip || req?.headers.get('x-forwarded-for'),
    userAgent: req?.headers.get('user-agent')
  });
}

/**
 * Main authentication middleware
 */
export function withAuth(options: AuthMiddlewareOptions = {}) {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (req: NextRequest, ...args: any[]) => {
      const startTime = Date.now();

      try {
        // Rate limiting check first
        if (!options.skipRateLimit) {
          const rateLimitRule = options.rateLimitRule || 'default';
          await rateLimiter.checkRateLimit(req, rateLimitRule);
        }

        // Get authentication context
        const authContext = await getUserContext(req);

        // Check if authentication is required
        if (options.requireAuth !== false) {
          if (!authContext) {
            logAuthEvent('authentication_failed', false, undefined, req, { reason: 'no_context' });
            throw new AuthenticationError('Authentication required');
          }

          if (!authContext.session.isValid) {
            logAuthEvent('authentication_failed', false, authContext, req, { reason: 'invalid_session' });
            throw new AuthenticationError('Session expired or invalid');
          }

          if (!authContext.user.isActive) {
            logAuthEvent('authentication_failed', false, authContext, req, { reason: 'user_inactive' });
            throw new AuthenticationError('Account is inactive');
          }
        }

        // Check organization requirement
        if (options.organizationRequired && (!authContext || !authContext.organizationId)) {
          logAuthEvent('authorization_failed', false, authContext, req, { reason: 'no_organization' });
          throw new AuthorizationError('Organization membership required');
        }

        // Check role requirements
        if (options.roles && options.roles.length > 0 && authContext) {
          if (!hasRequiredRoles(authContext, options.roles)) {
            logAuthEvent('authorization_failed', false, authContext, req, { 
              reason: 'insufficient_roles',
              required: options.roles,
              actual: authContext.roles.map(r => r.name)
            });
            throw new AuthorizationError('Insufficient role permissions');
          }
        }

        // Check permission requirements
        if (options.permissions && options.permissions.length > 0 && authContext) {
          const resourceId = extractResourceId(req);
          
          if (!hasRequiredPermissions(authContext, options.permissions, resourceId)) {
            logAuthEvent('authorization_failed', false, authContext, req, {
              reason: 'insufficient_permissions',
              required: options.permissions,
              resourceId
            });
            throw new AuthorizationError('Insufficient permissions');
          }
        }

        // Add auth context to request headers for handler access
        if (authContext) {
          req.headers.set('x-user-id', authContext.user.id);
          req.headers.set('x-user-email', authContext.user.email);
          if (authContext.organizationId) {
            req.headers.set('x-organization-id', authContext.organizationId);
          }
          req.headers.set('x-session-id', authContext.session.id);
          req.headers.set('x-permissions', JSON.stringify(authContext.permissions));
        }

        // Log successful authentication
        if (authContext) {
          logAuthEvent('authentication_success', true, authContext, req);
        }

        // Call the original handler
        const response = await handler(req, ...args);

        // Log successful request
        const duration = Date.now() - startTime;
        logger.logRequest(req, {
          userId: authContext?.user.id,
          organizationId: authContext?.organizationId,
          duration,
          authenticated: !!authContext
        });

        return response;

      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
          logger.warn(`Auth error: ${error.message}`, {
            url: req.url,
            method: req.method,
            duration,
            error: error.message
          });
        } else if (error instanceof RateLimitExceededError) {
          logger.warn('Rate limit exceeded', {
            url: req.url,
            method: req.method,
            duration
          });
        } else {
          logger.error('Authentication middleware error', error as Error, {
            url: req.url,
            method: req.method,
            duration
          });
        }

        throw error;
      }
    }) as T;
  };
}

/**
 * Helper to get auth context from request
 */
export function getAuthContextFromRequest(req: NextRequest): Partial<AuthContext> | null {
  const userId = req.headers.get('x-user-id');
  const userEmail = req.headers.get('x-user-email');
  const organizationId = req.headers.get('x-organization-id');
  const sessionId = req.headers.get('x-session-id');
  const permissionsHeader = req.headers.get('x-permissions');

  if (!userId || !userEmail) {
    return null;
  }

  let permissions: Permission[] = [];
  if (permissionsHeader) {
    try {
      permissions = JSON.parse(permissionsHeader);
    } catch (error) {
      console.warn('Failed to parse permissions header:', error);
    }
  }

  return {
    user: {
      id: userId,
      email: userEmail,
      organizationId: organizationId || undefined
    } as AuthenticatedUser,
    organizationId: organizationId || undefined,
    permissions,
    session: sessionId ? {
      id: sessionId,
      isValid: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 24h
    } : undefined
  };
}

/**
 * Admin-only middleware
 */
export const withAdmin = withAuth({
  requireAuth: true,
  permissions: [Permission.PLATFORM_ADMIN],
  rateLimitRule: 'admin',
  auditLog: true
});

/**
 * Organization member middleware
 */
export const withOrganization = withAuth({
  requireAuth: true,
  organizationRequired: true,
  rateLimitRule: 'default',
  auditLog: true
});

/**
 * Provider-only middleware
 */
export const withProvider = withAuth({
  requireAuth: true,
  roles: ['provider', 'freelancer', 'agency', 'consultant'],
  rateLimitRule: 'default'
});

/**
 * Public endpoint middleware (optional auth)
 */
export const withOptionalAuth = withAuth({
  requireAuth: false,
  skipRateLimit: false,
  rateLimitRule: 'search'
});

/**
 * Webhook middleware (no auth but with verification)
 */
export function withWebhookAuth(secretHeader: string = 'x-webhook-secret') {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (req: NextRequest, ...args: any[]) => {
      const providedSecret = req.headers.get(secretHeader);
      const expectedSecret = process.env.WEBHOOK_SECRET;

      if (!providedSecret || !expectedSecret || providedSecret !== expectedSecret) {
        logger.logSecurityEvent('webhook_auth_failed', 'medium', {
          url: req.url,
          method: req.method,
          ip: req.ip || req.headers.get('x-forwarded-for'),
          providedSecret: providedSecret ? 'present' : 'missing'
        });
        throw new AuthenticationError('Invalid webhook authentication');
      }

      logger.info('Webhook authenticated successfully', {
        url: req.url,
        method: req.method
      });

      return handler(req, ...args);
    }) as T;
  };
}

/**
 * Multi-tenant organization isolation middleware
 */
export function withOrganizationIsolation() {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (req: NextRequest, ...args: any[]) => {
      const authContext = getAuthContextFromRequest(req);
      
      if (!authContext?.organizationId) {
        throw new AuthorizationError('Organization context required');
      }

      // Extract resource organization ID for cross-tenant access check
      const resourceOrgId = req.nextUrl.searchParams.get('organizationId') ||
                           req.nextUrl.searchParams.get('orgId');

      if (resourceOrgId && resourceOrgId !== authContext.organizationId) {
        // Check if user has cross-tenant access permissions
        if (!authContext.permissions?.includes(Permission.PLATFORM_ADMIN)) {
          logger.logSecurityEvent('cross_tenant_access_attempt', 'high', {
            userId: authContext.user?.id,
            userOrgId: authContext.organizationId,
            requestedOrgId: resourceOrgId,
            url: req.url,
            method: req.method
          });
          throw new AuthorizationError('Cross-organization access denied');
        }
      }

      return handler(req, ...args);
    }) as T;
  };
}

/**
 * API key authentication middleware (for external integrations)
 */
export function withApiKeyAuth() {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (req: NextRequest, ...args: any[]) => {
      const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!apiKey) {
        throw new AuthenticationError('API key required');
      }

      // TODO: Validate API key against database
      // For now, this is a placeholder implementation
      const isValidApiKey = apiKey.startsWith('ak_') && apiKey.length > 20;
      
      if (!isValidApiKey) {
        logger.logSecurityEvent('invalid_api_key_attempt', 'medium', {
          apiKey: apiKey.substring(0, 10) + '...',
          url: req.url,
          method: req.method,
          ip: req.ip || req.headers.get('x-forwarded-for')
        });
        throw new AuthenticationError('Invalid API key');
      }

      // Add API key context to request
      req.headers.set('x-api-key-authenticated', 'true');
      req.headers.set('x-api-key', apiKey);

      logger.info('API key authenticated successfully', {
        apiKey: apiKey.substring(0, 10) + '...',
        url: req.url,
        method: req.method
      });

      return handler(req, ...args);
    }) as T;
  };
}

// Export middleware utilities
export { AuthMiddlewareOptions, AuthContext, AuthenticatedUser };
export { getUserContext, hasRequiredPermissions, hasRequiredRoles, extractResourceId };