// Simplified RBAC Schema for AI Marketplace
// Practical, marketplace-focused role-based access control

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userType: 'freelancer' | 'vendor' | 'customer';
  organizationId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  role: string;
  organizationId?: string;
  assignedBy: string;
  assignedAt: Date;
  isActive: boolean;
}

// Enhanced marketplace permissions (granular role-based system)
export const CORE_PERMISSIONS = {
  // Profile & Account Management
  'profile.edit': 'Edit own profile and settings',
  'profile.view': 'View user profiles and directories',
  
  // Project Management - Technical
  'project.create': 'Create and post new projects',
  'project.view': 'View project details and status',
  'project.edit': 'Edit and update project details',
  'project.assign': 'Assign team members to projects',
  'project.execute': 'Work on and deliver project tasks',
  'project.lead': 'Lead and coordinate project teams',
  
  // Financial Management
  'billing.view': 'View billing and financial reports',
  'billing.manage': 'Manage billing, payments, and invoices',
  'budget.approve': 'Approve project budgets and expenses',
  'invoice.create': 'Create and send invoices',
  
  // Customer Relations
  'customer.interact': 'Communicate with customer organizations',
  'customer.support': 'Provide customer success and support',
  'customer.projects': 'Access customer project information',
  
  // Team Management
  'team.invite': 'Invite new team members to organization',
  'team.manage': 'Manage team members and their roles',
  'team.view': 'View team member information',
  
  // Organization Administration
  'org.settings': 'Update organization settings and preferences',
  'org.admin': 'Full organization administration access',
  'org.analytics': 'View organization analytics and reports'
} as const;

export type Permission = keyof typeof CORE_PERMISSIONS;

// Enhanced role definitions with specialized permissions
export const MARKETPLACE_ROLES = {
  // Freelancer role (all permissions for maximum flexibility)
  freelancer: {
    name: 'Freelancer',
    description: 'Independent service provider with full access',
    permissions: Object.keys(CORE_PERMISSIONS) as Permission[],
    userType: 'freelancer' as const,
    isDefault: true
  },
  
  // Enhanced Vendor roles (5 specialized roles)
  vendor_admin: {
    name: 'Vendor Admin',
    description: 'Full vendor organization control and administration',
    permissions: [
      'profile.edit', 'profile.view',
      'project.create', 'project.view', 'project.edit', 'project.assign', 'project.lead',
      'billing.view', 'billing.manage', 'budget.approve', 'invoice.create',
      'customer.interact', 'customer.support', 'customer.projects',
      'team.invite', 'team.manage', 'team.view',
      'org.settings', 'org.admin', 'org.analytics'
    ],
    userType: 'vendor' as const,
    isDefault: true
  },
  customer_success_manager: {
    name: 'Customer Success Manager',
    description: 'Manages client relationships and ensures project success',
    permissions: [
      'profile.edit', 'profile.view',
      'project.view', 'project.edit',
      'billing.view',
      'customer.interact', 'customer.support', 'customer.projects',
      'team.view'
    ],
    userType: 'vendor' as const
  },
  finance_manager_vendor: {
    name: 'Finance Manager',
    description: 'Manages financial operations, budgets, and billing',
    permissions: [
      'profile.edit',
      'project.view',
      'billing.view', 'billing.manage', 'budget.approve', 'invoice.create',
      'org.analytics'
    ],
    userType: 'vendor' as const
  },
  project_engineer: {
    name: 'Project Engineer',
    description: 'Technical execution and development of projects',
    permissions: [
      'profile.edit', 'profile.view',
      'project.view', 'project.execute',
      'team.view'
    ],
    userType: 'vendor' as const
  },
  project_lead_vendor: {
    name: 'Project Lead',
    description: 'Leads project teams and coordinates delivery',
    permissions: [
      'profile.edit', 'profile.view',
      'project.view', 'project.edit', 'project.assign', 'project.lead', 'project.execute',
      'customer.interact',
      'team.view'
    ],
    userType: 'vendor' as const
  },
  
  // Enhanced Customer roles (3 specialized roles)
  customer_admin: {
    name: 'Customer Admin',
    description: 'Full customer organization control and project oversight',
    permissions: [
      'profile.edit', 'profile.view',
      'project.create', 'project.view', 'project.edit', 'project.assign',
      'billing.view', 'billing.manage', 'budget.approve',
      'team.invite', 'team.manage', 'team.view',
      'org.settings', 'org.admin', 'org.analytics'
    ],
    userType: 'customer' as const,
    isDefault: true
  },
  finance_manager_customer: {
    name: 'Finance Manager',
    description: 'Manages budgets, approvals, and financial oversight',
    permissions: [
      'profile.edit',
      'project.view',
      'billing.view', 'billing.manage', 'budget.approve',
      'org.analytics'
    ],
    userType: 'customer' as const
  },
  project_lead_customer: {
    name: 'Project Lead',
    description: 'Manages projects from customer perspective',
    permissions: [
      'profile.edit', 'profile.view',
      'project.view', 'project.edit', 'project.assign',
      'billing.view',
      'team.view'
    ],
    userType: 'customer' as const
  }
} as const;

export type RoleName = keyof typeof MARKETPLACE_ROLES;

// Helper functions
export const getUserTypeRoles = (userType: 'freelancer' | 'vendor' | 'customer'): RoleName[] => {
  switch (userType) {
    case 'freelancer':
      return ['freelancer'];
    case 'vendor':
      return ['vendor_admin', 'customer_success_manager', 'finance_manager_vendor', 'project_engineer', 'project_lead_vendor'];
    case 'customer':
      return ['customer_admin', 'finance_manager_customer', 'project_lead_customer'];
  }
};

