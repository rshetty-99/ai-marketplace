# Authentication Setup Guide

## Overview
This AI Marketplace uses Clerk for authentication, providing secure user management with features like:
- Sign in/Sign up with email, Google, GitHub
- User profile management
- Role-based access control (RBAC)
- Multi-tenant support

## Setup Instructions

### 1. Create a Clerk Account
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Sign up for a free account
3. Create a new application

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

Then add your Clerk keys from the dashboard:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

### 3. Authentication Flow

#### Sign In/Sign Up
- **Location**: `/sign-in` and `/sign-up` pages
- **Modal**: Can also be triggered from header buttons
- **After Auth**: Users are redirected to `/dashboard`

#### Protected Routes
The following routes require authentication:
- `/dashboard/*` - User dashboard
- `/profile/*` - User profile management
- `/buyer/*` - Buyer-specific pages
- `/seller/*` - Seller-specific pages
- `/admin/*` - Admin panel (requires admin role)
- `/booking/*` - Booking flows
- `/settings/*` - User settings

#### Public Routes
These routes are accessible without authentication:
- `/` - Homepage
- `/services/*` - Browse services
- `/providers/*` - View providers
- `/categories/*` - Browse categories
- `/about`, `/pricing`, `/contact` - Marketing pages

### 4. User Roles & Permissions

The system supports multiple user roles:
- **Buyer**: Can browse services, book consultations, manage projects
- **Seller/Provider**: Can list services, manage bookings, view analytics
- **Admin**: Full platform access, user management, moderation
- **Super Admin**: System administration, configuration

### 5. Components

#### Header Authentication
The header includes:
- **Sign In** button for unauthenticated users
- **Get Started** button for registration
- **User Profile** dropdown for authenticated users with:
  - Dashboard link
  - Settings link
  - Profile management
  - Sign out option

#### UserButton Features
- Avatar display
- Quick access to profile
- Dashboard navigation
- Settings access
- Sign out functionality

### 6. Middleware Configuration
The `middleware.ts` file handles:
- Route protection
- Authentication checks
- Role-based access control
- Redirect logic for unauthenticated users

### 7. Dashboard Access
Once authenticated, users can access:
- **Dashboard Overview**: Project stats, recent activities
- **Projects**: Manage AI service projects
- **Bookings**: View and manage consultations
- **Analytics**: Track spending and usage
- **Settings**: Account and preference management

### 8. Customization

#### Appearance
Clerk components are styled to match the platform theme:
- Blue primary color (#3B82F6)
- Consistent with ShadCN UI components
- Responsive design for mobile/desktop

#### User Metadata
Store additional user information:
- Organization details
- User type (buyer/seller)
- Subscription tier
- Preferences

### 9. Testing Authentication

1. **Local Development**:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

2. **Test Sign Up**:
   - Click "Get Started" in header
   - Complete registration
   - Verify redirect to dashboard

3. **Test Sign In**:
   - Click "Sign In" in header
   - Enter credentials
   - Verify user profile appears

4. **Test Protected Routes**:
   - Try accessing `/dashboard` without auth
   - Should redirect to `/sign-in`
   - After sign in, should return to dashboard

### 10. Webhook Setup (Optional)

For syncing user data with Firebase:

1. In Clerk Dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/v1/auth/webhook`
3. Select events: user.created, user.updated, user.deleted
4. Copy webhook secret to `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Troubleshooting

**Issue**: Sign in/up not working
- Check environment variables are set correctly
- Verify Clerk application is active
- Check browser console for errors

**Issue**: User not redirected after auth
- Check `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` in env
- Verify middleware configuration
- Check for route conflicts

**Issue**: Protected routes accessible without auth
- Verify middleware.ts is in src/ directory
- Check middleware matcher configuration
- Ensure routes are properly defined

## Support
For more information, see:
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Auth Guide](https://clerk.com/docs/quickstarts/nextjs)