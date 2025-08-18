/**
 * Role-Based Menu Builder
 * Maps user roles and permissions to specific dashboard menu items
 */

import {
  Home,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Settings,
  User,
  Briefcase,
  Star,
  MessageSquare,
  FileText,
  Award,
  Clock,
  Target,
  Building,
  UserPlus,
  BarChart3,
  Shield,
  CreditCard,
  BookOpen,
  Zap,
  FolderOpen,
  GitBranch,
  HeartHandshake,
  Brain,
  Search,
  UserCheck,
  Database,
  AlertTriangle,
  CheckCircle,
  Pie,
  Globe,
  Network,
  Bot,
  Workflow,
  HelpCircle,
  Mail,
  Bell,
  Lock,
  Eye,
  MoreHorizontal,
  Play,
  Monitor,
  UserCog,
  Gavel,
  Phone,
  Archive,
  Download,
  Upload,
  Filter,
  RotateCcw
} from 'lucide-react';

export interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  title: string;
  icon: any;
  href: string;
  description?: string;
  badge?: string | number;
  isNew?: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  userTypes?: ('platform' | 'freelancer' | 'vendor' | 'customer')[];
  children?: MenuItem[];
  isActive?: boolean;
  onClick?: () => void;
  isExternal?: boolean;
  requiresOnboarding?: boolean;
}

export interface MenuNotification {
  type: 'info' | 'warning' | 'success' | 'error';
  count: number;
  label: string;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: any;
  href?: string;
  onClick?: () => void;
  color?: string;
  description?: string;
  requiredPermissions?: string[];
}

/**
 * Platform Admin Menu Configuration
 */
export const PLATFORM_ADMIN_MENU: MenuSection[] = [
  {
    id: 'overview',
    title: 'Platform Overview',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: Monitor,
        href: '/admin/dashboard',
        description: 'Platform metrics and health overview'
      },
      {
        id: 'analytics',
        title: 'Platform Analytics',
        icon: BarChart3,
        href: '/admin/analytics',
        description: 'Usage analytics and business intelligence'
      },
      {
        id: 'monitoring',
        title: 'System Monitoring',
        icon: Eye,
        href: '/admin/monitoring',
        description: 'Real-time system monitoring and alerts',
        requiredPermissions: ['technology.analyze']
      }
    ]
  },
  {
    id: 'management',
    title: 'Platform Management',
    items: [
      {
        id: 'users',
        title: 'User Management',
        icon: Users,
        href: '/admin/users',
        description: 'Manage platform users and organizations',
        requiredPermissions: ['user.manage']
      },
      {
        id: 'organizations',
        title: 'Organizations',
        icon: Building,
        href: '/admin/organizations',
        description: 'Manage vendor and customer organizations'
      },
      {
        id: 'content',
        title: 'Content Moderation',
        icon: Shield,
        href: '/admin/content',
        description: 'Review and moderate platform content',
        requiredPermissions: ['content.moderate']
      },
      {
        id: 'disputes',
        title: 'Dispute Resolution',
        icon: Gavel,
        href: '/admin/disputes',
        description: 'Handle user disputes and conflicts',
        requiredPermissions: ['dispute.resolve'],
        badge: '3'
      }
    ]
  },
  {
    id: 'finance',
    title: 'Financial Management',
    items: [
      {
        id: 'finance-overview',
        title: 'Financial Overview',
        icon: DollarSign,
        href: '/admin/finance',
        description: 'Platform revenue and financial metrics',
        requiredPermissions: ['finance.platform']
      },
      {
        id: 'transactions',
        title: 'Transactions',
        icon: CreditCard,
        href: '/admin/transactions',
        description: 'Payment processing and transaction history'
      },
      {
        id: 'reports',
        title: 'Financial Reports',
        icon: FileText,
        href: '/admin/reports',
        description: 'Generate financial reports and statements',
        requiredPermissions: ['reports.schedule']
      }
    ]
  },
  {
    id: 'support',
    title: 'Support & Operations',
    items: [
      {
        id: 'support-tickets',
        title: 'Support Tickets',
        icon: HelpCircle,
        href: '/admin/support',
        description: 'Customer support and assistance',
        requiredPermissions: ['customer.support'],
        badge: '12'
      },
      {
        id: 'messaging',
        title: 'Platform Messages',
        icon: Mail,
        href: '/admin/messages',
        description: 'Internal platform communications'
      }
    ]
  }
];

