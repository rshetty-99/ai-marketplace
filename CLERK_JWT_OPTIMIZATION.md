# Clerk JWT Claims Optimization

## Problem
The original JWT claims template exceeded Clerk's 2048 character limit, causing authentication failures.

## Solution
Optimized JWT claims using shortened field names and efficient data encoding.

## Implementation Steps

### 1. Use the Minimal JWT Template

In your Clerk Dashboard → JWT Templates, create a new template with this content:

```json
{
  "uid": "{{user.id}}",
  "email": "{{user.primary_email_address.email_address}}",
  "verified": "{{user.primary_email_address.verification.status == 'verified'}}",
  "name": "{{user.first_name}} {{user.last_name}}",
  "type": "{{user.public_metadata.user_type}}",
  "onb_status": "{{user.public_metadata.onboarding_status}}",
  "onb_done": "{{user.public_metadata.onboarding_completed | default: false}}",
  "onb_step": "{{user.public_metadata.onboarding_current_step | default: 0}}",
  "roles": "{{user.public_metadata.roles | default: '[]'}}",
  "perms": "{{user.public_metadata.permissions | default: '[]'}}",
  "status": "{{user.public_metadata.user_status}}",
  "tier": "{{user.public_metadata.freelancer_tier}}",
  "fl_verified": "{{user.public_metadata.freelancer_verified | default: false}}",
  "api_lvl": "{{user.public_metadata.api_access_level}}",
  "org": {
    "id": "{{ user.organization_memberships[0].organization.id | default: user.public_metadata.organization_id | default: '' }}",
    "name": "{{ user.organization_memberships[0].organization.name | default: user.public_metadata.organization_name | default: '' }}",
    "slug": "{{ user.organization_memberships[0].organization.slug | default: '' }}",
    "role": "{{ user.organization_memberships[0].role | default: user.public_metadata.organization_role | default: '' }}"
  }
}
```

### 2. Update Your Code to Use Optimized Claims

```typescript
import { useAuth, useOrganization } from '@/hooks/useAuth';
import { OptimizedJWTClaims, expandJWTClaims } from '@/lib/auth/jwt-claims';

// Use the optimized auth hook
const { 
  userId, 
  userType, 
  hasPermission, 
  hasRole,
  needsOnboarding 
} = useAuth();

// Get organization context
const {
  organizationId,
  organizationName,
  organizationSlug,
  organizationRole,
  hasOrganization
} = useOrganization();

// Check permissions efficiently
if (hasPermission('project.create')) {
  // User can create projects
}

// Check roles
if (hasRole('admin')) {
  // User is an admin
}

// Display organization info
if (hasOrganization) {
  console.log(`User is ${organizationRole} at ${organizationName}`);
}
```

### 3. Update User Metadata Efficiently

```typescript
import { updateUserMetadata, syncRBACToMetadata } from '@/lib/auth/metadata-sync';

// Update roles and permissions
await syncRBACToMetadata(userId, ['admin', 'manager'], ['project.create', 'user.read']);

// Update onboarding progress
await updateOnboardingProgress(userId, 'completed', 6, true);

// Update freelancer status
await updateFreelancerStatus(userId, true, 'gold', 4.8);
```

### 4. Server-Side Metadata Updates

For server-side updates, use the API route:

```typescript
// In your server actions or API routes
const response = await fetch('/api/auth/update-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    updates: {
      onboarding_completed: true,
      onboarding_status: 'completed',
      roles: JSON.stringify(['customer_admin']),
      permissions: JSON.stringify(['project.create', 'billing.read'])
    }
  })
});
```

## Why Organization Context is Critical

Organization context (`org.id`, `org.name`, `org.role`) is included in JWT claims because:

1. **RBAC Authorization**: Most permissions are scoped to organizations
2. **UI Experience**: Display organization name without API calls  
3. **Multi-tenancy**: Critical for isolating data between organizations
4. **Performance**: Avoids database queries for organization info on every request

## Key Optimizations Made

### 1. Field Name Shortening
- `user_id` → `uid`
- `onboarding_status` → `onb_status`
- `onboarding_completed` → `onb_done` 
- `onboarding_current_step` → `onb_step`
- `freelancer_verified` → `fl_verified`
- `permissions` → `perms`
- `api_access_level` → `api_lvl`

### 2. Data Structure Optimization
- Store arrays as JSON strings to save space
- Remove redundant timestamps and metadata
- Combine related fields into nested objects
- Use boolean defaults instead of explicit false values

### 3. Efficient Data Access
- JWT claims provide fast, client-side access to essential data
- Fallback to user metadata when JWT claims unavailable
- Server-side API for metadata updates
- Validation to prevent JWT size violations

## Size Monitoring

The system includes size monitoring utilities:

```typescript
import { estimateJWTSize } from '@/lib/auth/jwt-claims';

const claims = getJWTClaims(auth);
const { estimatedSize, isWithinLimit, breakdown } = estimateJWTSize(claims);

console.log(`JWT size: ${estimatedSize} bytes (limit: 2048)`);
console.log('Size breakdown:', breakdown);
```

## Best Practices

### 1. Keep Roles and Permissions Minimal
- Use role hierarchy instead of individual permissions
- Store only active roles in JWT
- Load detailed permissions from database when needed

### 2. Optimize Metadata Updates
- Batch multiple updates into single API call
- Validate metadata size before updating
- Use server-side updates for sensitive data

### 3. Monitor JWT Size
- Set up alerts for JWT size approaching limit
- Regular audits of metadata growth
- Remove unused metadata fields

### 4. Graceful Degradation
- Always provide fallbacks when JWT claims unavailable
- Handle JWT parsing errors gracefully
- Cache frequently accessed data client-side

## Troubleshooting

### JWT Size Exceeded
1. Check current size: Use `estimateJWTSize()` utility
2. Identify large fields: Review size breakdown
3. Optimize data: Convert arrays to strings, shorten field names
4. Move non-essential data: Store in database instead of JWT

### Missing Claims
1. Verify JWT template is active in Clerk Dashboard
2. Check metadata field names match template
3. Ensure user has required metadata fields populated
4. Test with fresh login to get updated claims

### Permission Issues
1. Verify roles and permissions are properly synced
2. Check organization context is correct
3. Ensure JWT claims are being parsed correctly
4. Fallback to database checks if needed

## Migration Guide

To migrate from the original JWT template:

1. **Deploy optimized auth hooks** first
2. **Update JWT template** in Clerk Dashboard
3. **Test thoroughly** with existing users
4. **Monitor JWT sizes** for a few days
5. **Update any hardcoded field references**

The auth hooks provide backward compatibility during migration.