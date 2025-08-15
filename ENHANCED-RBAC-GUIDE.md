# Enhanced RBAC System Guide

## Overview

The AI Marketplace now features a comprehensive Role-Based Access Control (RBAC) system with **8 specialized roles** across different organization types, providing granular permissions and enhanced security.

## Role Structure

### Freelancer
- **Role**: `freelancer`
- **Permissions**: All permissions (maximum flexibility)
- **Use Case**: Independent service providers working across the platform

### Vendor Organization Roles (5 roles)

#### 1. Vendor Admin (`vendor_admin`)
- **Default Role**: Yes (first user in vendor organization)
- **Permissions**: Complete vendor organization control
- **Capabilities**:
  - Full project management
  - Team management and invitations
  - Financial management and billing
  - Customer relationship management
  - Organization settings and analytics

#### 2. Customer Success Manager (`customer_success_manager`)
- **Focus**: Client relationship management
- **Capabilities**:
  - Customer interaction and support
  - Project visibility and coordination
  - Client communication management

#### 3. Finance Manager (`finance_manager_vendor`)
- **Focus**: Financial operations
- **Capabilities**:
  - Budget management and approvals
  - Invoice creation and billing
  - Financial reporting and analytics

#### 4. Project Lead (`project_lead_vendor`)
- **Focus**: Project coordination
- **Capabilities**:
  - Team coordination and project leadership
  - Project assignment and management
  - Customer interaction for project matters

#### 5. Project Engineer (`project_engineer`)
- **Focus**: Technical execution
- **Capabilities**:
  - Project development and execution
  - Technical task completion
  - Team collaboration

### Customer Organization Roles (3 roles)

#### 1. Customer Admin (`customer_admin`)
- **Default Role**: Yes (first user in customer organization)
- **Permissions**: Complete customer organization control
- **Capabilities**:
  - Project creation and management
  - Budget approval and financial oversight
  - Team management and invitations
  - Organization settings

#### 2. Finance Manager (`finance_manager_customer`)
- **Focus**: Budget and financial oversight
- **Capabilities**:
  - Budget approvals and financial reporting
  - Cost oversight and billing management

#### 3. Project Lead (`project_lead_customer`)
- **Focus**: Project management from customer side
- **Capabilities**:
  - Project coordination and oversight
  - Vendor communication and management

## Permissions System

### Core Permissions (18 total)

#### Personal Management
- `profile.edit` - Edit own profile and settings
- `profile.view` - View user profiles and directories

#### Project Management
- `project.create` - Create and post new projects
- `project.view` - View project details and status
- `project.edit` - Edit and update project details
- `project.assign` - Assign team members to projects
- `project.execute` - Work on and deliver project tasks
- `project.lead` - Lead and coordinate project teams

#### Financial Management
- `billing.view` - View billing and financial reports
- `billing.manage` - Manage billing, payments, and invoices
- `budget.approve` - Approve project budgets and expenses
- `invoice.create` - Create and send invoices

#### Customer Relations
- `customer.interact` - Communicate with customer organizations
- `customer.support` - Provide customer success and support
- `customer.projects` - Access customer project information

#### Team Management
- `team.invite` - Invite new team members to organization
- `team.manage` - Manage team members and their roles
- `team.view` - View team member information

#### Organization Administration
- `org.settings` - Update organization settings and preferences
- `org.admin` - Full organization administration access
- `org.analytics` - View organization analytics and reports

## Implementation Guide

### 1. Using the Enhanced Auth Hooks

```typescript
import { useAuth, useDashboardNavigation } from '@/hooks';

function MyComponent() {
  const { 
    hasPermission, 
    hasRole,
    isAdminRole,
    canManageTeam,
    canAccessFinancials,
    primaryRole,
    roleCategory
  } = useAuth();
  
  const { navigationSections, quickActions } = useDashboardNavigation();

  // Check specific permissions
  if (hasPermission('project.create')) {
    // Show create project button
  }

  // Check admin status
  if (isAdminRole()) {
    // Show admin features
  }

  // Check financial access
  if (canAccessFinancials()) {
    // Show billing section
  }
}
```

### 2. Dashboard Menu Visibility

The system automatically controls dashboard menu visibility based on user roles:

```typescript
// Navigation sections are automatically filtered by permissions
const { navigationSections } = useDashboardNavigation();

// Quick actions are role-appropriate
const { quickActions } = useDashboardNavigation();
```

### 3. Role-Based Component Rendering

```typescript
import { useMenuItemVisibility } from '@/hooks/useDashboardNavigation';

function ConditionalComponent({ requiredPermissions }) {
  const isVisible = useMenuItemVisibility(requiredPermissions);
  
  if (!isVisible) return null;
  
  return <div>Protected content</div>;
}
```

## Migration Strategy

### Automatic Migration
The system includes comprehensive migration utilities to transition from the previous 2-role system to the enhanced 5-role system.

