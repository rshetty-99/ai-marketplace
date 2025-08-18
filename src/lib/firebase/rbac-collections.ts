/**
 * Enhanced RBAC Firestore Collections Schema
 * Dynamic role and permission management with Firestore reference collections
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  enableNetwork,
  disableNetwork 
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for server-side scripts
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'aiproally'
};

// Initialize Firebase app if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// Firestore Collection Interfaces
export interface RoleDocument {
  id: string;
  name: string;
  displayName: string;
  description: string;
  userType: 'platform' | 'freelancer' | 'vendor' | 'customer';
  category: string;
  permissions: string[]; // Permission IDs
  tier?: 'verified' | 'premium' | 'enterprise';
  isDefault: boolean;
  hierarchyLevel: number; // For role hierarchy (higher = more permissions)
  parentRoles?: string[]; // Roles this inherits from
  childRoles?: string[]; // Roles that inherit from this
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata: {
    dashboardSections: string[];
    uiTheme?: string;
    maxProjects?: number;
    maxTeamMembers?: number;
    features: string[];
  };
}

export interface PermissionDocument {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  group: string; // For UI grouping
  resource: string; // What resource this permission applies to
  action: string; // What action is allowed
  conditions?: {
    selfOnly?: boolean;
    organizationOnly?: boolean;
    customLogic?: string;
  };
  isCore: boolean; // Core permissions that can't be deleted
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    riskLevel: 'low' | 'medium' | 'high';
    uiIcon?: string;
    uiColor?: string;
  };
}

export interface RoleCategoryDocument {
  id: string;
  name: string;
  displayName: string;
  description: string;
  userTypes: string[];
  order: number;
  isActive: boolean;
}

export interface PermissionGroupDocument {
  id: string;
  name: string;
  displayName: string;
  description: string;
  order: number;
  icon: string;
  color: string;
  isActive: boolean;
}

// Enhanced Permissions with all the gaps filled
export const ENHANCED_PERMISSIONS = {
  // === PERSONAL & PROFILE ===
  'profile.view': {
    displayName: 'View Profiles',
    description: 'View user profiles and public information',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'read',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'User' }
  },
  'profile.edit': {
    displayName: 'Edit Profile',
    description: 'Edit own profile and settings',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'write',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Edit' }
  },
  'profile.manage': {
    displayName: 'Manage Profiles',
    description: 'Manage other users\' profiles',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'admin',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'UserCog' }
  },

  // === PROJECT MANAGEMENT ===
  'project.view': {
    displayName: 'View Projects',
    description: 'View project details and status',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'read',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Eye' }
  },
  'project.create': {
    displayName: 'Create Projects',
    description: 'Create and post new projects',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'create',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Plus' }
  },
  'project.edit': {
    displayName: 'Edit Projects',
    description: 'Edit and update project details',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'write',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Edit' }
  },
  'project.delete': {
    displayName: 'Delete Projects',
    description: 'Delete projects and associated data',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'delete',
    isCore: true,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Trash' }
  },
  'project.assign': {
    displayName: 'Assign Team Members',
    description: 'Assign team members to projects',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'assign',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'UserPlus' }
  },
  'project.execute': {
    displayName: 'Execute Projects',
    description: 'Work on and deliver project tasks',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'execute',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Play' }
  },
  'project.lead': {
    displayName: 'Lead Projects',
    description: 'Lead and coordinate project teams',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'lead',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Crown' }
  },
  'project.archive': {
    displayName: 'Archive Projects',
    description: 'Archive completed or cancelled projects',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'archive',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Archive' }
  },
  'project.clone': {
    displayName: 'Clone Projects',
    description: 'Create copies of existing projects',
    category: 'projects',
    group: 'projects',
    resource: 'project',
    action: 'clone',
    isCore: false,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Copy' }
  },
  'milestone.manage': {
    displayName: 'Manage Milestones',
    description: 'Create and manage project milestones',
    category: 'projects',
    group: 'milestones',
    resource: 'milestone',
    action: 'manage',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Flag' }
  },
  'resource.optimize': {
    displayName: 'Optimize Resources',
    description: 'Optimize resource allocation across projects',
    category: 'projects',
    group: 'resources',
    resource: 'resource',
    action: 'optimize',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Zap' }
  },

  // === FINANCIAL MANAGEMENT ===
  'billing.view': {
    displayName: 'View Billing',
    description: 'View billing and financial reports',
    category: 'financial',
    group: 'billing',
    resource: 'billing',
    action: 'read',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Eye' }
  },
  'billing.manage': {
    displayName: 'Manage Billing',
    description: 'Manage billing, payments, and invoices',
    category: 'financial',
    group: 'billing',
    resource: 'billing',
    action: 'manage',
    isCore: true,
    metadata: { riskLevel: 'high' as const, uiIcon: 'DollarSign' }
  },
  'budget.approve': {
    displayName: 'Approve Budgets',
    description: 'Approve project budgets and expenses',
    category: 'financial',
    group: 'budget',
    resource: 'budget',
    action: 'approve',
    isCore: true,
    metadata: { riskLevel: 'high' as const, uiIcon: 'CheckCircle' }
  },
  'invoice.create': {
    displayName: 'Create Invoices',
    description: 'Create and send invoices',
    category: 'financial',
    group: 'invoicing',
    resource: 'invoice',
    action: 'create',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'FileText' }
  },
  'expense.manage': {
    displayName: 'Manage Expenses',
    description: 'Track and manage business expenses',
    category: 'financial',
    group: 'expenses',
    resource: 'expense',
    action: 'manage',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Receipt' }
  },
  'payroll.manage': {
    displayName: 'Manage Payroll',
    description: 'Process payroll and employee payments',
    category: 'financial',
    group: 'payroll',
    resource: 'payroll',
    action: 'manage',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Users' }
  },

  // === CUSTOMER RELATIONS ===
  'customer.interact': {
    displayName: 'Interact with Customers',
    description: 'Communicate with customer organizations',
    category: 'customer',
    group: 'relations',
    resource: 'customer',
    action: 'interact',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'MessageSquare' }
  },
  'customer.support': {
    displayName: 'Customer Support',
    description: 'Provide customer success and support',
    category: 'customer',
    group: 'support',
    resource: 'customer',
    action: 'support',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'HeartHandshake' }
  },
  'customer.projects': {
    displayName: 'Access Customer Projects',
    description: 'Access customer project information',
    category: 'customer',
    group: 'projects',
    resource: 'customer',
    action: 'access_projects',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'FolderOpen' }
  },

  // === TEAM MANAGEMENT ===
  'team.view': {
    displayName: 'View Team',
    description: 'View team member information',
    category: 'team',
    group: 'members',
    resource: 'team',
    action: 'read',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Users' }
  },
  'team.invite': {
    displayName: 'Invite Team Members',
    description: 'Invite new team members to organization',
    category: 'team',
    group: 'members',
    resource: 'team',
    action: 'invite',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'UserPlus' }
  },
  'team.manage': {
    displayName: 'Manage Team',
    description: 'Manage team members and their roles',
    category: 'team',
    group: 'members',
    resource: 'team',
    action: 'manage',
    isCore: true,
    metadata: { riskLevel: 'high' as const, uiIcon: 'UserCog' }
  },
  'team.performance': {
    displayName: 'Track Team Performance',
    description: 'View and analyze team performance metrics',
    category: 'team',
    group: 'performance',
    resource: 'team',
    action: 'track_performance',
    isCore: false,
    metadata: { riskLevel: 'low' as const, uiIcon: 'TrendingUp' }
  },

  // === ORGANIZATION MANAGEMENT ===
  'org.settings': {
    displayName: 'Organization Settings',
    description: 'Update organization settings and preferences',
    category: 'organization',
    group: 'settings',
    resource: 'organization',
    action: 'configure',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Settings' }
  },
  'org.admin': {
    displayName: 'Organization Admin',
    description: 'Full organization administration access',
    category: 'organization',
    group: 'admin',
    resource: 'organization',
    action: 'admin',
    isCore: true,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Shield' }
  },
  'org.analytics': {
    displayName: 'Organization Analytics',
    description: 'View organization analytics and reports',
    category: 'organization',
    group: 'analytics',
    resource: 'organization',
    action: 'view_analytics',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'BarChart3' }
  },

  // === SECURITY & COMPLIANCE (NEW) ===
  'security.audit': {
    displayName: 'Security Audit',
    description: 'Perform security audits and reviews',
    category: 'security',
    group: 'audit',
    resource: 'security',
    action: 'audit',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Shield' }
  },
  'compliance.manage': {
    displayName: 'Manage Compliance',
    description: 'Manage compliance requirements and certifications',
    category: 'security',
    group: 'compliance',
    resource: 'compliance',
    action: 'manage',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'CheckSquare' }
  },
  'data.export': {
    displayName: 'Export Data',
    description: 'Export sensitive data and reports',
    category: 'security',
    group: 'data',
    resource: 'data',
    action: 'export',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Download' }
  },
  'privacy.manage': {
    displayName: 'Manage Privacy',
    description: 'Manage privacy settings and data protection',
    category: 'security',
    group: 'privacy',
    resource: 'privacy',
    action: 'manage',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Lock' }
  },

  // === SALES & MARKETING (NEW) ===
  'leads.manage': {
    displayName: 'Manage Leads',
    description: 'Manage sales leads and prospects',
    category: 'sales',
    group: 'leads',
    resource: 'lead',
    action: 'manage',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Target' }
  },
  'marketing.campaigns': {
    displayName: 'Marketing Campaigns',
    description: 'Create and manage marketing campaigns',
    category: 'marketing',
    group: 'campaigns',
    resource: 'campaign',
    action: 'manage',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Megaphone' }
  },
  'sales.pipeline': {
    displayName: 'Sales Pipeline',
    description: 'Manage sales pipeline and opportunities',
    category: 'sales',
    group: 'pipeline',
    resource: 'sales',
    action: 'manage_pipeline',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'GitBranch' }
  },
  'proposals.template': {
    displayName: 'Proposal Templates',
    description: 'Create and manage proposal templates',
    category: 'sales',
    group: 'proposals',
    resource: 'proposal',
    action: 'template',
    isCore: false,
    metadata: { riskLevel: 'low' as const, uiIcon: 'FileText' }
  },

  // === ADVANCED ANALYTICS (NEW) ===
  'analytics.export': {
    displayName: 'Export Analytics',
    description: 'Export analytics data and reports',
    category: 'analytics',
    group: 'export',
    resource: 'analytics',
    action: 'export',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Download' }
  },
  'reports.schedule': {
    displayName: 'Schedule Reports',
    description: 'Schedule automated report generation',
    category: 'analytics',
    group: 'reports',
    resource: 'report',
    action: 'schedule',
    isCore: false,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Calendar' }
  },
  'dashboard.customize': {
    displayName: 'Customize Dashboard',
    description: 'Customize dashboard layouts and widgets',
    category: 'analytics',
    group: 'dashboard',
    resource: 'dashboard',
    action: 'customize',
    isCore: false,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Layout' }
  },
  'metrics.define': {
    displayName: 'Define Metrics',
    description: 'Define custom metrics and KPIs',
    category: 'analytics',
    group: 'metrics',
    resource: 'metric',
    action: 'define',
    isCore: false,
    metadata: { riskLevel: 'low' as const, uiIcon: 'BarChart' }
  },

  // === SERVICE CATALOG MANAGEMENT (NEW) ===
  'catalog.view': {
    displayName: 'View Catalog',
    description: 'View service catalog items',
    category: 'catalog',
    group: 'services',
    resource: 'catalog',
    action: 'read',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Package' }
  },
  'catalog.create': {
    displayName: 'Create Catalog Items',
    description: 'Create new service catalog items',
    category: 'catalog',
    group: 'services',
    resource: 'catalog',
    action: 'create',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Plus' }
  },
  'catalog.edit': {
    displayName: 'Edit Catalog Items',
    description: 'Edit existing service catalog items',
    category: 'catalog',
    group: 'services',
    resource: 'catalog',
    action: 'write',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Edit' }
  },
  'catalog.publish': {
    displayName: 'Publish Catalog Items',
    description: 'Publish catalog items to marketplace',
    category: 'catalog',
    group: 'services',
    resource: 'catalog',
    action: 'publish',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Globe' }
  },
  'catalog.moderate': {
    displayName: 'Moderate Catalog',
    description: 'Review and moderate catalog submissions',
    category: 'catalog',
    group: 'moderation',
    resource: 'catalog',
    action: 'moderate',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Shield' }
  },

  // === PLATFORM ADMIN (ENHANCED) ===
  'platform.admin': {
    displayName: 'Platform Admin',
    description: 'Full platform administration access',
    category: 'platform',
    group: 'admin',
    resource: 'platform',
    action: 'admin',
    isCore: true,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Crown' }
  },
  'platform.monitor': {
    displayName: 'Platform Monitoring',
    description: 'Monitor platform health and performance',
    category: 'platform',
    group: 'monitoring',
    resource: 'platform',
    action: 'monitor',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Activity' }
  },
  'content.moderate': {
    displayName: 'Content Moderation',
    description: 'Moderate user content and submissions',
    category: 'platform',
    group: 'moderation',
    resource: 'content',
    action: 'moderate',
    isCore: true,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Shield' }
  },
  'user.manage': {
    displayName: 'User Management',
    description: 'Manage platform users and accounts',
    category: 'platform',
    group: 'users',
    resource: 'user',
    action: 'manage',
    isCore: true,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Users' }
  },
  'dispute.resolve': {
    displayName: 'Resolve Disputes',
    description: 'Mediate and resolve user disputes',
    category: 'platform',
    group: 'mediation',
    resource: 'dispute',
    action: 'resolve',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Scale' }
  },
  'technology.analyze': {
    displayName: 'Technology Analysis',
    description: 'Analyze platform technology and performance',
    category: 'platform',
    group: 'technology',
    resource: 'technology',
    action: 'analyze',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Cpu' }
  },
  'finance.platform': {
    displayName: 'Platform Finance',
    description: 'Manage platform financial operations',
    category: 'platform',
    group: 'finance',
    resource: 'platform_finance',
    action: 'manage',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'DollarSign' }
  }
} as const;

// Collection manipulation functions
export class RBACCollectionManager {
  static async initializeCollections(): Promise<void> {
    console.log('🚀 Initializing RBAC collections...');
    
    try {
      await Promise.all([
        this.initializePermissions(),
        this.initializePermissionGroups(),
        this.initializeRoleCategories(),
        this.initializeRoles()
      ]);
      
      console.log('✅ RBAC collections initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RBAC collections:', error);
      throw error;
    }
  }

  private static async initializePermissions(): Promise<void> {
    const permissionsRef = collection(db, 'rbac_permissions');
    
    for (const [id, permission] of Object.entries(ENHANCED_PERMISSIONS)) {
      const docData: PermissionDocument = {
        id,
        name: id,
        displayName: permission.displayName,
        description: permission.description,
        category: permission.category,
        group: permission.group,
        resource: permission.resource,
        action: permission.action,
        isCore: permission.isCore,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: permission.metadata
      };
      
      await setDoc(doc(permissionsRef, id), docData);
    }
  }

  private static async initializePermissionGroups(): Promise<void> {
    const groupsRef = collection(db, 'rbac_permission_groups');
    
    const groups = [
      { id: 'profile', displayName: 'Personal & Profile', description: 'Profile and personal settings management', order: 1, icon: 'User', color: '#3B82F6' },
      { id: 'projects', displayName: 'Project Management', description: 'Project lifecycle and task management', order: 2, icon: 'Briefcase', color: '#10B981' },
      { id: 'milestones', displayName: 'Milestones', description: 'Project milestone tracking', order: 3, icon: 'Flag', color: '#F59E0B' },
      { id: 'resources', displayName: 'Resource Management', description: 'Resource allocation and optimization', order: 4, icon: 'Zap', color: '#8B5CF6' },
      { id: 'billing', displayName: 'Billing & Payments', description: 'Financial transactions and billing', order: 5, icon: 'DollarSign', color: '#EF4444' },
      { id: 'budget', displayName: 'Budget Management', description: 'Budget planning and approval', order: 6, icon: 'PieChart', color: '#F97316' },
      { id: 'invoicing', displayName: 'Invoicing', description: 'Invoice creation and management', order: 7, icon: 'FileText', color: '#06B6D4' },
      { id: 'expenses', displayName: 'Expense Management', description: 'Business expense tracking', order: 8, icon: 'Receipt', color: '#84CC16' },
      { id: 'payroll', displayName: 'Payroll', description: 'Employee payroll processing', order: 9, icon: 'Users', color: '#EC4899' },
      { id: 'relations', displayName: 'Customer Relations', description: 'Customer relationship management', order: 10, icon: 'HeartHandshake', color: '#14B8A6' },
      { id: 'support', displayName: 'Customer Support', description: 'Customer success and support', order: 11, icon: 'HelpCircle', color: '#6366F1' },
      { id: 'members', displayName: 'Team Members', description: 'Team member management', order: 12, icon: 'Users', color: '#8B5CF6' },
      { id: 'performance', displayName: 'Performance', description: 'Performance tracking and analytics', order: 13, icon: 'TrendingUp', color: '#10B981' },
      { id: 'settings', displayName: 'Organization Settings', description: 'Organization configuration', order: 14, icon: 'Settings', color: '#6B7280' },
      { id: 'admin', displayName: 'Administration', description: 'Administrative functions', order: 15, icon: 'Shield', color: '#DC2626' },
      { id: 'analytics', displayName: 'Analytics', description: 'Data analytics and reporting', order: 16, icon: 'BarChart3', color: '#0891B2' },
      { id: 'security', displayName: 'Security & Compliance', description: 'Security and compliance management', order: 17, icon: 'Lock', color: '#DC2626' },
      { id: 'sales', displayName: 'Sales Management', description: 'Sales pipeline and lead management', order: 18, icon: 'Target', color: '#059669' },
      { id: 'marketing', displayName: 'Marketing', description: 'Marketing campaigns and promotion', order: 19, icon: 'Megaphone', color: '#7C3AED' },
      { id: 'catalog', displayName: 'Service Catalog', description: 'Service catalog management', order: 20, icon: 'Package', color: '#2563EB' },
      { id: 'platform', displayName: 'Platform Management', description: 'Platform-level administration', order: 21, icon: 'Crown', color: '#DC2626' }
    ];

    for (const group of groups) {
      const docData: PermissionGroupDocument = {
        ...group,
        isActive: true
      };
      await setDoc(doc(groupsRef, group.id), docData);
    }
  }

  private static async initializeRoleCategories(): Promise<void> {
    const categoriesRef = collection(db, 'rbac_role_categories');
    
    const categories = [
      { id: 'platform_admin', displayName: 'Platform Administration', description: 'Platform-level administrative roles', userTypes: ['platform'], order: 1 },
      { id: 'platform_ops', displayName: 'Platform Operations', description: 'Platform operational roles', userTypes: ['platform'], order: 2 },
      { id: 'platform_support', displayName: 'Platform Support', description: 'Platform support and mediation roles', userTypes: ['platform'], order: 3 },
      { id: 'freelancer', displayName: 'Independent Providers', description: 'Freelancer and independent contractor roles', userTypes: ['freelancer'], order: 4 },
      { id: 'vendor_admin', displayName: 'Vendor Administration', description: 'Vendor organization administrative roles', userTypes: ['vendor'], order: 5 },
      { id: 'vendor_ops', displayName: 'Vendor Operations', description: 'Vendor operational and execution roles', userTypes: ['vendor'], order: 6 },
      { id: 'vendor_specialist', displayName: 'Vendor Specialists', description: 'Specialized vendor roles', userTypes: ['vendor'], order: 7 },
      { id: 'customer_admin', displayName: 'Customer Administration', description: 'Customer organization administrative roles', userTypes: ['customer'], order: 8 },
      { id: 'customer_ops', displayName: 'Customer Operations', description: 'Customer operational roles', userTypes: ['customer'], order: 9 }
    ];

    for (const category of categories) {
      const docData: RoleCategoryDocument = {
        ...category,
        isActive: true
      };
      await setDoc(doc(categoriesRef, category.id), docData);
    }
  }

  private static async initializeRoles(): Promise<void> {
    const { ENHANCED_ROLES } = await import('./rbac-roles');
    const rolesRef = collection(db, 'rbac_roles');
    
    for (const [roleId, roleData] of Object.entries(ENHANCED_ROLES)) {
      const docData: RoleDocument = {
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system-init'
      };
      
      await setDoc(doc(rolesRef, roleId), docData);
    }
    
    console.log(`✅ Initialized ${Object.keys(ENHANCED_ROLES).length} enhanced roles in Firestore`);
  }

  // Utility functions for fetching data
  static async getPermissions(): Promise<PermissionDocument[]> {
    const permissionsRef = collection(db, 'rbac_permissions');
    const q = query(permissionsRef, where('isActive', '==', true), orderBy('category'), orderBy('group'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PermissionDocument);
  }

  static async getRoles(userType?: string): Promise<RoleDocument[]> {
    const rolesRef = collection(db, 'rbac_roles');
    let q = query(rolesRef, where('isActive', '==', true));
    
    if (userType) {
      q = query(rolesRef, where('isActive', '==', true), where('userType', '==', userType));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as RoleDocument);
  }

  static async getPermissionGroups(): Promise<PermissionGroupDocument[]> {
    const groupsRef = collection(db, 'rbac_permission_groups');
    const q = query(groupsRef, where('isActive', '==', true), orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PermissionGroupDocument);
  }

  static async getRoleCategories(): Promise<RoleCategoryDocument[]> {
    const categoriesRef = collection(db, 'rbac_role_categories');
    const q = query(categoriesRef, where('isActive', '==', true), orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as RoleCategoryDocument);
  }
}

// Export types for use in other files
export type PermissionId = keyof typeof ENHANCED_PERMISSIONS;