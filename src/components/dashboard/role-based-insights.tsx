'use client'

import { useMemo } from "react"
import Link from "next/link"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Briefcase,
  Star,
  MessageSquare,
  Plus,
  ArrowRight
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useDashboardMenu } from "@/hooks/use-dashboard-menu"
import { cn } from "@/lib/utils"

interface InsightCard {
  id: string;
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  action?: {
    label: string;
    href: string;
  };
  color?: 'default' | 'green' | 'blue' | 'red' | 'yellow';
  progress?: number;
}

interface RoleBasedInsightsProps {
  className?: string;
}

export function RoleBasedInsights({ className }: RoleBasedInsightsProps) {
  const { userInfo, notifications } = useDashboardMenu()

  // Generate insights based on user role
  const insights = useMemo<InsightCard[]>(() => {
    if (!userInfo) return []

    switch (userInfo.userType) {
      case 'freelancer':
        return [
          {
            id: 'active-projects',
            title: 'Active Projects',
            value: 3,
            description: 'Projects in progress',
            icon: Briefcase,
            color: 'blue',
            action: { label: 'View All', href: '/dashboard/projects/active' }
          },
          {
            id: 'monthly-earnings',
            title: 'Monthly Earnings',
            value: '$4,250',
            description: 'This month',
            icon: DollarSign,
            color: 'green',
            trend: { value: 12, isPositive: true, label: '+12% from last month' },
            action: { label: 'View Details', href: '/dashboard/earnings' }
          },
          {
            id: 'profile-completion',
            title: 'Profile Completion',
            value: '85%',
            description: 'Complete to get more projects',
            icon: Users,
            color: 'yellow',
            progress: 85,
            action: { label: 'Complete Profile', href: '/dashboard/profile' }
          },
          {
            id: 'client-rating',
            title: 'Client Rating',
            value: '4.8',
            description: 'Average rating',
            icon: Star,
            color: 'default',
            action: { label: 'View Reviews', href: '/dashboard/reviews' }
          }
        ]

      case 'vendor':
        return [
          {
            id: 'active-projects',
            title: 'Active Projects',
            value: 12,
            description: 'Organization projects',
            icon: Briefcase,
            color: 'blue',
            action: { label: 'View All', href: '/dashboard/projects/active' }
          },
          {
            id: 'monthly-revenue',
            title: 'Monthly Revenue',
            value: '$45,600',
            description: 'This month',
            icon: DollarSign,
            color: 'green',
            trend: { value: 8, isPositive: true, label: '+8% from last month' },
            action: { label: 'View Reports', href: '/dashboard/finance/revenue' }
          },
          {
            id: 'team-utilization',
            title: 'Team Utilization',
            value: '78%',
            description: 'Current capacity usage',
            icon: Users,
            color: 'default',
            progress: 78,
            action: { label: 'Manage Team', href: '/dashboard/team' }
          },
          {
            id: 'client-satisfaction',
            title: 'Client Satisfaction',
            value: '4.6',
            description: 'Average client rating',
            icon: Star,
            color: 'default',
            action: { label: 'View Feedback', href: '/dashboard/analytics/clients' }
          }
        ]

      case 'customer':
        return [
          {
            id: 'active-projects',
            title: 'Active Projects',
            value: 5,
            description: 'Projects in progress',
            icon: Briefcase,
            color: 'blue',
            action: { label: 'View All', href: '/dashboard/projects/active' }
          },
          {
            id: 'monthly-spend',
            title: 'Monthly Spend',
            value: '$28,400',
            description: 'This month',
            icon: DollarSign,
            color: 'red',
            trend: { value: 5, isPositive: false, label: '+5% from last month' },
            action: { label: 'View Billing', href: '/dashboard/billing' }
          },
          {
            id: 'project-completion',
            title: 'On-Time Delivery',
            value: '92%',
            description: 'Projects delivered on time',
            icon: Clock,
            color: 'green',
            progress: 92,
            action: { label: 'View Analytics', href: '/dashboard/analytics' }
          },
          {
            id: 'active-providers',
            title: 'Active Providers',
            value: 8,
            description: 'Working service providers',
            icon: Users,
            color: 'default',
            action: { label: 'View Providers', href: '/dashboard/providers' }
          }
        ]

      case 'platform':
        return [
          {
            id: 'total-users',
            title: 'Platform Users',
            value: '12.4K',
            description: 'Active users',
            icon: Users,
            color: 'blue',
            trend: { value: 15, isPositive: true, label: '+15% this month' },
            action: { label: 'Manage Users', href: '/admin/users' }
          },
          {
            id: 'monthly-revenue',
            title: 'Platform Revenue',
            value: '$256K',
            description: 'This month',
            icon: DollarSign,
            color: 'green',
            trend: { value: 22, isPositive: true, label: '+22% from last month' },
            action: { label: 'View Reports', href: '/admin/finance' }
          },
          {
            id: 'support-tickets',
            title: 'Open Tickets',
            value: notifications['support-tickets']?.count || 0,
            description: 'Pending support requests',
            icon: AlertTriangle,
            color: 'red',
            action: { label: 'Handle Tickets', href: '/admin/support' }
          },
          {
            id: 'system-health',
            title: 'System Health',
            value: '99.8%',
            description: 'Uptime this month',
            icon: CheckCircle,
            color: 'green',
            progress: 99.8,
            action: { label: 'View Monitoring', href: '/admin/monitoring' }
          }
        ]

      default:
        return []
    }
  }, [userInfo, notifications])

  // Quick actions based on role
  const quickActions = useMemo(() => {
    if (!userInfo) return []

    const baseActions = [
      {
        id: 'messages',
        title: 'Messages',
        description: `${notifications['messages']?.count || 0} unread`,
        icon: MessageSquare,
        href: '/dashboard/messages',
        badge: notifications['messages']?.count
      }
    ]

    switch (userInfo.userType) {
      case 'freelancer':
        return [
          {
            id: 'create-proposal',
            title: 'Create Proposal',
            description: 'Submit a new project proposal',
            icon: Plus,
            href: '/dashboard/projects/proposals/create'
          },
          ...baseActions,
          {
            id: 'browse-projects',
            title: 'Browse Projects',
            description: 'Find new opportunities',
            icon: Target,
            href: '/dashboard/projects/browse'
          }
        ]

      case 'vendor':
        return [
          {
            id: 'new-project',
            title: 'New Project',
            description: 'Start a new client project',
            icon: Plus,
            href: '/dashboard/projects/create'
          },
          ...baseActions,
          {
            id: 'team-performance',
            title: 'Team Analytics',
            description: 'View team performance',
            icon: BarChart3,
            href: '/dashboard/analytics/team'
          }
        ]

      case 'customer':
        return [
          {
            id: 'post-project',
            title: 'Post Project',
            description: 'Create a new project request',
            icon: Plus,
            href: '/dashboard/projects/create'
          },
          ...baseActions,
          {
            id: 'find-providers',
            title: 'Find Providers',
            description: 'Search for service providers',
            icon: Users,
            href: '/dashboard/providers/browse'
          }
        ]

      case 'platform':
        return [
          {
            id: 'user-management',
            title: 'Manage Users',
            description: 'Platform user management',
            icon: Users,
            href: '/admin/users'
          },
          ...baseActions,
          {
            id: 'system-analytics',
            title: 'System Analytics',
            description: 'Platform performance data',
            icon: BarChart3,
            href: '/admin/analytics'
          }
        ]

      default:
        return baseActions
    }
  }, [userInfo, notifications])

  if (!userInfo) return null

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Insights Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Dashboard Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {insight.title}
                </CardTitle>
                <insight.icon className={cn(
                  "h-4 w-4",
                  insight.color === 'green' && "text-green-600",
                  insight.color === 'blue' && "text-blue-600",
                  insight.color === 'red' && "text-red-600",
                  insight.color === 'yellow' && "text-yellow-600",
                  insight.color === 'default' && "text-muted-foreground"
                )} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insight.value}</div>
                <p className="text-xs text-muted-foreground">
                  {insight.description}
                </p>
                
                {insight.trend && (
                  <div className={cn(
                    "flex items-center pt-1 text-xs",
                    insight.trend.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {insight.trend.label}
                  </div>
                )}

                {insight.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={insight.progress} className="h-2" />
                  </div>
                )}

                {insight.action && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 p-0 h-auto text-xs"
                    asChild
                  >
                    <Link href={insight.action.href} className="flex items-center gap-1">
                      {insight.action.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <action.icon className="h-5 w-5 text-primary" />
                  {action.badge && action.badge > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Link href={action.href} className="block">
                  <CardTitle className="text-sm mb-1">{action.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RoleBasedInsights