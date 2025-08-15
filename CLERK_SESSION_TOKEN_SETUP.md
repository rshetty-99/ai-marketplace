# Clerk Custom Session Token Setup Guide

This guide walks you through setting up custom session tokens in Clerk for the AI Marketplace platform, enabling efficient RBAC and user context management.

## Overview

Custom session tokens allow you to include user metadata, roles, and permissions directly in JWT tokens, providing:

- **Faster authorization checks** - No database queries needed for permissions
- **Automatic onboarding flow** - Redirect incomplete users seamlessly
- **Rich user context** - User type, organization info, feature flags in tokens
- **Efficient middleware** - Permission checks at the edge

## Prerequisites

- Clerk Pro plan (required for custom session tokens)
- Administrative access to your Clerk dashboard
- Firebase project with user data

## Step 1: Configure Session Token Template in Clerk

1. **Access Clerk Dashboard**
   - Log into your Clerk dashboard
   - Navigate to your AI Marketplace application

2. **Configure Session Token Template**
   - Go to **Sessions** → **Customize session token**
   - Select **Session token template**
   - Copy the contents of `clerk-session-token.js` into the template editor
   - Click **Save changes**

3. **Verify Template**
   - The template uses Liquid syntax to populate claims
   - Ensure all user metadata fields are mapped correctly
   - Test with a sample user to verify token structure

## Step 2: Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Clerk Configuration (already existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Session Token Configuration
CLERK_JWT_TEMPLATE_NAME=ai_marketplace_session_token
NEXT_PUBLIC_SESSION_TOKEN_ENABLED=true

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_SESSION_TOKEN_CACHE=true
NEXT_PUBLIC_SESSION_TOKEN_DEBUG=false
```

## Step 3: User Metadata Structure

Ensure your Firestore user documents include these fields for session token sync:

```javascript
// Example user document structure in Firestore
{
  id: "user_123",
  email: "user@example.com",
  name: "John Doe",
  userType: "freelancer", // freelancer | vendor_company | customer_organization
  organizationId: "org_456", // null for freelancers
  organizationName: "Acme Corp",
  organizationRole: "ORG_OWNER",
  roles: [
    {
      id: "role_1",
      name: "Verified Freelancer",
      type: "vendor",
      permissions: ["view_project", "create_project"],
      tier: "verified"
    }
  ],
  isActive: true,
  freelancerTier: "verified", // verified | premium | enterprise
  freelancerVerified: true,
  freelancerRating: 4.8,
  canInviteUsers: false,
  maxBudgetApproval: 1000,
  featureFlags: {
    "advanced_search": true,
    "ai_recommendations": false
  },
  preferences: {
    "theme": "dark",
    "notifications": true
  },
  backgroundCheckStatus: "verified",
  complianceStatus: "compliant",
  apiAccessLevel: "basic"
}
```

## Step 4: Onboarding Data Structure

Ensure your Firestore onboarding documents include:

```javascript
// Example onboarding document structure
{
  userId: "user_123",
  userType: "freelancer",
  status: "completed", // not_started | in_progress | completed | abandoned
  currentStep: 8,
  totalSteps: 8,
  completedAt: new Date(),
  onboardingScore: 95
}
```

## Step 5: Webhook Configuration

1. **Set up Webhooks in Clerk**
   - Navigate to **Webhooks** in your Clerk dashboard
   - Add webhook endpoint: `https://your-domain.com/api/v1/auth/webhook`
   - Select events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
     - `session.created`
     - `session.ended`
     - `organizationMembership.created`
     - `organizationMembership.updated`
     - `organizationMembership.deleted`

2. **Configure Webhook Secret**
   - Copy the webhook secret from Clerk
   - Add to `CLERK_WEBHOOK_SECRET` environment variable

## Step 6: Initial Data Migration

Run this script to sync existing users to session tokens:

```typescript
// scripts/sync-users-to-session-tokens.ts
import { bulkSyncUsersToSessionClaims } from '@/lib/auth/session-management';
import { getAdminDb } from '@/lib/firebase';

async function syncAllUsers() {
  const adminDb = await getAdminDb();
  const usersSnapshot = await adminDb.collection('users').get();
  const userIds = usersSnapshot.docs.map(doc => doc.id);
  
  console.log(`Starting sync for ${userIds.length} users...`);
  
  const result = await bulkSyncUsersToSessionClaims(userIds, 10);
  
  console.log(`Sync completed:`);
  console.log(`- Succeeded: ${result.succeeded.length}`);
  console.log(`- Failed: ${result.failed.length}`);
  
  if (result.failed.length > 0) {
    console.log('Failed users:', result.failed);
  }
}

syncAllUsers().catch(console.error);
```

Run the migration:

```bash
npx tsx scripts/sync-users-to-session-tokens.ts
```

## Step 7: Testing the Implementation

### Test Session Token Content

Create a test API endpoint to verify token content:

```typescript
// pages/api/test/session-token.ts
import { auth } from '@clerk/nextjs/server';
import { parseSessionToken } from '@/lib/auth/session-tokens';

export default async function handler(req: any, res: any) {
  const { userId, sessionClaims } = await auth();
  
  if (!userId || !sessionClaims) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const parsedToken = parseSessionToken(sessionClaims as any);
    return res.json({
      userId,
      rawClaims: sessionClaims,
      parsedToken
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to parse session token',
      message: error.message 
    });
  }
}
```

