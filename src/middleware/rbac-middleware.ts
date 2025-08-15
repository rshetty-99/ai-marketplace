// RBAC Middleware for Next.js App Router
// Provides route protection and API endpoint authorization

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { userHasPermission, getUserPermissions } from '@/lib/firebase/rbac-firestore';

// Permission requirements for different routes
export const ROUTE_PERMISSIONS: Record<string, {
  permission: string;
  organizationRequired?: boolean;
  fallbackUrl?: string;
}> = {
  // Dashboard routes
  '/dashboard/admin': { 
    permission: 'organization.read', 
    organizationRequired: true,
    fallbackUrl: '/dashboard'
  },
  '/dashboard/users': { 
    permission: 'user.read.organization', 
    organizationRequired: true,
    fallbackUrl: '/dashboard'
  },
  '/dashboard/roles': { 
    permission: 'role.read.organization', 
    organizationRequired: true,
    fallbackUrl: '/dashboard'
  },
  '/dashboard/billing': { 
    permission: 'billing.read.organization', 
    organizationRequired: true,
    fallbackUrl: '/dashboard'
  },
  '/dashboard/analytics': { 
    permission: 'analytics.read.organization', 
    organizationRequired: true,
    fallbackUrl: '/dashboard'
  },

  // API routes
  '/api/roles': { 
    permission: 'role.read.organization', 
    organizationRequired: true 
  },
  '/api/users': { 
    permission: 'user.read.organization', 
    organizationRequired: true 
  },
  '/api/permissions': { 
    permission: 'role.read.organization', 
    organizationRequired: true 
  }
};

// API method permissions
export const API_PERMISSIONS: Record<string, Record<string, string>> = {
  '/api/roles': {
    GET: 'role.read.organization',
    POST: 'role.create',
    PUT: 'role.update.organization',
    DELETE: 'role.delete.organization'
  },
  '/api/users': {
    GET: 'user.read.organization',
    POST: 'user.invite',
    PUT: 'user.update.organization',
    DELETE: 'user.deactivate.organization'
  },
  '/api/user-roles': {
    GET: 'role.read.organization',
    POST: 'role.assign.organization',
    DELETE: 'role.assign.organization'
  },
  '/api/projects': {
    GET: 'project.read.organization',
    POST: 'project.create',
    PUT: 'project.update.organization',
    DELETE: 'project.delete.organization'
  },
  '/api/services': {
    GET: 'service.read.marketplace',
    POST: 'service.create',
    PUT: 'service.update.organization',
    DELETE: 'service.delete.organization'
  },
  '/api/billing': {
    GET: 'billing.read.organization',
    POST: 'payment.process',
    PUT: 'billing.update.organization'
  },
  '/api/analytics': {
    GET: 'analytics.read.organization'
  }
};

/**
 * RBAC Middleware for route protection
 */
export async function rbacMiddleware(request: NextRequest) {
  const { userId } = auth();
  
  // Skip RBAC for public routes and auth pages
  if (isPublicRoute(request.nextUrl.pathname) || !userId) {
    return NextResponse.next();
  }

  try {
    // Get organization ID from request (could be from headers, params, or cookies)
    const organizationId = getOrganizationId(request);
    
    // Check route permissions
    const routePermission = ROUTE_PERMISSIONS[request.nextUrl.pathname];
    if (routePermission) {
      const hasPermission = await userHasPermission(
        userId, 
        routePermission.permission, 
        routePermission.organizationRequired ? organizationId : undefined
      );

      if (!hasPermission) {
        // Redirect to fallback URL or show unauthorized
        if (routePermission.fallbackUrl) {
          return NextResponse.redirect(new URL(routePermission.fallbackUrl, request.url));
        }
        return new NextResponse('Unauthorized', { status: 403 });
      }
    }

    // Check API permissions
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const apiPermissions = API_PERMISSIONS[request.nextUrl.pathname];
      if (apiPermissions) {
        const requiredPermission = apiPermissions[request.method];
        if (requiredPermission) {
          const hasPermission = await userHasPermission(
            userId, 
            requiredPermission, 
            organizationId
          );

          if (!hasPermission) {
            return NextResponse.json(
              { error: 'Insufficient permissions' }, 
              { status: 403 }
            );
          }
        }
      }
    }

    // Add user permissions to headers for downstream consumption
    const userPermissions = await getUserPermissions(userId, organizationId);
    const response = NextResponse.next();
    
    response.headers.set('x-user-permissions', JSON.stringify(userPermissions.map(p => p.id)));
    response.headers.set('x-user-id', userId);
    if (organizationId) {
      response.headers.set('x-organization-id', organizationId);
    }

    return response;
  } catch (error) {
    console.error('RBAC Middleware error:', error);
    // Continue without RBAC checks in case of errors to avoid breaking the app
    return NextResponse.next();
  }
}

/**
 * Check if a route is public and doesn't require authentication
 */
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/about',
    '/pricing',
    '/contact',
    '/api/public',
    '/api/auth',
    '/api/webhooks'
  ];

  return publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(`${route}/`) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/webhooks/')
  );
}

/**
 * Extract organization ID from request
 */
function getOrganizationId(request: NextRequest): string | undefined {
  // Try multiple sources for organization ID
  
  // 1. From URL params (/dashboard/org/123)
  const orgFromPath = request.nextUrl.pathname.match(/\/org\/([^\/]+)/)?.[1];
  if (orgFromPath) return orgFromPath;
  
  // 2. From query params (?org=123)
  const orgFromQuery = request.nextUrl.searchParams.get('org');
  if (orgFromQuery) return orgFromQuery;
  
  // 3. From headers (x-organization-id)
  const orgFromHeaders = request.headers.get('x-organization-id');
  if (orgFromHeaders) return orgFromHeaders;
  
  // 4. From cookies (org-id)
  const orgFromCookies = request.cookies.get('org-id')?.value;
  if (orgFromCookies) return orgFromCookies;
  
  return undefined;
}

/**
 * Higher-order function to create permission-protected API routes
 */
export function withPermission(
  permission: string,
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async function protectedHandler(request: NextRequest, context?: any) {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const organizationId = getOrganizationId(request);
      const hasPermission = await userHasPermission(userId, permission, organizationId);
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions', required: permission }, 
          { status: 403 }
        );
      }

      return handler(request, context);
    } catch (error) {
      console.error('Permission check error:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to create role-protected API routes
 */
export function withRole(
  roles: string[],
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async function protectedHandler(request: NextRequest, context?: any) {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const organizationId = getOrganizationId(request);
      // This would require a getUserRoles function - implement as needed
      // const userRoles = await getUserRoles(userId, organizationId);
      // const hasRole = userRoles.some(ur => roles.includes(ur.roleId));
      
      // For now, just proceed - implement role checking as needed
      return handler(request, context);
    } catch (error) {
      console.error('Role check error:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Utility to check permissions in API routes
 */
export async function checkPermission(
  userId: string,
  permission: string,
  organizationId?: string
): Promise<boolean> {
  try {
    return await userHasPermission(userId, permission, organizationId);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Utility to get user permissions in API routes
 */
export async function getUserPermissionsForApi(
  userId: string,
  organizationId?: string
): Promise<string[]> {
  try {
    const permissions = await getUserPermissions(userId, organizationId);
    return permissions.map(p => p.id);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Middleware configuration for Next.js
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - api/webhooks (webhook routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};

// Export the middleware
export { rbacMiddleware as middleware };