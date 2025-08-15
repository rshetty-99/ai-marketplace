# Simplified RBAC System Documentation

## Overview

The AI Marketplace uses a **simplified Role-Based Access Control (RBAC)** system designed for practical marketplace scenarios. This system prioritizes **clarity and ease-of-use** over complex enterprise features.

## 🎯 Design Principles

- **Simple & Clear**: Roles are self-explanatory
- **Marketplace-Focused**: Designed for freelancer/vendor/customer workflows  
- **Minimal Complexity**: Only essential permissions and roles
- **Easy Maintenance**: Fewer moving parts = fewer bugs

## 📋 Core Permissions (8 Total)

| Permission | Description | Who Typically Has It |
|------------|-------------|---------------------|
| `profile.edit` | Edit own profile and settings | Everyone |
| `billing.manage` | Manage billing, payments, and invoices | Admins, Freelancers |
| `projects.create` | Create and post new projects | Admins |
| `projects.manage` | Manage and update existing projects | Everyone |
| `team.invite` | Invite new team members | Admins only |
| `team.manage` | Manage team members and their access | Admins only |
| `org.settings` | Update organization settings and preferences | Admins only |
| `org.admin` | Full organization administration access | Admins only |

### Permission Groups

**Personal** (Everyone gets these):
- `profile.edit` - Manage your own account
- `billing.manage` - Handle your own payments (freelancers) or org billing (admins)

**Projects** (Work-related):
- `projects.create` - Start new projects (customers/vendors)
- `projects.manage` - Work on assigned projects

**Team** (Admin-only):
- `team.invite` - Add new people to organization
- `team.manage` - Manage team member roles and access

**Organization** (Admin-only):
- `org.settings` - Change organization settings
- `org.admin` - Full administrative control

## 👥 Role Structure

### Freelancers (1 Role)
```typescript
freelancer: {
  permissions: ['profile.edit', 'projects.manage', 'billing.manage']
  description: 'Independent service provider'
}
```
- **Simple**: Just one role for all freelancers
- **Self-sufficient**: Can manage their own work and billing

### Vendors (2 Roles)
```typescript
vendor_member: {
  permissions: ['profile.edit', 'projects.manage']
  description: 'Team member with basic access'
}

vendor_admin: {
  permissions: [
    'profile.edit', 'projects.create', 'projects.manage', 
    'team.invite', 'team.manage', 'billing.manage', 
    'org.settings', 'org.admin'
  ]
  description: 'Full vendor organization control'
}
```

### Customers (2 Roles)
```typescript
customer_member: {
  permissions: ['profile.edit', 'projects.manage']
  description: 'Team member with project collaboration access'
}

customer_admin: {
  permissions: [
    'profile.edit', 'projects.create', 'projects.manage',
    'team.invite', 'team.manage', 'billing.manage',
    'org.settings', 'org.admin'
  ]
  description: 'Full customer organization control'
}
```

## 🛠 Implementation Guide

### 1. Check User Permissions

```typescript
import { useRBAC } from '@/hooks/useRBAC';

function MyComponent() {
  const { hasPermission, isAdmin, canInvite } = useRBAC();
  
  return (
    <div>
      {hasPermission('projects.create') && (
        <Button>Create New Project</Button>
      )}
      
      {isAdmin && (
        <AdminPanel />
      )}
      
      {canInvite && (
        <InviteUserButton />
      )}
    </div>
  );
}
```

### 2. Use Permission Guards

```typescript
import { PermissionGuard, AdminGuard } from '@/hooks/useRBAC';

// Show content only if user has permission
<PermissionGuard 
  permission="team.manage" 
  fallback={<p>Access denied</p>}
>
  <TeamManagementPanel />
</PermissionGuard>

// Show content only to admins
<AdminGuard fallback={<p>Admins only</p>}>
  <AdminSettings />
</AdminGuard>
```

### 3. Assign Roles

```typescript
import { useRoleManagement } from '@/hooks/useRBAC';

function TeamManagement() {
  const { assignRole, removeRole, members } = useRoleManagement(organizationId);
  
  const makeAdmin = async (userId: string) => {
    await assignRole(userId, 'vendor_admin'); // or 'customer_admin'
  };
  
  const demoteUser = async (userId: string) => {
    await assignRole(userId, 'vendor_member'); // or 'customer_member'
  };
}
```

### 4. Role-Based Firestore Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can read their own role
    match /user_roles/{roleId} {
      allow read: if request.auth.uid == resource.data.userId;
    }
    
    // Admins can manage organization roles
    match /user_roles/{roleId} {
      allow read, write: if isOrgAdmin(request.auth.uid, resource.data.organizationId);
    }
    
    // Helper function
    function isOrgAdmin(userId, orgId) {
      return exists(/databases/$(database)/documents/user_roles/$(userId)) 
        && get(/databases/$(database)/documents/user_roles/$(userId)).data.role in ['vendor_admin', 'customer_admin']
        && get(/databases/$(database)/documents/user_roles/$(userId)).data.organizationId == orgId;
    }
  }
}
```

## 🔍 Common Use Cases

### User Onboarding
1. User signs up → Gets default role based on user type
2. First user in organization → Automatically becomes admin
3. Subsequent users → Start as members, can be promoted by admins

### Team Management
1. **Admin invites user** → `team.invite` permission required
2. **Admin changes roles** → `team.manage` permission required  
3. **User leaves** → Admin deactivates their role

### Project Workflows
1. **Customer creates project** → `projects.create` permission required
2. **Team members work on project** → `projects.manage` permission required
3. **Freelancer manages own projects** → Built into freelancer role

### Billing & Payments
1. **Freelancers handle own billing** → `billing.manage` included in role
2. **Organization admins manage company billing** → `billing.manage` permission
3. **Members can't access billing** → No permission granted

## 🎨 UI Components

### Role Management Component
```typescript
import { SimpleRoleManagement } from '@/components/rbac/simple-role-management';

