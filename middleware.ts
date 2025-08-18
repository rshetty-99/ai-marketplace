/**
 * Next.js Middleware
 * Handles authentication, redirects, and slug resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@clerk/nextjs';
import { handleSlugRedirect } from '@/middleware/slug-redirects';

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/providers/(.*)',
    '/vendors/(.*)', 
    '/organizations/(.*)',
    '/api/webhooks/(.*)',
    '/api/public/(.*)',
    '/sitemap.xml',
    '/robots.txt'
  ],
  
  // Routes that require authentication
  ignoredRoutes: [
    '/api/webhooks/(.*)',
    '/api/public/(.*)'
  ],

  async beforeAuth(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    
    // Handle slug redirects for profile pages
    if (pathname.startsWith('/providers/') || 
        pathname.startsWith('/vendors/') || 
        pathname.startsWith('/organizations/')) {
      
      const redirectResponse = await handleSlugRedirect(request, pathname);
      if (redirectResponse) {
        return redirectResponse;
      }
    }

    return NextResponse.next();
  },

  async afterAuth(auth, request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    
    // Redirect authenticated users away from auth pages
    if (auth.userId && (pathname === '/sign-in' || pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect unauthenticated users to sign-in for protected routes
    if (!auth.userId && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};