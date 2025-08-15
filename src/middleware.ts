import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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

  // Check admin permissions for admin routes -- commented by rshetty 8/14.
  // if (isAdminRoute(req)) {
  //   const userRole = sessionClaims?.metadata?.role as string | undefined
  //   if (userRole !== 'admin' && userRole !== 'super_admin') {
  //     return NextResponse.redirect(new URL('/dashboard', req.url))
  //   }
  // }

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