/**
 * Freelancer Menu Configuration
 */
export const FREELANCER_MENU: MenuSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    items: [
      {
        id: 'overview',
        title: 'Overview',
        icon: Home,
        href: '/dashboard',
        description: 'Your freelancer dashboard overview'
      },
      {
        id: 'analytics',
        title: 'Performance',
        icon: TrendingUp,
        href: '/dashboard/analytics',
        description: 'Track your performance metrics'
      }
    ]
  },
  {
    id: 'work',
    title: 'Work Management',
    items: [
      {
        id: 'projects',
        title: 'Projects',
        icon: Briefcase,
        href: '/dashboard/projects',
        description: 'Manage your client projects',
        children: [
          {
            id: 'active-projects',
            title: 'Active Projects',
            icon: Play,
            href: '/dashboard/projects/active',
            badge: '3'
          },
          {
            id: 'proposals',
            title: 'Proposals',
            icon: FileText,
            href: '/dashboard/projects/proposals',
            badge: '5'
          },
          {
            id: 'completed',
            title: 'Completed',
            icon: CheckCircle,
            href: '/dashboard/projects/completed'
          }
        ]
      },
      {
        id: 'availability',
        title: 'Availability',
        icon: Calendar,
        href: '/dashboard/availability',
        description: 'Manage your schedule and availability'
      },
      {
        id: 'earnings',
        title: 'Earnings',
        icon: DollarSign,
        href: '/dashboard/earnings',
        description: 'Track income and payments'
      }
    ]
  },
  {
    id: 'profile',
    title: 'Professional Profile',
    items: [
      {
        id: 'profile',
        title: 'My Profile',
        icon: User,
        href: '/dashboard/profile',
        description: 'Manage your professional profile',
        children: [
          {
            id: 'basic-info',
            title: 'Basic Info',
            icon: User,
            href: '/dashboard/profile/basic'
          },
          {
            id: 'skills',
            title: 'Skills & Expertise',
            icon: Award,
            href: '/dashboard/profile/skills'
          },
          {
            id: 'portfolio',
            title: 'Portfolio',
            icon: FolderOpen,
            href: '/dashboard/profile/portfolio'
          }
        ]
      },
      {
        id: 'reviews',
        title: 'Reviews',
        icon: Star,
        href: '/dashboard/reviews',
        description: 'Client feedback and ratings'
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication',
    items: [
      {
        id: 'messages',
        title: 'Messages',
        icon: MessageSquare,
        href: '/dashboard/messages',
        description: 'Client communications',
        badge: '2'
      }
    ]
  }
];

/**
 * Vendor Menu Configuration
 */
export const VENDOR_MENU: MenuSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    items: [
      {
        id: 'overview',
        title: 'Overview',
        icon: Home,
        href: '/dashboard',
        description: 'Organization dashboard overview'
      },
      {
        id: 'analytics',
        title: 'Business Analytics',
        icon: BarChart3,
        href: '/dashboard/analytics',
        description: 'Business intelligence and insights',
        requiredPermissions: ['org.analytics']
      }
    ]
  },
  {
    id: 'organization',
    title: 'Organization',
    items: [
      {
        id: 'organization',
        title: 'Organization',
        icon: Building,
        href: '/dashboard/organization',
        description: 'Company management and settings',
        children: [
          {
            id: 'company-profile',
            title: 'Company Profile',
            icon: Building,
            href: '/dashboard/organization/profile'
          },
          {
            id: 'services',
            title: 'Services',
            icon: Zap,
            href: '/dashboard/organization/services'
          },
          {
            id: 'portfolio',
            title: 'Portfolio',
            icon: FolderOpen,
            href: '/dashboard/organization/portfolio'
          }
        ]
      },
      {
        id: 'team',
        title: 'Team Management',
        icon: Users,
        href: '/dashboard/team',
        description: 'Manage team members and roles',
        requiredPermissions: ['team.manage'],
        children: [
          {
            id: 'members',
            title: 'Team Members',
            icon: Users,
            href: '/dashboard/team/members',
            badge: '8'
          },
          {
            id: 'roles',
            title: 'Roles & Permissions',
            icon: Shield,
            href: '/dashboard/team/roles'
          },
          {
            id: 'invitations',
            title: 'Invitations',
            icon: UserPlus,
            href: '/dashboard/team/invitations'
          }
        ]
      }
    ]
  },
  {
    id: 'projects',
    title: 'Project Management',
    items: [
      {
        id: 'projects',
        title: 'Projects',
        icon: Briefcase,
        href: '/dashboard/projects',
        description: 'Manage all organization projects',
        children: [
          {
            id: 'active-projects',
            title: 'Active Projects',
            icon: Play,
            href: '/dashboard/projects/active',
            badge: '12'
          },
          {
            id: 'pipeline',
            title: 'Sales Pipeline',
            icon: GitBranch,
            href: '/dashboard/projects/pipeline',
            requiredPermissions: ['sales.pipeline']
          },
          {
            id: 'proposals',
            title: 'Proposals',
            icon: FileText,
            href: '/dashboard/projects/proposals',
            badge: '8'
          },
          {
            id: 'completed',
            title: 'Completed',
            icon: CheckCircle,
            href: '/dashboard/projects/completed'
          }
        ]
      },
      {
        id: 'clients',
        title: 'Client Management',
        icon: HeartHandshake,
        href: '/dashboard/clients',
        description: 'Manage client relationships',
        requiredPermissions: ['customer.interact']
      }
    ]
  },
  {
    id: 'finance',
    title: 'Financial Management',
    items: [
      {
        id: 'finance',
        title: 'Finance',
        icon: DollarSign,
        href: '/dashboard/finance',
        description: 'Financial overview and management',
        requiredPermissions: ['billing.manage'],
        children: [
          {
            id: 'revenue',
            title: 'Revenue Overview',
            icon: TrendingUp,
            href: '/dashboard/finance/revenue'
          },
          {
            id: 'invoicing',
            title: 'Invoicing',
            icon: FileText,
            href: '/dashboard/finance/invoices'
          },
          {
            id: 'expenses',
            title: 'Expenses',
            icon: CreditCard,
            href: '/dashboard/finance/expenses'
          },
          {
            id: 'payroll',
            title: 'Payroll',
            icon: Users,
            href: '/dashboard/finance/payroll',
            requiredPermissions: ['payroll.manage']
          }
        ]
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication',
    items: [
      {
        id: 'messages',
        title: 'Messages',
        icon: MessageSquare,
        href: '/dashboard/messages',
        description: 'Team and client communications',
        badge: '5'
      }
    ]
  }
];

/**
 * Customer Menu Configuration
 */
export const CUSTOMER_MENU: MenuSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    items: [
      {
        id: 'overview',
        title: 'Overview',
        icon: Home,
        href: '/dashboard',
        description: 'Project and procurement overview'
      },
      {
        id: 'analytics',
        title: 'Project Analytics',
        icon: TrendingUp,
        href: '/dashboard/analytics',
        description: 'Project insights and performance'
      }
    ]
  },
  {
    id: 'projects',
    title: 'Project Management',
    items: [
      {
        id: 'projects',
        title: 'Projects',
        icon: Briefcase,
        href: '/dashboard/projects',
        description: 'Manage your projects and requirements',
        children: [
          {
            id: 'active-projects',
            title: 'Active Projects',
            icon: Play,
            href: '/dashboard/projects/active'
          },
          {
            id: 'create-project',
            title: 'Create Project',
            icon: FileText,
            href: '/dashboard/projects/create',
            isNew: true
          },
          {
            id: 'proposals',
            title: 'Proposals Received',
            icon: FileText,
            href: '/dashboard/projects/proposals'
          },
          {
            id: 'completed',
            title: 'Completed',
            icon: CheckCircle,
            href: '/dashboard/projects/completed'
          }
        ]
      }
    ]
  },
  {
    id: 'providers',
    title: 'Service Providers',
    items: [
      {
        id: 'providers',
        title: 'Service Providers',
        icon: Users,
        href: '/dashboard/providers',
        description: 'Find and manage service providers',
        children: [
          {
            id: 'browse-providers',
            title: 'Browse Providers',
            icon: Search,
            href: '/dashboard/providers/browse'
          },
          {
            id: 'saved-providers',
            title: 'Saved Providers',
            icon: Star,
            href: '/dashboard/providers/saved'
          },
          {
            id: 'contracts',
            title: 'Active Contracts',
            icon: FileText,
            href: '/dashboard/providers/contracts'
          }
        ]
      }
    ]
  },
  {
    id: 'organization',
    title: 'Organization',
    items: [
      {
        id: 'team',
        title: 'Team',
        icon: Users,
        href: '/dashboard/team',
        description: 'Manage your organization team',
        requiredPermissions: ['team.manage']
      },
      {
        id: 'billing',
        title: 'Billing',
        icon: DollarSign,
        href: '/dashboard/billing',
        description: 'Payments, invoices, and billing'
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication',
    items: [
      {
        id: 'messages',
        title: 'Messages',
        icon: MessageSquare,
        href: '/dashboard/messages',
        description: 'Provider communications'
      }
    ]
  }
];

/**
 * Common menu items available to all user types
 */
export const COMMON_MENU_ITEMS: MenuSection[] = [
  {
    id: 'marketplace',
    title: 'Marketplace',
    items: [
      {
        id: 'browse-services',
        title: 'Browse Services',
        icon: Brain,
        href: '/catalog',
        description: 'Explore AI services and solutions'
      },
      {
        id: 'providers-directory',
        title: 'Service Providers',
        icon: Users,
        href: '/providers',
        description: 'Find service providers'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        id: 'profile',
        title: 'Profile',
        icon: User,
        href: '/profile',
        description: 'Manage your profile'
      },
      {
        id: 'settings',
        title: 'Settings',
        icon: Settings,
        href: '/dashboard/settings',
        description: 'Account preferences and settings'
      }
    ]
  }
];

/**
 * Quick actions by role
 */
export const QUICK_ACTIONS = {
  platform_admin: [
    {
      id: 'user-management',
      title: 'Manage Users',
      icon: UserCog,
      href: '/admin/users',
      color: 'blue',
      description: 'Manage platform users'
    },
    {
      id: 'dispute-resolution',
      title: 'Resolve Disputes',
      icon: Gavel,
      href: '/admin/disputes',
      color: 'red',
      description: 'Handle user disputes'
    }
  ],
  freelancer: [
    {
      id: 'create-proposal',
      title: 'Create Proposal',
      icon: FileText,
      href: '/dashboard/projects/proposals/create',
      color: 'green',
      description: 'Submit a new project proposal'
    },
    {
      id: 'update-availability',
      title: 'Update Availability',
      icon: Calendar,
      href: '/dashboard/availability',
      color: 'blue',
      description: 'Set your availability'
    }
  ],
  vendor: [
    {
      id: 'create-project',
      title: 'New Project',
      icon: Briefcase,
      href: '/dashboard/projects/create',
      color: 'green',
      description: 'Start a new project'
    },
    {
      id: 'invite-team',
      title: 'Invite Team Member',
      icon: UserPlus,
      href: '/dashboard/team/invite',
      color: 'blue',
      description: 'Add new team member'
    }
  ],
  customer: [
    {
      id: 'post-project',
      title: 'Post Project',
      icon: FileText,
      href: '/dashboard/projects/create',
      color: 'green',
      description: 'Post a new project requirement'
    },
    {
      id: 'browse-providers',
      title: 'Find Providers',
      icon: Search,
      href: '/dashboard/providers/browse',
      color: 'blue',
      description: 'Search for service providers'
    }
  ]
} as const;

/**
 * Build menu based on user role and permissions
 */
export function buildMenuForRole(
  userType: 'platform' | 'freelancer' | 'vendor' | 'customer',
  role: string,
  permissions: string[] = [],
  userRoles: string[] = []
): MenuSection[] {
  let baseMenu: MenuSection[] = [];

  // Get base menu for user type
  switch (userType) {
    case 'platform':
      baseMenu = [...PLATFORM_ADMIN_MENU];
      break;
    case 'freelancer':
      baseMenu = [...FREELANCER_MENU];
      break;
    case 'vendor':
      baseMenu = [...VENDOR_MENU];
      break;
    case 'customer':
      baseMenu = [...CUSTOMER_MENU];
      break;
  }

  // Add common marketplace items for non-platform users
  if (userType !== 'platform') {
    baseMenu.push(...COMMON_MENU_ITEMS);
  }

  // Filter menu items based on permissions and roles
  return filterMenuByPermissions(baseMenu, permissions, userRoles);
}

/**
 * Filter menu items based on user permissions and roles
 */
function filterMenuByPermissions(
  sections: MenuSection[],
  permissions: string[],
  userRoles: string[]
): MenuSection[] {
  return sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // Check if item requires specific permissions
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        const hasPermission = item.requiredPermissions.some(perm => 
          permissions.includes(perm)
        );
        if (!hasPermission) return false;
      }

      // Check if item requires specific roles
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        const hasRole = item.requiredRoles.some(reqRole => 
          userRoles.includes(reqRole)
        );
        if (!hasRole) return false;
      }

      // Filter children recursively
      if (item.children) {
        item.children = item.children.filter(child => {
          if (child.requiredPermissions && child.requiredPermissions.length > 0) {
            return child.requiredPermissions.some(perm => permissions.includes(perm));
          }
          if (child.requiredRoles && child.requiredRoles.length > 0) {
            return child.requiredRoles.some(reqRole => userRoles.includes(reqRole));
          }
          return true;
        });
      }

      return true;
    })
  })).filter(section => section.items.length > 0);
}

