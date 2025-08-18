/**
 * Dashboard configuration for different user types
 * Defines the menu structure and available features for each role
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
  Mail,
  Bell,
  Video,
  Phone,
  Send,
  Inbox,
  Archive,
  Trash,
  PinIcon,
  Search,
  Filter,
  Tags
} from 'lucide-react';

export interface DashboardSection {
  title: string;
  icon: any;
  href: string;
  description?: string;
  badge?: string;
  requiredRole?: string[];
  children?: DashboardSection[];
}

/**
 * Freelancer Dashboard Configuration
 * Individual service providers focused on personal work management
 */
export const freelancerDashboard: DashboardSection[] = [
  {
    title: 'Overview',
    icon: Home,
    href: '/dashboard',
    description: 'Your personal dashboard'
  },
  {
    title: 'My Profile',
    icon: User,
    href: '/dashboard/profile',
    description: 'Manage your professional profile',
    children: [
      {
        title: 'Basic Info',
        icon: User,
        href: '/dashboard/profile/basic'
      },
      {
        title: 'Skills & Expertise',
        icon: Award,
        href: '/dashboard/profile/skills'
      },
      {
        title: 'Portfolio',
        icon: FolderOpen,
        href: '/dashboard/profile/portfolio'
      },
      {
        title: 'Certifications',
        icon: Award,
        href: '/dashboard/profile/certifications'
      }
    ]
  },
  {
    title: 'Projects',
    icon: Briefcase,
    href: '/dashboard/projects',
    description: 'Manage your client projects',
    children: [
      {
        title: 'Active Projects',
        icon: Package,
        href: '/dashboard/projects/active',
        badge: '3'
      },
      {
        title: 'Proposals',
        icon: FileText,
        href: '/dashboard/projects/proposals',
        badge: '5'
      },
      {
        title: 'Completed',
        icon: Star,
        href: '/dashboard/projects/completed'
      }
    ]
  },
  {
    title: 'Availability',
    icon: Calendar,
    href: '/dashboard/availability',
    description: 'Manage your work schedule',
    children: [
      {
        title: 'Calendar',
        icon: Calendar,
        href: '/dashboard/availability/calendar'
      },
      {
        title: 'Time Tracking',
        icon: Clock,
        href: '/dashboard/availability/timesheet'
      }
    ]
  },
  {
    title: 'Earnings',
    icon: DollarSign,
    href: '/dashboard/earnings',
    description: 'Track your income',
    children: [
      {
        title: 'Overview',
        icon: TrendingUp,
        href: '/dashboard/earnings/overview'
      },
      {
        title: 'Invoices',
        icon: FileText,
        href: '/dashboard/earnings/invoices'
      },
      {
        title: 'Payment Methods',
        icon: CreditCard,
        href: '/dashboard/earnings/payment-methods'
      }
    ]
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    href: '/dashboard/communication',
    description: 'All your communications',
    badge: '7',
    children: [
      {
        title: 'Chat',
        icon: MessageSquare,
        href: '/dashboard/communication/chat',
        description: 'Real-time project chat',
        badge: '3'
      },
      {
        title: 'Inbox',
        icon: Mail,
        href: '/dashboard/communication/inbox',
        description: 'Unified message inbox',
        badge: '4'
      },
      {
        title: 'Video Calls',
        icon: Video,
        href: '/dashboard/communication/video',
        description: 'Schedule and join meetings'
      },
      {
        title: 'Notifications',
        icon: Bell,
        href: '/dashboard/communication/notifications',
        description: 'Manage your alerts'
      }
    ]
  },
  {
    title: 'Reviews',
    icon: Star,
    href: '/dashboard/reviews',
    description: 'Client feedback and ratings'
  },
  {
    title: 'Learning',
    icon: BookOpen,
    href: '/dashboard/learning',
    description: 'Skill development resources'
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    description: 'Account preferences'
  }
];

/**
 * Vendor Dashboard Configuration
 * Organizations/companies managing teams and multiple projects
 */