<SimpleRoleManagement 
  organizationId="org_123"
  userType="vendor" // or "customer"
/>
```

Features:
- ✅ View team members and their roles
- ✅ Invite new users with specific roles  
- ✅ Change user roles (admin only)
- ✅ Remove users from organization
- ✅ Role descriptions and permission explanations

## 🔧 Database Schema

### User Roles Collection (`user_roles`)
```typescript
{
  id: string;              // Firestore document ID
  userId: string;          // Clerk user ID  
  role: RoleName;          // 'freelancer', 'vendor_admin', etc.
  organizationId?: string; // For vendor/customer orgs
  assignedBy: string;      // Who assigned this role
  assignedAt: Date;        // When role was assigned
  isActive: boolean;       // Role status
}
```

### Audit Logs Collection (`rbac_audit_logs`)
```typescript
{
  id: string;
  userId: string;          // Who performed the action
  targetUserId?: string;   // Who was affected
  action: 'role_assigned' | 'role_changed' | 'user_invited' | 'org_updated';
  resource: string;
  resourceId: string;
  organizationId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}
```

## ⚠️ Security Considerations

### Server-Side Validation
Always validate permissions server-side:

```typescript
// API route example
export async function POST(request: Request) {
  const { userId } = auth();
  
  // Check if user has required permission
  const hasPermission = await userHasPermission(userId, 'projects.create');
  if (!hasPermission) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Proceed with action
}
```

### Firestore Security Rules
```javascript
// Never trust client-side permission checks
match /projects/{projectId} {
  allow create: if hasPermission(request.auth.uid, 'projects.create');
  allow read, update: if hasPermission(request.auth.uid, 'projects.manage')
    || resource.data.createdBy == request.auth.uid;
}
```

## 🚀 Migration from Complex System

If migrating from the complex RBAC system:

1. **Map existing roles** to new simplified structure
2. **Update permission checks** to use new permission names
3. **Migrate database collections** to new schema
4. **Update UI components** to use simplified management
5. **Test thoroughly** with existing users

### Migration Script Example
```typescript
async function migrateRoles() {
  const oldRoles = await getOldRoles();
  
  for (const oldRole of oldRoles) {
    const newRole = mapToNewRole(oldRole);
    await assignUserRole(oldRole.userId, newRole, 'system', oldRole.organizationId);
  }
}

function mapToNewRole(oldRole: OldRole): RoleName {
  if (oldRole.name.includes('Owner') || oldRole.name.includes('Admin')) {
    return oldRole.userType === 'vendor' ? 'vendor_admin' : 'customer_admin';
  }
  return oldRole.userType === 'vendor' ? 'vendor_member' : 'customer_member';
}
```

## 📊 Comparison: Before vs After

| Aspect | Complex System | Simplified System |
|--------|----------------|-------------------|
| **Permissions** | 60+ permissions | 8 core permissions |
| **Roles per user type** | 4-5 roles | 1-2 roles |
| **Database collections** | 5 collections | 2 collections |
| **Lines of code** | ~2000 lines | ~1000 lines |
| **Setup time** | 2-3 days | 2-3 hours |
| **User confusion** | High | Very low |
| **Maintenance** | Complex | Simple |

## 🎯 Best Practices

### DO:
✅ Use the simplified permission guards in UI  
✅ Always validate permissions server-side  
✅ Keep role descriptions user-friendly  
✅ Log important permission changes  
✅ Use the default roles for most users  

### DON'T:
❌ Create custom roles unless absolutely necessary  
❌ Give users more permissions than they need  
❌ Rely only on client-side permission checks  
❌ Make role names confusing  
❌ Skip audit logging for sensitive actions  

## 🔍 Troubleshooting

### Common Issues

**User can't access feature:**
1. Check if user has required permission
2. Verify user's role is active (`isActive: true`)
3. Confirm organizationId matches if applicable

**Permission check failing:**
1. Verify permission name is correct (check `CORE_PERMISSIONS`)
2. Ensure user has the role that includes that permission
3. Check if user is in the correct organization context

**Role assignment not working:**
1. Confirm assigner has `team.manage` or `org.admin` permission
2. Verify target role exists for the user type
3. Check organization context is correct

### Debug Utilities

```typescript
// Debug user permissions
import { getUserPermissions, getUserRole } from '@/lib/firebase/rbac-firestore';

const debugUser = async (userId: string, orgId?: string) => {
  const role = await getUserRole(userId, orgId);
  const permissions = await getUserPermissions(userId, orgId);
  
  console.log('User Role:', role);
  console.log('User Permissions:', permissions);
};
```

## 📞 Support

For questions or issues with the RBAC system:
1. Check this documentation first
2. Review the simplified schema in `rbac-schema.ts`
3. Look at the example component `simple-role-management.tsx`
4. Check audit logs for permission-related actions

The simplified RBAC system is designed to be **intuitive and self-documenting**. Most questions should be answered by looking at the role definitions and permission mappings!