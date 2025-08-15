import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { 
  parseSessionToken, 
  needsOnboarding, 
  getOnboardingRedirectPath,
  isUserActive,
  type ParsedSessionToken 
} from '@/lib/auth/session-tokens'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about',
  '/pricing',
  '/contact',
  '/legal/(.*)',
  '/services(.*)',
  '/providers(.*)',
  '/categories(.*)',
  '/search(.*)',
  '/api/webhooks/(.*)',
])

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/buyer(.*)',
  '/seller(.*)',
  '/admin(.*)',
  '/booking(.*)',
  '/settings(.*)',
  '/profile(.*)',
])

// Define admin-only routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/v1/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Redirect to sign-in if accessing protected route without authentication
  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Parse session token for additional user context
  let parsedToken: ParsedSessionToken | null = null
  if (userId && sessionClaims) {
    try {
      parsedToken = parseSessionToken(sessionClaims as any)
    } catch (error) {
      console.warn('Failed to parse session token:', error)
    }
  }

  // Check if user account is active
  if (parsedToken && !isUserActive(parsedToken)) {
    const inactiveUrl = new URL('/account-suspended', req.url)
    return NextResponse.redirect(inactiveUrl)
  }

  // Handle onboarding flow for authenticated users
  if (parsedToken && isProtectedRoute(req) && !req.nextUrl.pathname.startsWith('/onboarding')) {
    if (needsOnboarding(parsedToken)) {
      const onboardingUrl = new URL(getOnboardingRedirectPath(parsedToken), req.url)
      return NextResponse.redirect(onboardingUrl)
    }
  }

  // Skip onboarding redirect if user is already on onboarding pages
  if (parsedToken && req.nextUrl.pathname.startsWith('/onboarding') && !needsOnboarding(parsedToken)) {
    const dashboardUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Check admin permissions for admin routes
  if (isAdminRoute(req) && parsedToken) {
    const hasAdminAccess = parsedToken.permissions.includes('platform_admin' as any) ||
                          parsedToken.roles.some(role => 
                            role.name.toLowerCase().includes('admin') || 
                            role.name.toLowerCase().includes('super_admin')
                          )
    
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Add session token data to request headers for API routes
  if (parsedToken && req.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set('x-user-type', parsedToken.userType || '')
    response.headers.set('x-organization-id', parsedToken.organizationId || '')
    response.headers.set('x-onboarding-status', parsedToken.onboardingStatus)
    response.headers.set('x-user-permissions', JSON.stringify(parsedToken.permissions))
    response.headers.set('x-user-roles', JSON.stringify(parsedToken.roles.map(r => r.name)))
    return response
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}