// Get available roles for organization type
export const getAvailableRoles = (orgType: 'vendor' | 'customer'): RoleName[] => {
  return getUserTypeRoles(orgType);
};

export const getRolePermissions = (roleName: RoleName): Permission[] => {
  return MARKETPLACE_ROLES[roleName].permissions as Permission[];
};

export const hasPermission = (userRole: RoleName, permission: Permission): boolean => {
  const rolePermissions = getRolePermissions(userRole);
  return rolePermissions.includes(permission);
};

export const canInviteUsers = (roleName: RoleName): boolean => {
  return hasPermission(roleName, 'team.invite');
};

export const canManageOrganization = (roleName: RoleName): boolean => {
  return hasPermission(roleName, 'org.admin');
};

export const isAdmin = (roleName: RoleName): boolean => {
  return roleName.includes('admin');
};

// Default role assignment for new users
export const getDefaultRole = (userType: 'freelancer' | 'vendor' | 'customer', isFirstOrgUser: boolean = true): RoleName => {
  switch (userType) {
    case 'freelancer':
      return 'freelancer';
    case 'vendor':
      return isFirstOrgUser ? 'vendor_admin' : 'project_engineer'; // First user becomes admin, subsequent users start as engineers
    case 'customer':
      return isFirstOrgUser ? 'customer_admin' : 'project_lead_customer'; // First user becomes admin, subsequent users start as project leads
  }
};

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY = {
  vendor_admin: ['customer_success_manager', 'finance_manager_vendor', 'project_lead_vendor', 'project_engineer'],
  project_lead_vendor: ['project_engineer'],
  customer_admin: ['finance_manager_customer', 'project_lead_customer'],
} as const;

// Check if role inherits from another role
export const inheritsFrom = (childRole: RoleName, parentRole: RoleName): boolean => {
  const hierarchy = ROLE_HIERARCHY[parentRole as keyof typeof ROLE_HIERARCHY];
  return hierarchy ? hierarchy.includes(childRole as any) : false;
};

// Role upgrade/downgrade logic
export const canChangeRole = (actorRole: RoleName, targetUserCurrentRole: RoleName, targetRole: RoleName): boolean => {
  const actorRoleData = MARKETPLACE_ROLES[actorRole];
  const targetRoleData = MARKETPLACE_ROLES[targetRole];
  
  // Can only change roles within same user type
  if (actorRoleData.userType !== targetRoleData.userType) return false;
  
  // Only admins can change roles
  return isAdmin(actorRole);
};

// Simple permission descriptions for UI
export const PERMISSION_DESCRIPTIONS = CORE_PERMISSIONS;

// User-friendly role descriptions
export const ROLE_DESCRIPTIONS = {
  freelancer: 'Work independently with full access to all marketplace features',
  vendor_admin: 'Complete control over vendor organization, team, projects, and client relationships',
  customer_success_manager: 'Build and maintain strong client relationships, ensure project success',
  finance_manager_vendor: 'Manage budgets, billing, financial reporting, and budget approvals',
  project_engineer: 'Execute technical work, develop solutions, and deliver project components',
  project_lead_vendor: 'Lead project teams, coordinate delivery, and manage technical execution',
  customer_admin: 'Full control over customer organization, projects, budgets, and team',
  finance_manager_customer: 'Manage budgets, approve expenses, and oversee financial aspects',
  project_lead_customer: 'Manage projects from customer side, coordinate with vendors'
} as const;

// Permission groupings for UI display
export const PERMISSION_GROUPS = {
  'Personal': ['profile.edit', 'profile.view'],
  'Projects': ['project.create', 'project.view', 'project.edit', 'project.assign', 'project.execute', 'project.lead'],
  'Financial': ['billing.view', 'billing.manage', 'budget.approve', 'invoice.create'],
  'Customer Relations': ['customer.interact', 'customer.support', 'customer.projects'],
  'Team': ['team.invite', 'team.manage', 'team.view'],
  'Organization': ['org.settings', 'org.admin', 'org.analytics']
} as const;

// Role categories for dashboard menu organization
export const ROLE_CATEGORIES = {
  'Administrative': ['vendor_admin', 'customer_admin'],
  'Financial': ['finance_manager_vendor', 'finance_manager_customer'],
  'Project Management': ['project_lead_vendor', 'project_lead_customer'],
  'Technical': ['project_engineer'],
  'Customer Success': ['customer_success_manager'],
  'Independent': ['freelancer']
} as const;

// Dashboard menu sections based on permissions
export const getDashboardMenuSections = (permissions: Permission[]): string[] => {
  const sections: string[] = ['dashboard']; // Always show dashboard
  
  if (permissions.includes('project.view') || permissions.includes('project.create')) {
    sections.push('projects');
  }
  if (permissions.includes('team.view') || permissions.includes('team.manage')) {
    sections.push('team');
  }
  if (permissions.includes('billing.view') || permissions.includes('billing.manage')) {
    sections.push('billing');
  }
  if (permissions.includes('customer.interact') || permissions.includes('customer.support')) {
    sections.push('customers');
  }
  if (permissions.includes('org.analytics')) {
    sections.push('analytics');
  }
  if (permissions.includes('org.settings') || permissions.includes('org.admin')) {
    sections.push('settings');
  }
  
  return sections;
};