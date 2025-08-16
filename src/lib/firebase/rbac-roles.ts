/**
 * Enhanced RBAC Roles with All Gaps Filled
 * Comprehensive role definitions for the AI Marketplace platform
 */

import { RoleDocument } from './rbac-collections';

export const ENHANCED_ROLES: Record<string, Omit<RoleDocument, 'createdAt' | 'updatedAt' | 'createdBy'>> = {
  
  // ========================================
  // PLATFORM ROLES (Enhanced with new roles)
  // ========================================

  // Platform Administration
  platform_super_admin: {
    id: 'platform_super_admin',
    name: 'platform_super_admin',
    displayName: 'Super Admin',
    description: 'Ultimate platform control with access to all features and data',
    userType: 'platform',
    category: 'platform_admin',
    permissions: [
      'platform.admin', 'platform.monitor', 'content.moderate', 'user.manage',
      'dispute.resolve', 'technology.analyze', 'finance.platform',
      'security.audit', 'compliance.manage', 'data.export', 'privacy.manage',
      'catalog.moderate', 'analytics.export', 'reports.schedule'
    ],
    isDefault: false,
    hierarchyLevel: 100,
    parentRoles: [],
    childRoles: ['platform_operations_manager', 'platform_finance_manager', 'platform_technology_analyst'],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'users', 'organizations', 'platform', 'analytics', 'security', 'settings'],
      uiTheme: 'admin-red',
      features: ['full_platform_access', 'system_configuration', 'user_impersonation', 'data_export']
    }
  },

  platform_operations_manager: {
    id: 'platform_operations_manager',
    name: 'platform_operations_manager',
    displayName: 'Operations Manager',
    description: 'Manages daily platform operations, content moderation, and user support',
    userType: 'platform',
    category: 'platform_ops',
    permissions: [
      'content.moderate', 'user.manage', 'dispute.resolve',
      'platform.monitor', 'catalog.moderate', 
      'customer.support', 'team.view', 'org.analytics'
    ],
    isDefault: false,
    hierarchyLevel: 85,
    parentRoles: ['platform_super_admin'],
    childRoles: ['platform_support_specialist', 'platform_mediator'],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'users', 'content', 'disputes', 'analytics'],
      uiTheme: 'admin-blue',
      features: ['content_moderation', 'user_management', 'dispute_resolution']
    }
  },

  platform_finance_manager: {
    id: 'platform_finance_manager',
    name: 'platform_finance_manager',
    displayName: 'Finance Manager',
    description: 'Manages platform financial operations, revenue, and financial reporting',
    userType: 'platform',
    category: 'platform_ops',
    permissions: [
      'finance.platform', 'billing.view', 'billing.manage', 'budget.approve',
      'analytics.export', 'reports.schedule', 'org.analytics',
      'expense.manage', 'payroll.manage'
    ],
    isDefault: false,
    hierarchyLevel: 80,
    parentRoles: ['platform_super_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'finance', 'billing', 'analytics', 'reports'],
      uiTheme: 'admin-green',
      features: ['financial_oversight', 'revenue_analytics', 'payment_processing']
    }
  },

  platform_technology_analyst: {
    id: 'platform_technology_analyst',
    name: 'platform_technology_analyst',
    displayName: 'Technology Analyst',
    description: 'Analyzes platform performance, technology stack, and system optimization',
    userType: 'platform',
    category: 'platform_ops',
    permissions: [
      'technology.analyze', 'platform.monitor', 'analytics.export',
      'reports.schedule', 'metrics.define', 'dashboard.customize',
      'security.audit'
    ],
    isDefault: false,
    hierarchyLevel: 75,
    parentRoles: ['platform_super_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'technology', 'analytics', 'monitoring', 'reports'],
      uiTheme: 'admin-purple',
      features: ['system_analytics', 'performance_monitoring', 'tech_insights']
    }
  },

  platform_mediator: {
    id: 'platform_mediator',
    name: 'platform_mediator',
    displayName: 'Mediator',
    description: 'Specializes in dispute resolution and conflict mediation between users',
    userType: 'platform',
    category: 'platform_support',
    permissions: [
      'dispute.resolve', 'customer.support', 'customer.interact',
      'project.view', 'billing.view', 'user.manage'
    ],
    isDefault: false,
    hierarchyLevel: 70,
    parentRoles: ['platform_operations_manager'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'disputes', 'mediation', 'support'],
      uiTheme: 'admin-orange',
      features: ['dispute_resolution', 'mediation_tools', 'user_communication']
    }
  },

  platform_support_specialist: {
    id: 'platform_support_specialist',
    name: 'platform_support_specialist',
    displayName: 'Support Specialist',
    description: 'Provides customer support and technical assistance to platform users',
    userType: 'platform',
    category: 'platform_support',
    permissions: [
      'customer.support', 'customer.interact', 'project.view',
      'team.view', 'billing.view'
    ],
    isDefault: false,
    hierarchyLevel: 65,
    parentRoles: ['platform_operations_manager'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'support', 'users', 'tickets'],
      uiTheme: 'admin-teal',
      features: ['customer_support', 'ticket_management', 'user_assistance']
    }
  },

  // ========================================
  // FREELANCER ROLES (Enhanced)
  // ========================================

  freelancer: {
    id: 'freelancer',
    name: 'freelancer',
    displayName: 'Freelancer',
    description: 'Independent service provider with comprehensive marketplace access',
    userType: 'freelancer',
    category: 'freelancer',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.create', 'project.edit', 'project.execute',
      'billing.view', 'billing.manage', 'invoice.create',
      'customer.interact', 'customer.support',
      'catalog.view', 'catalog.create', 'catalog.edit', 'catalog.publish',
      'analytics.export', 'dashboard.customize'
    ],
    isDefault: true,
    hierarchyLevel: 50,
    parentRoles: [],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'projects', 'earnings', 'profile', 'catalog', 'messages'],
      features: ['independent_work', 'service_creation', 'client_interaction', 'earnings_tracking']
    }
  },

  // ========================================
  // VENDOR ROLES (Enhanced with new roles)
  // ========================================

  vendor_admin: {
    id: 'vendor_admin',
    name: 'vendor_admin',
    displayName: 'Vendor Admin',
    description: 'Complete vendor organization control and strategic oversight',
    userType: 'vendor',
    category: 'vendor_admin',
    permissions: [
      'profile.view', 'profile.edit', 'profile.manage',
      'project.view', 'project.create', 'project.edit', 'project.assign', 'project.lead', 'project.delete',
      'project.archive', 'project.clone', 'milestone.manage', 'resource.optimize',
      'billing.view', 'billing.manage', 'budget.approve', 'invoice.create', 'expense.manage', 'payroll.manage',
      'customer.interact', 'customer.support', 'customer.projects',
      'team.view', 'team.invite', 'team.manage', 'team.performance',
      'org.settings', 'org.admin', 'org.analytics',
      'catalog.view', 'catalog.create', 'catalog.edit', 'catalog.publish',
      'sales.pipeline', 'leads.manage', 'proposals.template',
      'analytics.export', 'reports.schedule', 'dashboard.customize', 'metrics.define',
      'security.audit', 'compliance.manage'
    ],
    isDefault: true,
    hierarchyLevel: 90,
    parentRoles: [],
    childRoles: ['vendor_project_manager', 'vendor_finance_manager', 'vendor_sales_manager', 'vendor_quality_manager'],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'organization', 'team', 'projects', 'clients', 'finance', 'analytics', 'settings'],
      features: ['full_org_control', 'team_management', 'financial_oversight', 'strategic_planning']
    }
  },

  vendor_project_manager: {
    id: 'vendor_project_manager',
    name: 'vendor_project_manager',
    displayName: 'Project Manager',
    description: 'Manages project portfolios and coordinates delivery teams',
    userType: 'vendor',
    category: 'vendor_ops',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.create', 'project.edit', 'project.assign', 'project.lead',
      'project.archive', 'milestone.manage', 'resource.optimize',
      'billing.view', 'budget.approve',
      'customer.interact', 'customer.projects',
      'team.view', 'team.performance',
      'catalog.view', 'catalog.edit'
    ],
    isDefault: false,
    hierarchyLevel: 75,
    parentRoles: ['vendor_admin'],
    childRoles: ['vendor_project_lead', 'vendor_project_engineer'],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'projects', 'team', 'clients', 'resources'],
      features: ['project_management', 'team_coordination', 'resource_planning']
    }
  },

  vendor_finance_manager: {
    id: 'vendor_finance_manager',
    name: 'vendor_finance_manager',
    displayName: 'Finance Manager',
    description: 'Oversees financial operations, budgets, and business profitability',
    userType: 'vendor',
    category: 'vendor_specialist',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view',
      'billing.view', 'billing.manage', 'budget.approve', 'invoice.create', 'expense.manage', 'payroll.manage',
      'org.analytics', 'analytics.export', 'reports.schedule'
    ],
    isDefault: false,
    hierarchyLevel: 80,
    parentRoles: ['vendor_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'finance', 'billing', 'analytics', 'reports'],
      features: ['financial_management', 'budget_control', 'profitability_analysis']
    }
  },

  vendor_sales_manager: {
    id: 'vendor_sales_manager',
    name: 'vendor_sales_manager',
    displayName: 'Sales Manager',
    description: 'Drives business development, manages sales pipeline, and client acquisition',
    userType: 'vendor',
    category: 'vendor_specialist',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.create',
      'billing.view',
      'customer.interact', 'customer.support', 'customer.projects',
      'leads.manage', 'sales.pipeline', 'proposals.template',
      'marketing.campaigns',
      'analytics.export'
    ],
    isDefault: false,
    hierarchyLevel: 70,
    parentRoles: ['vendor_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'sales', 'leads', 'clients', 'marketing'],
      features: ['sales_management', 'lead_generation', 'client_acquisition']
    }
  },

  vendor_quality_manager: {
    id: 'vendor_quality_manager',
    name: 'vendor_quality_manager',
    displayName: 'Quality Assurance Manager',
    description: 'Ensures project quality, standards compliance, and delivery excellence',
    userType: 'vendor',
    category: 'vendor_specialist',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.edit', 'milestone.manage',
      'billing.view',
      'customer.interact',
      'team.view', 'team.performance',
      'compliance.manage', 'security.audit'
    ],
    isDefault: false,
    hierarchyLevel: 65,
    parentRoles: ['vendor_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'quality', 'projects', 'compliance', 'reports'],
      features: ['quality_assurance', 'compliance_tracking', 'standards_management']
    }
  },

  vendor_customer_success_manager: {
    id: 'vendor_customer_success_manager',
    name: 'vendor_customer_success_manager',
    displayName: 'Customer Success Manager',
    description: 'Ensures client satisfaction and manages ongoing customer relationships',
    userType: 'vendor',
    category: 'vendor_ops',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.edit',
      'billing.view',
      'customer.interact', 'customer.support', 'customer.projects',
      'team.view'
    ],
    isDefault: false,
    hierarchyLevel: 60,
    parentRoles: ['vendor_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'customers', 'projects', 'support'],
      features: ['customer_success', 'relationship_management', 'satisfaction_tracking']
    }
  },

  vendor_project_lead: {
    id: 'vendor_project_lead',
    name: 'vendor_project_lead',
    displayName: 'Project Lead',
    description: 'Leads specific project teams and coordinates technical delivery',
    userType: 'vendor',
    category: 'vendor_ops',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.edit', 'project.assign', 'project.lead', 'project.execute',
      'milestone.manage',
      'customer.interact',
      'team.view'
    ],
    isDefault: false,
    hierarchyLevel: 55,
    parentRoles: ['vendor_project_manager'],
    childRoles: ['vendor_project_engineer'],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'projects', 'team', 'tasks'],
      features: ['project_leadership', 'team_coordination', 'delivery_management']
    }
  },

  vendor_project_engineer: {
    id: 'vendor_project_engineer',
    name: 'vendor_project_engineer',
    displayName: 'Project Engineer',
    description: 'Executes technical work and delivers project components',
    userType: 'vendor',
    category: 'vendor_ops',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.execute',
      'team.view'
    ],
    isDefault: true, // Default for subsequent vendor users
    hierarchyLevel: 45,
    parentRoles: ['vendor_project_lead', 'vendor_project_manager'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'projects', 'tasks', 'time'],
      features: ['technical_execution', 'task_management', 'time_tracking']
    }
  },

  vendor_data_analyst: {
    id: 'vendor_data_analyst',
    name: 'vendor_data_analyst',
    displayName: 'Data Analyst',
    description: 'Analyzes business data, creates reports, and provides insights',
    userType: 'vendor',
    category: 'vendor_specialist',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view',
      'billing.view',
      'org.analytics', 'analytics.export', 'reports.schedule', 'metrics.define', 'dashboard.customize'
    ],
    isDefault: false,
    hierarchyLevel: 50,
    parentRoles: ['vendor_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'analytics', 'reports', 'insights'],
      features: ['data_analysis', 'report_generation', 'business_intelligence']
    }
  },

  // ========================================
  // CUSTOMER ROLES (Enhanced with new roles)
  // ========================================

  customer_admin: {
    id: 'customer_admin',
    name: 'customer_admin',
    displayName: 'Customer Admin',
    description: 'Complete customer organization control and strategic project oversight',
    userType: 'customer',
    category: 'customer_admin',
    permissions: [
      'profile.view', 'profile.edit', 'profile.manage',
      'project.view', 'project.create', 'project.edit', 'project.assign', 'project.delete',
      'project.archive', 'project.clone', 'milestone.manage',
      'billing.view', 'billing.manage', 'budget.approve',
      'team.view', 'team.invite', 'team.manage',
      'org.settings', 'org.admin', 'org.analytics',
      'catalog.view',
      'analytics.export', 'reports.schedule', 'dashboard.customize'
    ],
    isDefault: true,
    hierarchyLevel: 85,
    parentRoles: [],
    childRoles: ['customer_project_manager', 'customer_finance_manager', 'customer_procurement_manager'],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'projects', 'providers', 'team', 'billing', 'analytics', 'settings'],
      features: ['full_org_control', 'project_oversight', 'vendor_management', 'budget_control']
    }
  },

  customer_project_manager: {
    id: 'customer_project_manager',
    name: 'customer_project_manager',
    displayName: 'Project Manager',
    description: 'Manages projects from customer perspective and coordinates with vendors',
    userType: 'customer',
    category: 'customer_ops',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.create', 'project.edit', 'project.assign',
      'milestone.manage',
      'billing.view', 'budget.approve',
      'team.view',
      'catalog.view'
    ],
    isDefault: false,
    hierarchyLevel: 70,
    parentRoles: ['customer_admin'],
    childRoles: ['customer_project_lead'],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'projects', 'providers', 'milestones'],
      features: ['project_management', 'vendor_coordination', 'milestone_tracking']
    }
  },

  customer_finance_manager: {
    id: 'customer_finance_manager',
    name: 'customer_finance_manager',
    displayName: 'Finance Manager',
    description: 'Manages budgets, approvals, and financial oversight of projects',
    userType: 'customer',
    category: 'customer_ops',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view',
      'billing.view', 'billing.manage', 'budget.approve',
      'org.analytics', 'analytics.export', 'reports.schedule'
    ],
    isDefault: false,
    hierarchyLevel: 75,
    parentRoles: ['customer_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'finance', 'billing', 'budgets', 'analytics'],
      features: ['financial_oversight', 'budget_management', 'cost_control']
    }
  },

  customer_procurement_manager: {
    id: 'customer_procurement_manager',
    name: 'customer_procurement_manager',
    displayName: 'Procurement Manager',
    description: 'Manages vendor selection, contracts, and procurement processes',
    userType: 'customer',
    category: 'customer_ops',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.create',
      'billing.view', 'budget.approve',
      'catalog.view',
      'leads.manage', 'proposals.template'
    ],
    isDefault: false,
    hierarchyLevel: 65,
    parentRoles: ['customer_admin'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'procurement', 'vendors', 'contracts'],
      features: ['vendor_selection', 'contract_management', 'procurement_process']
    }
  },

  customer_project_lead: {
    id: 'customer_project_lead',
    name: 'customer_project_lead',
    displayName: 'Project Lead',
    description: 'Leads specific projects and coordinates with assigned vendors',
    userType: 'customer',
    category: 'customer_ops',
    permissions: [
      'profile.view', 'profile.edit',
      'project.view', 'project.edit', 'project.assign',
      'billing.view',
      'team.view'
    ],
    isDefault: true, // Default for subsequent customer users
    hierarchyLevel: 60,
    parentRoles: ['customer_project_manager'],
    childRoles: [],
    isActive: true,
    metadata: {
      dashboardSections: ['dashboard', 'projects', 'team', 'providers'],
      features: ['project_coordination', 'vendor_communication', 'delivery_tracking']
    }
  }
};

