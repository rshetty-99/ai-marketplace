'use client'

import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Bell, Search, Plus, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useDashboardMenu } from "@/hooks/use-dashboard-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface RoleBasedHeaderProps {
  className?: string;
}

export function RoleBasedHeader({ className }: RoleBasedHeaderProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { notifications, quickActions, userInfo } = useDashboardMenu()

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    
    const breadcrumbs = [
      { title: 'Dashboard', href: '/dashboard' }
    ]

    // Add dynamic breadcrumbs based on path
    if (pathSegments.length > 1) {
      for (let i = 1; i < pathSegments.length; i++) {
        const segment = pathSegments[i]
        const href = '/' + pathSegments.slice(0, i + 1).join('/')
        const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        
        breadcrumbs.push({ title, href })
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()
  
  // Calculate total notification count
  const totalNotifications = Object.values(notifications).reduce(
    (sum, notification) => sum + notification.count, 
    0
  )

  // Get contextual actions based on current page
  const getContextualActions = () => {
    if (pathname.includes('/projects')) {
      return [
        { 
          label: 'New Project', 
          icon: Plus, 
          action: () => window.location.href = '/dashboard/projects/create' 
        }
      ]
    }
    
    if (pathname.includes('/team')) {
      return [
        { 
          label: 'Invite Member', 
          icon: Plus, 
          action: () => window.location.href = '/dashboard/team/invite' 
        }
      ]
    }

    return []
  }

  const contextualActions = getContextualActions()

  return (
    <header className={`flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      {/* Left section with sidebar trigger and breadcrumbs */}
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.title}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Center section with search (on wider screens) */}
      <div className="flex-1 flex items-center justify-center px-4 max-w-md mx-auto hidden lg:flex">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dashboard..."
            className="pl-8 bg-background/50"
          />
        </div>
      </div>

      {/* Right section with actions and notifications */}
      <div className="flex items-center gap-2 px-4">
        {/* Quick search button for mobile */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Search className="h-4 w-4" />
        </Button>

        {/* Contextual actions */}
        {contextualActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={action.action}
            className="hidden sm:flex gap-2"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}

        {/* Quick actions dropdown for mobile */}
        {quickActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quickActions.map((action) => (
                <DropdownMenuItem key={action.id} asChild>
                  {action.href ? (
                    <a href={action.href} className="flex items-center gap-2">
                      <action.icon className="h-4 w-4" />
                      {action.title}
                    </a>
                  ) : (
                    <button onClick={action.onClick} className="flex items-center gap-2 w-full">
                      <action.icon className="h-4 w-4" />
                      {action.title}
                    </button>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {totalNotifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {totalNotifications > 99 ? '99+' : totalNotifications}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {totalNotifications > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalNotifications}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {Object.values(notifications).length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              Object.values(notifications).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                  <div className="flex items-center gap-2 w-full">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'error' ? 'bg-red-500' :
                      notification.type === 'warning' ? 'bg-yellow-500' :
                      notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <span className="font-medium text-sm flex-1">{notification.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {notification.count}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {notification.lastUpdated?.toLocaleDateString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            
            {totalNotifications > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center">
                  <Button variant="ghost" size="sm" className="w-full">
                    Mark all as read
                  </Button>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <Button variant="ghost" size="icon" asChild>
          <a href="/dashboard/settings">
            <Settings className="h-4 w-4" />
          </a>
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  )
}

export default RoleBasedHeader