export const vendorDashboard: DashboardSection[] = [
  {
    title: 'Overview',
    icon: Home,
    href: '/dashboard',
    description: 'Organization dashboard'
  },
  {
    title: 'Organization',
    icon: Building,
    href: '/dashboard/organization',
    description: 'Company management',
    children: [
      {
        title: 'Company Profile',
        icon: Building,
        href: '/dashboard/organization/profile'
      },
      {
        title: 'Services',
        icon: Zap,
        href: '/dashboard/organization/services'
      },
      {
        title: 'Certifications',
        icon: Award,
        href: '/dashboard/organization/certifications'
      },
      {
        title: 'Portfolio',
        icon: FolderOpen,
        href: '/dashboard/organization/portfolio'
      }
    ]
  },
  {
    title: 'Team',
    icon: Users,
    href: '/dashboard/team',
    description: 'Manage your team',
    children: [
      {
        title: 'Members',
        icon: Users,
        href: '/dashboard/team/members',
        badge: '8'
      },
      {
        title: 'Roles & Permissions',
        icon: Shield,
        href: '/dashboard/team/roles'
      },
      {
        title: 'Invitations',
        icon: UserPlus,
        href: '/dashboard/team/invitations'
      },
      {
        title: 'Performance',
        icon: TrendingUp,
        href: '/dashboard/team/performance'
      }
    ]
  },
  {
    title: 'Projects',
    icon: Briefcase,
    href: '/dashboard/projects',
    description: 'Project management',
    children: [
      {
        title: 'Active Projects',
        icon: Package,
        href: '/dashboard/projects/active',
        badge: '12'
      },
      {
        title: 'Pipeline',
        icon: GitBranch,
        href: '/dashboard/projects/pipeline'
      },
      {
        title: 'Proposals',
        icon: FileText,
        href: '/dashboard/projects/proposals',
        badge: '8'
      },
      {
        title: 'Resource Allocation',
        icon: Target,
        href: '/dashboard/projects/resources'
      },
      {
        title: 'Completed',
        icon: Star,
        href: '/dashboard/projects/completed'
      }
    ]
  },
  {
    title: 'Clients',
    icon: HeartHandshake,
    href: '/dashboard/clients',
    description: 'Client relationship management',
    children: [
      {
        title: 'Active Clients',
        icon: Users,
        href: '/dashboard/clients/active'
      },
      {
        title: 'Prospects',
        icon: Target,
        href: '/dashboard/clients/prospects'
      },
      {
        title: 'Contracts',
        icon: FileText,
        href: '/dashboard/clients/contracts'
      }
    ]
  },
  {
    title: 'Finance',
    icon: DollarSign,
    href: '/dashboard/finance',
    description: 'Financial management',
    children: [
      {
        title: 'Revenue Overview',
        icon: TrendingUp,
        href: '/dashboard/finance/revenue'
      },
      {
        title: 'Invoicing',
        icon: FileText,
        href: '/dashboard/finance/invoices'
      },
      {
        title: 'Expenses',
        icon: CreditCard,
        href: '/dashboard/finance/expenses'
      },
      {
        title: 'Payroll',
        icon: Users,
        href: '/dashboard/finance/payroll'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        href: '/dashboard/finance/reports'
      }
    ]
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    description: 'Business intelligence',
    children: [
      {
        title: 'Performance',
        icon: TrendingUp,
        href: '/dashboard/analytics/performance'
      },
      {
        title: 'Client Insights',
        icon: Users,
        href: '/dashboard/analytics/clients'
      },
      {
        title: 'Service Analytics',
        icon: Zap,
        href: '/dashboard/analytics/services'
      },
      {
        title: 'Market Position',
        icon: Target,
        href: '/dashboard/analytics/market'
      }
    ]
  },
  {
    title: 'Communication Hub',
    icon: MessageSquare,
    href: '/dashboard/communication',
    description: 'Team and client communications',
    badge: '12',
    children: [
      {
        title: 'Team Chat',
        icon: MessageSquare,
        href: '/dashboard/communication/team-chat',
        description: 'Internal team discussions',
        badge: '5'
      },
      {
        title: 'Client Communications',
        icon: Mail,
        href: '/dashboard/communication/clients',
        description: 'Client messages and updates',
        badge: '7'
      },
      {
        title: 'Project Channels',
        icon: FolderOpen,
        href: '/dashboard/communication/project-channels',
        description: 'Project-specific communications'
      },
      {
        title: 'Video Meetings',
        icon: Video,
        href: '/dashboard/communication/meetings',
        description: 'Schedule and manage meetings'
      },
      {
        title: 'Announcements',
        icon: Bell,
        href: '/dashboard/communication/announcements',
        description: 'Company and team announcements'
      }
    ]
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    description: 'Organization settings',
    children: [
      {
        title: 'General',
        icon: Settings,
        href: '/dashboard/settings/general'
      },
      {
        title: 'Billing',
        icon: CreditCard,
        href: '/dashboard/settings/billing'
      },
      {
        title: 'Security',
        icon: Shield,
        href: '/dashboard/settings/security'
      },
      {
        title: 'Integrations',
        icon: Zap,
        href: '/dashboard/settings/integrations'
      }
    ]
  }
];