### Test Permission Hooks

```typescript
// Example component using session-based permissions
import { usePermissions, useOnboardingStatus } from '@/lib/rbac/hooks';

function DashboardComponent() {
  const { hasPermission, isFeatureEnabled, loading } = usePermissions();
  const { needsOnboarding, redirectPath } = useOnboardingStatus();
  
  if (loading) return <div>Loading...</div>;
  
  if (needsOnboarding) {
    // Automatically handled by middleware, but you can show custom UI
    return <div>Please complete your onboarding...</div>;
  }
  
  return (
    <div>
      {hasPermission('create_project') && (
        <button>Create Project</button>
      )}
      
      {isFeatureEnabled('advanced_search') && (
        <AdvancedSearchComponent />
      )}
    </div>
  );
}
```

### Test Middleware Redirects

1. Create a test user without completing onboarding
2. Try accessing `/dashboard` - should redirect to onboarding
3. Complete onboarding
4. Try accessing `/dashboard` - should work normally

## Step 8: Monitoring and Debugging

### Enable Debug Mode

Set environment variable for debugging:

```bash
NEXT_PUBLIC_SESSION_TOKEN_DEBUG=true
```

### Monitor Session Token Sync

Check logs for session token operations:

```bash
# Filter logs for session token events
grep "session.*claim" logs/application.log

# Monitor webhook processing
grep "webhook.*session" logs/application.log
```

### Common Issues and Solutions

1. **Session token not updating immediately**
   - Solution: Tokens update on next session refresh
   - Force refresh by signing out and back in

2. **Missing permissions in token**
   - Check user roles in Firestore
   - Verify webhook is syncing data
   - Run manual sync: `syncUserToSessionClaims(userId)`

3. **Onboarding redirects not working**
   - Verify middleware is parsing tokens correctly
   - Check onboarding status in token claims
   - Ensure protected routes are configured correctly

## Step 9: Performance Optimization

### Enable Session Token Caching

```typescript
// lib/auth/token-cache.ts
import { cache } from '@/lib/utils/cache';

export function cacheSessionToken(userId: string, token: ParsedSessionToken) {
  cache.set(`session_token:${userId}`, token, { 
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: [`user:${userId}`, 'session_tokens'] 
  });
}

export function getCachedSessionToken(userId: string): ParsedSessionToken | null {
  return cache.get(`session_token:${userId}`);
}
```

### Monitor Performance

Track session token performance metrics:

```typescript
// Monitor token parsing time
const startTime = performance.now();
const parsedToken = parseSessionToken(sessionClaims);
const parseTime = performance.now() - startTime;

logger.info('Session token parse time', { 
  userId, 
  parseTime: `${parseTime.toFixed(2)}ms` 
});
```

## Step 10: Security Considerations

### Token Validation

Always validate token data:

```typescript
import { validateOnboardingData } from '@/lib/auth/session-tokens';

function validateUserToken(token: ParsedSessionToken) {
  const validation = validateOnboardingData(token);
  
  if (!validation.isValid) {
    logger.warn('Invalid user token data', {
      userId: token.userId,
      missingFields: validation.missingFields
    });
    // Handle invalid data appropriately
  }
}
```

### Sensitive Data

Never include sensitive data in session tokens:
- ❌ Credit card information
- ❌ Bank account details
- ❌ Social security numbers
- ❌ Passwords or secrets
- ✅ User roles and permissions
- ✅ Organization membership
- ✅ Feature flags
- ✅ Public preferences

## Deployment Checklist

Before deploying to production:

- [ ] Session token template configured in Clerk dashboard
- [ ] Webhook endpoints configured and tested
- [ ] Environment variables set in production
- [ ] User data migration completed
- [ ] Permission hooks tested in components
- [ ] Middleware redirects working correctly
- [ ] Performance monitoring enabled
- [ ] Security validation implemented
- [ ] Backup/rollback plan prepared

## API Reference

### Session Management Functions

```typescript
// Initialize new user
await initializeNewUserSessionClaims(userId, userType);

// Sync user data
await syncUserToSessionClaims(userId);

// Update onboarding progress
await updateOnboardingProgress(userId, step, status);

// Update roles
await updateUserRolesInSession(userId, roles);

// Update organization membership
await updateOrganizationMembership(userId, orgId, orgName, role);

// Update feature flags
await updateUserFeatureFlags(userId, flags);
```

### Permission Hooks

```typescript
// Basic permissions
const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

// User type checks
const { isFreelancer, isVendorCompany } = useUserType();

// Onboarding status
const { needsOnboarding, isComplete } = useOnboardingStatus();

// Organization context
const { isInOrganization, isOwner } = useOrganization();

// Feature flags
const { isEnabled } = useFeatureFlags();
```

## Support

For issues related to:

- **Clerk configuration**: Check Clerk dashboard and documentation
- **Session token parsing**: Review token template and user metadata
- **Permission hooks**: Verify user roles and permissions in Firestore
- **Webhook sync**: Check webhook logs and error messages
- **Performance**: Monitor parsing times and cache hit rates

---

**Next Steps**: After completing this setup, your AI Marketplace will have efficient session-based authentication with automatic onboarding flow management and fast permission checks.