'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Permission, 
  getDashboardMenuSections,
  ROLE_CATEGORIES 
} from '@/lib/firebase/rbac-schema';

export interface DashboardMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  description?: string;
  requiredPermissions: Permission[];
  isActive?: boolean;
}

export interface DashboardMenuSection {
  id: string;
  label: string;
  items: DashboardMenuItem[];
  requiredPermissions?: Permission[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Hook for managing dashboard navigation based on user roles and permissions
 */
export function useDashboardNavigation() {
  const { permissions, userType, hasPermission, isLoaded } = useAuth();

  const navigationSections = useMemo((): DashboardMenuSection[] => {
    if (!isLoaded || !permissions.length) {
      return [];
    }

    const sections: DashboardMenuSection[] = [];

    // Always show dashboard home
    sections.push({
      id: 'overview',
      label: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: 'LayoutDashboard',
          description: 'Your main dashboard overview',
          requiredPermissions: [] // Always accessible
        }
      ]
    });

    // Projects section
    if (hasPermission('project.view') || hasPermission('project.create')) {
      sections.push({
        id: 'projects',
        label: 'Projects',
        isCollapsible: true,
        defaultExpanded: true,
        items: [
          // View projects (all roles with project access)
          ...(hasPermission('project.view') ? [{
            id: 'projects-list',
            label: 'All Projects',
            href: '/dashboard/projects',
            icon: 'FolderOpen',
            description: 'View and manage your projects',
            requiredPermissions: ['project.view'] as Permission[]
          }] : []),
          
          // Create projects (admin and lead roles)
          ...(hasPermission('project.create') ? [{
            id: 'projects-create',
            label: 'Create Project',
            href: '/dashboard/projects/create',
            icon: 'Plus',
            description: 'Start a new project',
            requiredPermissions: ['project.create'] as Permission[]
          }] : []),
          
          // My assignments (engineers and leads)
          ...(hasPermission('project.execute') || hasPermission('project.lead') ? [{
            id: 'my-assignments',
            label: 'My Assignments',
            href: '/dashboard/projects/assignments',
            icon: 'UserCheck',
            description: 'Projects assigned to you',
            requiredPermissions: ['project.execute', 'project.lead'] as Permission[]
          }] : []),
          
          // Project templates (admins and leads)
          ...(hasPermission('project.lead') && userType === 'vendor' ? [{
            id: 'project-templates',
            label: 'Templates',
            href: '/dashboard/projects/templates',
            icon: 'Copy',
            description: 'Reusable project templates',
            requiredPermissions: ['project.lead'] as Permission[]
          }] : [])
        ]
      });
    }

    // Team management section
    if (hasPermission('team.view') || hasPermission('team.manage')) {
      sections.push({
        id: 'team',
        label: 'Team',
        isCollapsible: true,
        defaultExpanded: false,
        items: [
          // Team members
          {
            id: 'team-members',
            label: 'Team Members',
            href: '/dashboard/team',
            icon: 'Users',
            description: 'View and manage team members',
            requiredPermissions: ['team.view'] as Permission[]
          },
          
          // Invite members (admin roles)
          ...(hasPermission('team.invite') ? [{
            id: 'team-invite',
            label: 'Invite Members',
            href: '/dashboard/team/invite',
            icon: 'UserPlus',
            description: 'Invite new team members',
            requiredPermissions: ['team.invite'] as Permission[]
          }] : []),
          
          // Role management (admin roles)
          ...(hasPermission('team.manage') ? [{
            id: 'team-roles',
            label: 'Manage Roles',
            href: '/dashboard/team/roles',
            icon: 'Shield',
            description: 'Manage team member roles',
            requiredPermissions: ['team.manage'] as Permission[]
          }] : [])
        ]
      });
    }

    // Customer success section (vendor organizations only)
    if (userType === 'vendor' && (hasPermission('customer.interact') || hasPermission('customer.support'))) {
      sections.push({
        id: 'customers',
        label: 'Customers',
        isCollapsible: true,
        defaultExpanded: false,
        items: [
          // Customer list
          {
            id: 'customers-list',
            label: 'Customer Directory',
            href: '/dashboard/customers',
            icon: 'Building2',
            description: 'View and manage customer relationships',
            requiredPermissions: ['customer.interact'] as Permission[]
          },
          
          // Customer support
          ...(hasPermission('customer.support') ? [{
            id: 'customer-support',
            label: 'Support Tickets',
            href: '/dashboard/customers/support',
            icon: 'MessageCircle',
            description: 'Manage customer support requests',
            requiredPermissions: ['customer.support'] as Permission[]
          }] : []),
          
          // Customer projects
          ...(hasPermission('customer.projects') ? [{
            id: 'customer-projects',
            label: 'Customer Projects',
            href: '/dashboard/customers/projects',
            icon: 'Briefcase',
            description: 'View all customer project statuses',
            requiredPermissions: ['customer.projects'] as Permission[]
          }] : [])
        ]
      });
    }

    // Financial section
    if (hasPermission('billing.view') || hasPermission('billing.manage')) {
      sections.push({
        id: 'financial',
        label: 'Financial',
        isCollapsible: true,
        defaultExpanded: false,
        items: [
          // Billing overview
          {
            id: 'billing-overview',
            label: 'Billing Overview',
            href: '/dashboard/billing',
            icon: 'CreditCard',
            description: 'View billing and payment information',
            requiredPermissions: ['billing.view'] as Permission[]
          },
          
          // Invoices
          ...(hasPermission('invoice.create') || hasPermission('billing.view') ? [{
            id: 'invoices',
            label: 'Invoices',
            href: '/dashboard/billing/invoices',
            icon: 'FileText',
            description: 'Manage invoices and payments',
            requiredPermissions: ['billing.view', 'invoice.create'] as Permission[]
          }] : []),
          
          // Budget approvals
          ...(hasPermission('budget.approve') ? [{
            id: 'budget-approvals',
            label: 'Budget Approvals',
            href: '/dashboard/billing/approvals',
            icon: 'CheckCircle',
            description: 'Review and approve project budgets',
            requiredPermissions: ['budget.approve'] as Permission[]
          }] : []),
          
          // Financial reports
          ...(hasPermission('billing.manage') ? [{
            id: 'financial-reports',
            label: 'Reports',
            href: '/dashboard/billing/reports',
            icon: 'BarChart3',
            description: 'View financial reports and analytics',
            requiredPermissions: ['billing.manage'] as Permission[]
          }] : [])
        ]
      });
    }

    // Analytics section (admin and financial roles)
    if (hasPermission('org.analytics')) {
      sections.push({
        id: 'analytics',
        label: 'Analytics',
        isCollapsible: true,
        defaultExpanded: false,
        items: [
          {
            id: 'analytics-overview',
            label: 'Analytics Overview',
            href: '/dashboard/analytics',
            icon: 'TrendingUp',
            description: 'Business analytics and insights',
            requiredPermissions: ['org.analytics'] as Permission[]
          },
          {
            id: 'performance-metrics',
            label: 'Performance Metrics',
            href: '/dashboard/analytics/performance',
            icon: 'Activity',
            description: 'Team and project performance metrics',
            requiredPermissions: ['org.analytics'] as Permission[]
          },
          {
            id: 'financial-analytics',
            label: 'Financial Analytics',
            href: '/dashboard/analytics/financial',
            icon: 'DollarSign',
            description: 'Revenue and cost analysis',
            requiredPermissions: ['org.analytics'] as Permission[]
          }
        ]
      });
    }

    // Settings section
    if (hasPermission('org.settings') || hasPermission('profile.edit')) {
      sections.push({
        id: 'settings',
        label: 'Settings',
        isCollapsible: true,
        defaultExpanded: false,
        items: [
          // Profile settings (everyone)
          {
            id: 'profile-settings',
            label: 'Profile',
            href: '/dashboard/settings/profile',
            icon: 'User',
            description: 'Manage your personal profile',
            requiredPermissions: ['profile.edit'] as Permission[]
          },
          
          // Organization settings (admin roles)
          ...(hasPermission('org.settings') ? [{
            id: 'org-settings',
            label: 'Organization',
            href: '/dashboard/settings/organization',
            icon: 'Settings',
            description: 'Organization settings and preferences',
            requiredPermissions: ['org.settings'] as Permission[]
          }] : []),
          
          // Security settings (admin roles)
          ...(hasPermission('org.admin') ? [{
            id: 'security-settings',
            label: 'Security',
            href: '/dashboard/settings/security',
            icon: 'Shield',
            description: 'Security and compliance settings',
            requiredPermissions: ['org.admin'] as Permission[]
          }] : [])
        ]
      });
    }

    return sections.filter(section => 
      section.items.length > 0 && 
      section.items.some(item => 
        item.requiredPermissions.length === 0 || 
        item.requiredPermissions.some(permission => hasPermission(permission))
      )
    );
  }, [permissions, userType, hasPermission, isLoaded]);