/**
 * Customer Dashboard Configuration
 * Organizations looking to hire freelancers/vendors
 */
export const customerDashboard: DashboardSection[] = [
  {
    title: 'Overview',
    icon: Home,
    href: '/dashboard',
    description: 'Project overview'
  },
  {
    title: 'Projects',
    icon: Briefcase,
    href: '/dashboard/projects',
    description: 'Manage your projects',
    children: [
      {
        title: 'Active Projects',
        icon: Package,
        href: '/dashboard/projects/active'
      },
      {
        title: 'Create Project',
        icon: FileText,
        href: '/dashboard/projects/create'
      },
      {
        title: 'Proposals Received',
        icon: FileText,
        href: '/dashboard/projects/proposals'
      },
      {
        title: 'Completed',
        icon: Star,
        href: '/dashboard/projects/completed'
      }
    ]
  },
  {
    title: 'Service Providers',
    icon: Users,
    href: '/dashboard/providers',
    description: 'Find and manage providers',
    children: [
      {
        title: 'Browse Providers',
        icon: Users,
        href: '/dashboard/providers/browse'
      },
      {
        title: 'Saved Providers',
        icon: Star,
        href: '/dashboard/providers/saved'
      },
      {
        title: 'Active Contracts',
        icon: FileText,
        href: '/dashboard/providers/contracts'
      }
    ]
  },
  {
    title: 'Team',
    icon: Users,
    href: '/dashboard/team',
    description: 'Manage your team'
  },
  {
    title: 'Billing',
    icon: DollarSign,
    href: '/dashboard/billing',
    description: 'Payments and invoices'
  },
  {
    title: 'Communications',
    icon: MessageSquare,
    href: '/dashboard/communication',
    description: 'Provider and team communications',
    badge: '6',
    children: [
      {
        title: 'Provider Chat',
        icon: MessageSquare,
        href: '/dashboard/communication/providers',
        description: 'Chat with service providers',
        badge: '4'
      },
      {
        title: 'Project Inbox',
        icon: Mail,
        href: '/dashboard/communication/projects',
        description: 'Project-related messages',
        badge: '2'
      },
      {
        title: 'Meetings',
        icon: Video,
        href: '/dashboard/communication/meetings',
        description: 'Schedule consultations'
      },
      {
        title: 'Team Messages',
        icon: Users,
        href: '/dashboard/communication/team',
        description: 'Internal team communications'
      }
    ]
  },
  {
    title: 'Analytics',
    icon: TrendingUp,
    href: '/dashboard/analytics',
    description: 'Project insights'
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    description: 'Account settings'
  }
];

/**
 * Get dashboard configuration based on user type
 */
export function getDashboardConfig(userType: 'freelancer' | 'vendor' | 'customer'): DashboardSection[] {
  switch (userType) {
    case 'freelancer':
      return freelancerDashboard;
    case 'vendor':
      return vendorDashboard;
    case 'customer':
      return customerDashboard;
    default:
      return freelancerDashboard;
  }
}

/**
 * Key differences between dashboards:
 * 
 * FREELANCER:
 * - Personal profile management
 * - Individual availability/calendar
 * - Personal earnings tracking
 * - Direct client messaging
 * - Skill development focus
 * 
 * VENDOR:
 * - Organization management
 * - Team management & roles
 * - Multi-project resource allocation
 * - Client relationship management
 * - Business analytics & reporting
 * - Financial management (payroll, expenses)
 * 
 * CUSTOMER:
 * - Project posting & management
 * - Provider discovery & vetting
 * - Contract management
 * - Payment processing
 * - Simpler analytics focused on project outcomes
 */