import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, createSuccessResponse } from '@/lib/utils/error-handler';
import { withAuth, getAuthContextFromRequest } from '@/lib/auth/middleware';
import { PermissionManager } from '@/lib/rbac/permissions';
import { validateSchema, ValidationSchemas } from '@/lib/validators';
import { logger } from '@/lib/utils/logger';
import { AuthPermissionsResponse } from '@/types/api';

/**
 * POST /api/v1/auth/permissions
 * Check if user has specific permissions
 */
export const POST = withErrorHandler(
  withAuth({ requireAuth: true, rateLimitRule: 'auth' })(
    async (req: NextRequest): Promise<NextResponse<AuthPermissionsResponse>> => {
      const body = await req.json();
      const { userId, permissions, resourceId } = validateSchema(
        ValidationSchemas.AuthPermissions,
        body
      );

      const authContext = getAuthContextFromRequest(req);
      
      if (!authContext?.user) {
        return createSuccessResponse<AuthPermissionsResponse>({
          hasPermission: false,
          permissions: {}
        });
      }

      // Check if the requesting user can check permissions for the target user
      if (authContext.user.id !== userId && !PermissionManager.hasPermission(authContext.user, 'platform_admin' as any)) {
        logger.logSecurityEvent('unauthorized_permission_check', 'medium', {
          requestingUserId: authContext.user.id,
          targetUserId: userId,
          permissions
        });

        return createSuccessResponse<AuthPermissionsResponse>({
          hasPermission: false,
          permissions: {}
        });
      }

      // Get target user data (from cache or database)
      let targetUser = authContext.user;
      if (userId !== authContext.user.id) {
        // TODO: Fetch target user data from database
        // For now, assume same user
      }

      // Check each permission
      const permissionResults: Record<string, boolean> = {};
      let hasAllPermissions = true;

      for (const permission of permissions) {
        const hasPermission = PermissionManager.hasPermission(
          targetUser,
          permission as any,
          resourceId
        );
        
        permissionResults[permission] = hasPermission;
        
        if (!hasPermission) {
          hasAllPermissions = false;
        }
      }

      logger.info('Permission check completed', {
        userId,
        permissions,
        resourceId,
        results: permissionResults,
        hasAllPermissions
      });

      return createSuccessResponse<AuthPermissionsResponse>({
        hasPermission: hasAllPermissions,
        permissions: permissionResults
      });
    }
  )
);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';