  // Get quick actions based on role
  const quickActions = useMemo((): DashboardMenuItem[] => {
    if (!isLoaded || !permissions.length) {
      return [];
    }

    const actions: DashboardMenuItem[] = [];

    // Create project (admin/lead roles)
    if (hasPermission('project.create')) {
      actions.push({
        id: 'quick-create-project',
        label: 'Create Project',
        href: '/dashboard/projects/create',
        icon: 'Plus',
        description: 'Start a new project',
        requiredPermissions: ['project.create'] as Permission[]
      });
    }

    // Invite team member (admin roles)
    if (hasPermission('team.invite')) {
      actions.push({
        id: 'quick-invite-member',
        label: 'Invite Member',
        href: '/dashboard/team/invite',
        icon: 'UserPlus',
        description: 'Invite a new team member',
        requiredPermissions: ['team.invite'] as Permission[]
      });
    }

    // Create invoice (financial roles)
    if (hasPermission('invoice.create')) {
      actions.push({
        id: 'quick-create-invoice',
        label: 'Create Invoice',
        href: '/dashboard/billing/invoices/create',
        icon: 'FileText',
        description: 'Generate a new invoice',
        requiredPermissions: ['invoice.create'] as Permission[]
      });
    }

    return actions;
  }, [permissions, hasPermission, isLoaded]);

  return {
    navigationSections,
    quickActions,
    isLoaded
  };
}

/**
 * Hook to check if a menu item should be visible
 */
export function useMenuItemVisibility(requiredPermissions: Permission[]): boolean {
  const { hasPermission, isLoaded } = useAuth();
  
  if (!isLoaded) return false;
  
  // If no permissions required, always show
  if (requiredPermissions.length === 0) return true;
  
  // Check if user has at least one required permission
  return requiredPermissions.some(permission => hasPermission(permission));
}

/**
 * Get role category for display purposes
 */
export function useRoleCategory(): string | null {
  const { roles, userType, isLoaded } = useAuth();
  
  if (!isLoaded || !roles.length) return null;
  
  const primaryRole = roles[0]?.name || roles[0];
  
  for (const [category, roleList] of Object.entries(ROLE_CATEGORIES)) {
    if (roleList.includes(primaryRole as any)) {
      return category;
    }
  }
  
  return userType === 'freelancer' ? 'Independent' : 'Team Member';
}