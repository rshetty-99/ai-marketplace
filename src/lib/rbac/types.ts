export interface User {
  id: string;
  email: string;
  name: string;
  organizationId?: string;
  roles: Role[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  permissions: Permission[];
  organizationId?: string;
  tier?: FreelancerTier;
}

export enum RoleType {
  PLATFORM = 'platform',
  CUSTOMER_ORG = 'customer_org',
  VENDOR = 'vendor',
}

export enum FreelancerTier {
  VERIFIED = 'verified',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum Permission {
  CREATE_PROJECT = 'create_project',
  EDIT_PROJECT = 'edit_project',
  DELETE_PROJECT = 'delete_project',
  VIEW_PROJECT = 'view_project',
  MANAGE_TEAM = 'manage_team',
  MANAGE_BILLING = 'manage_billing',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_ORGANIZATION = 'manage_organization',
  ACCESS_AI_CONDUCTOR = 'access_ai_conductor',
  ADVANCED_MATCHING = 'advanced_matching',
  BULK_OPERATIONS = 'bulk_operations',
  WHITE_LABEL_ACCESS = 'white_label_access',
  CUSTOM_INTEGRATIONS = 'custom_integrations',
  PRIORITY_SUPPORT = 'priority_support',
  PLATFORM_ADMIN = 'platform_admin',
  CONTENT_MODERATION = 'content_moderation',
  SYSTEM_MONITORING = 'system_monitoring',
  USER_MANAGEMENT = 'user_management',
}

export const PLATFORM_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    permissions: [
      Permission.PLATFORM_ADMIN,
      Permission.USER_MANAGEMENT,
      Permission.SYSTEM_MONITORING,
      Permission.CONTENT_MODERATION,
    ],
  },
  OPERATIONS_MANAGER: {
    name: 'Operations Manager',
    permissions: [
      Permission.CONTENT_MODERATION,
      Permission.USER_MANAGEMENT,
      Permission.VIEW_ANALYTICS,
    ],
  },
  SUPPORT_SPECIALIST: {
    name: 'Support Specialist',
    permissions: [
      Permission.VIEW_PROJECT,
      Permission.PRIORITY_SUPPORT,
    ],
  },
} as const;

export const CUSTOMER_ORG_ROLES = {
  ORG_OWNER: {
    name: 'Organization Owner',
    permissions: [
      Permission.MANAGE_ORGANIZATION,
      Permission.MANAGE_TEAM,
      Permission.MANAGE_BILLING,
      Permission.CREATE_PROJECT,
      Permission.EDIT_PROJECT,
      Permission.DELETE_PROJECT,
      Permission.VIEW_PROJECT,
      Permission.VIEW_ANALYTICS,
      Permission.ACCESS_AI_CONDUCTOR,
      Permission.ADVANCED_MATCHING,
      Permission.BULK_OPERATIONS,
      Permission.WHITE_LABEL_ACCESS,
      Permission.CUSTOM_INTEGRATIONS,
    ],
  },
  PROJECT_MANAGER: {
    name: 'Project Manager',
    permissions: [
      Permission.CREATE_PROJECT,
      Permission.EDIT_PROJECT,
      Permission.VIEW_PROJECT,
      Permission.ACCESS_AI_CONDUCTOR,
      Permission.ADVANCED_MATCHING,
    ],
  },
  TEAM_MEMBER: {
    name: 'Team Member',
    permissions: [
      Permission.VIEW_PROJECT,
      Permission.CREATE_PROJECT,
    ],
  },
  VIEWER: {
    name: 'Viewer',
    permissions: [
      Permission.VIEW_PROJECT,
      Permission.VIEW_ANALYTICS,
    ],
  },
} as const;

export const VENDOR_ROLES = {
  ENTERPRISE_FREELANCER: {
    name: 'Enterprise Freelancer',
    tier: FreelancerTier.ENTERPRISE,
    permissions: [
      Permission.VIEW_PROJECT,
      Permission.PRIORITY_SUPPORT,
      Permission.ADVANCED_MATCHING,
      Permission.WHITE_LABEL_ACCESS,
    ],
  },
  PREMIUM_FREELANCER: {
    name: 'Premium Freelancer',
    tier: FreelancerTier.PREMIUM,
    permissions: [
      Permission.VIEW_PROJECT,
      Permission.PRIORITY_SUPPORT,
      Permission.ADVANCED_MATCHING,
    ],
  },
  VERIFIED_FREELANCER: {
    name: 'Verified Freelancer',
    tier: FreelancerTier.VERIFIED,
    permissions: [
      Permission.VIEW_PROJECT,
    ],
  },
} as const;