/**
 * Get quick actions for a specific role
 */
export function getQuickActionsForRole(
  role: string,
  permissions: string[] = []
): QuickAction[] {
  // Determine role category for quick actions
  let roleCategory: keyof typeof QUICK_ACTIONS = 'freelancer';
  
  if (role.includes('platform') || role.includes('admin')) {
    roleCategory = 'platform_admin';
  } else if (role.includes('vendor')) {
    roleCategory = 'vendor';
  } else if (role.includes('customer')) {
    roleCategory = 'customer';
  }

  const actions = QUICK_ACTIONS[roleCategory] || [];
  
  // Filter by permissions
  return actions.filter(action => {
    if (action.requiredPermissions && action.requiredPermissions.length > 0) {
      return action.requiredPermissions.some(perm => permissions.includes(perm));
    }
    return true;
  });
}

/**
 * Get notification counts for different menu items
 * TODO: Integrate with real notification system
 */
export function getMenuNotifications(
  userType: string,
  userId: string
): Record<string, MenuNotification> {
  // Mock notifications - replace with real data
  const mockNotifications: Record<string, MenuNotification> = {
    messages: {
      type: 'info',
      count: 3,
      label: 'New messages'
    },
    disputes: {
      type: 'warning',
      count: 2,
      label: 'Pending disputes'
    },
    proposals: {
      type: 'success',
      count: 5,
      label: 'New proposals'
    },
    'support-tickets': {
      type: 'error',
      count: 12,
      label: 'Open tickets'
    }
  };

  return mockNotifications;
}

export default {
  buildMenuForRole,
  getQuickActionsForRole,
  getMenuNotifications,
  PLATFORM_ADMIN_MENU,
  FREELANCER_MENU,
  VENDOR_MENU,
  CUSTOMER_MENU,
  COMMON_MENU_ITEMS,
  QUICK_ACTIONS
};