#### Migration Mapping
- `vendor_member` → `project_engineer`
- `vendor_admin` → `vendor_admin` (unchanged)
- `customer_member` → `project_lead_customer`
- `customer_admin` → `customer_admin` (unchanged)
- `freelancer` → `freelancer` (unchanged)

### Migration API

#### Check Migration Status
```bash
GET /api/v1/admin/migrate-roles?action=status
```

#### Preview Migration Changes
```bash
GET /api/v1/admin/migrate-roles?action=preview&organizationId=org_123
```

#### Execute Full Migration
```bash
POST /api/v1/admin/migrate-roles
{
  "action": "migrate-all"
}
```

#### Migrate Single Organization
```bash
POST /api/v1/admin/migrate-roles
{
  "action": "migrate-organization",
  "organizationId": "org_123"
}
```

#### Migrate Single User
```bash
POST /api/v1/admin/migrate-roles
{
  "action": "migrate-user",
  "targetUserId": "user_123",
  "organizationId": "org_123"
}
```

## Clerk Integration

### Role Synchronization
The system maintains synchronization between Clerk organization roles and internal marketplace roles:

#### Clerk → Marketplace Mapping
- `org:admin` → `vendor_admin` / `customer_admin`
- `org:member` → `project_engineer` / `project_lead_customer`
- `org:finance_manager` → `finance_manager_vendor` / `finance_manager_customer`
- `org:project_lead` → `project_lead_vendor` / `project_lead_customer`
- `org:customer_success` → `customer_success_manager`
- `org:engineer` → `project_engineer`

### Organization Type Detection
The system automatically detects organization type based on:
1. Existing database records
2. Organization name heuristics
3. Manual configuration

## Dashboard Menu Structure

### Administrative Users
- Dashboard Overview
- Projects (Create, Manage, Templates)
- Team (Members, Invite, Roles)
- Customers (Directory, Support, Projects) - Vendor only
- Financial (Billing, Invoices, Approvals, Reports)
- Analytics (Overview, Performance, Financial)
- Settings (Profile, Organization, Security)

### Project Management Users
- Dashboard Overview
- Projects (View, Assignments)
- Team (View Members)
- Financial (View Billing) - If permitted
- Settings (Profile)

### Financial Users
- Dashboard Overview
- Projects (View)
- Financial (Full Access)
- Analytics (Financial Reports)
- Settings (Profile)

### Technical Users
- Dashboard Overview
- Projects (Execute, View)
- Team (View)
- Settings (Profile)

## Security Features

### Permission Inheritance
- Roles include appropriate permission hierarchies
- Higher-level roles inherit lower-level permissions where logical

### Cross-Organization Permissions
- Customer Success Managers can access customer project information
- Proper isolation between different customer organizations

### Audit Trail
- All role changes are logged and auditable
- Migration operations are tracked with timestamps

### JWT Optimization
- Roles and permissions are stored efficiently in JWT tokens
- Size monitoring prevents token overflow
- Graceful fallback to database when JWT unavailable

## Best Practices

### 1. Role Assignment
- First organization user automatically gets admin role
- Subsequent users get role appropriate to their function
- Regular role review and adjustment

### 2. Permission Checking
- Always use permission-based checks rather than role-based
- Implement graceful degradation when permissions unavailable
- Cache permission checks for performance

### 3. UI/UX Guidelines
- Hide rather than disable features user can't access
- Provide clear messaging about permission requirements
- Use role categories for user understanding

### 4. Migration Management
- Always preview migrations before executing
- Run migrations during low-traffic periods
- Have rollback procedures ready
- Test thoroughly in staging environment

## Troubleshooting

### Common Issues

#### 1. User Not Seeing Expected Features
- Check user's current role and permissions
- Verify JWT claims are up to date
- Check organization membership status

#### 2. Migration Problems
- Review migration logs for specific errors
- Check Clerk synchronization status
- Verify database consistency

#### 3. Permission Errors
- Validate permission strings match schema
- Check for typos in permission names
- Ensure proper fallback mechanisms

### Debug Tools

#### Check User Permissions
```typescript
import { useAuth } from '@/hooks/useAuth';

const { permissions, roles, primaryRole } = useAuth();
console.log('User permissions:', permissions);
console.log('User roles:', roles);
console.log('Primary role:', primaryRole);
```

#### Migration Status Check
```bash
curl -X GET "/api/v1/admin/migrate-roles?action=status" \
  -H "Authorization: Bearer $CLERK_TOKEN"
```

## Future Enhancements

### Planned Features
1. **Custom Roles**: Organization-specific role creation
2. **Temporary Permissions**: Time-limited access grants
3. **Role Templates**: Pre-configured role sets for common scenarios
4. **Advanced Analytics**: Role usage and permission analytics
5. **Bulk Role Management**: Administrative tools for large organizations

### Integration Opportunities
1. **Third-party SSO**: Enhanced integration with enterprise SSO providers
2. **Compliance Tools**: Automated compliance reporting and role auditing
3. **API Access Control**: Role-based API rate limiting and access

This enhanced RBAC system provides the foundation for a scalable, secure, and user-friendly multi-tenant marketplace platform.