// Role hierarchy mapping for inheritance
export const ROLE_HIERARCHY = {
  // Platform hierarchy
  platform_super_admin: ['platform_operations_manager', 'platform_finance_manager', 'platform_technology_analyst'],
  platform_operations_manager: ['platform_support_specialist', 'platform_mediator'],
  
  // Vendor hierarchy
  vendor_admin: ['vendor_project_manager', 'vendor_finance_manager', 'vendor_sales_manager', 'vendor_quality_manager', 'vendor_customer_success_manager', 'vendor_data_analyst'],
  vendor_project_manager: ['vendor_project_lead', 'vendor_project_engineer'],
  vendor_project_lead: ['vendor_project_engineer'],
  
  // Customer hierarchy
  customer_admin: ['customer_project_manager', 'customer_finance_manager', 'customer_procurement_manager'],
  customer_project_manager: ['customer_project_lead']
} as const;

// Default role assignment logic
export const getDefaultRole = (
  userType: 'platform' | 'freelancer' | 'vendor' | 'customer',
  isFirstOrgUser: boolean = true
): string => {
  switch (userType) {
    case 'platform':
      return 'platform_support_specialist'; // Most common platform role
    case 'freelancer':
      return 'freelancer';
    case 'vendor':
      return isFirstOrgUser ? 'vendor_admin' : 'vendor_project_engineer';
    case 'customer':
      return isFirstOrgUser ? 'customer_admin' : 'customer_project_lead';
    default:
      return 'freelancer';
  }
};

// Role categories for organization
export const ROLE_CATEGORIES = {
  platform_admin: ['platform_super_admin'],
  platform_ops: ['platform_operations_manager', 'platform_finance_manager', 'platform_technology_analyst'],
  platform_support: ['platform_mediator', 'platform_support_specialist'],
  freelancer: ['freelancer'],
  vendor_admin: ['vendor_admin'],
  vendor_ops: ['vendor_project_manager', 'vendor_project_lead', 'vendor_project_engineer', 'vendor_customer_success_manager'],
  vendor_specialist: ['vendor_finance_manager', 'vendor_sales_manager', 'vendor_quality_manager', 'vendor_data_analyst'],
  customer_admin: ['customer_admin'],
  customer_ops: ['customer_project_manager', 'customer_finance_manager', 'customer_procurement_manager', 'customer_project_lead']
} as const;