'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs"
import {
  Brain,
  LogOut,
  User,
  Shield,
  ChevronDown,
  ChevronRight,
  Plus,
  Bell,
  Loader2
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useDashboardMenu, useMenuNavigation, useMenuBadges } from "@/hooks/use-dashboard-menu"
import { cn } from "@/lib/utils"
import type { MenuItem, QuickAction } from "@/lib/dashboard/menu-builder"

interface RoleBasedSidebarProps {
  className?: string;
}

export function RoleBasedSidebar({ className }: RoleBasedSidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerkAuth()
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())
  
  // Get menu data based on user role
  const { 
    sections, 
    quickActions, 
    notifications, 
    userInfo, 
    loading 
  } = useDashboardMenu()
  
  const { isMenuItemActive } = useMenuNavigation()
  const { getBadgeForMenuItem } = useMenuBadges()

  // Toggle expanded state for menu items with children
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  // Auto-expand menu items that contain the active page
  React.useEffect(() => {
    const newExpanded = new Set<string>()
    
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => 
            isMenuItemActive(child.href, pathname)
          )
          if (hasActiveChild) {
            newExpanded.add(item.id)
          }
        }
      })
    })
    
    setExpandedItems(newExpanded)
  }, [pathname, sections, isMenuItemActive])

  // Render menu item badge
  const renderBadge = (item: MenuItem) => {
    const badgeValue = item.badge || getBadgeForMenuItem(item.id)
    if (!badgeValue) return null

    const notificationData = notifications[item.id]
    const badgeColor = notificationData?.type === 'error' ? 'destructive' :
                     notificationData?.type === 'warning' ? 'secondary' :
                     notificationData?.type === 'success' ? 'default' : 'default'

    return (
      <Badge 
        variant={badgeColor} 
        className="ml-auto h-5 min-w-5 text-xs"
      >
        {badgeValue}
      </Badge>
    )
  }

  // Render quick action button
  const renderQuickAction = (action: QuickAction) => (
    <Button
      key={action.id}
      variant="outline"
      size="sm"
      className={cn(
        "h-8 w-full justify-start gap-2 text-xs",
        action.color === 'green' && 'border-green-200 text-green-700 hover:bg-green-50',
        action.color === 'blue' && 'border-blue-200 text-blue-700 hover:bg-blue-50',
        action.color === 'red' && 'border-red-200 text-red-700 hover:bg-red-50'
      )}
      asChild={!!action.href}
    >
      {action.href ? (
        <Link href={action.href}>
          <action.icon className="h-3 w-3" />
          <span className="truncate">{action.title}</span>
        </Link>
      ) : (
        <button onClick={action.onClick}>
          <action.icon className="h-3 w-3" />
          <span className="truncate">{action.title}</span>
        </button>
      )}
    </Button>
  )

  // Render menu item (with or without children)
  const renderMenuItem = (item: MenuItem) => {
    const isActive = isMenuItemActive(item.href, pathname)
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0

    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isExpanded}
          onOpenChange={() => toggleExpanded(item.id)}
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton 
                tooltip={item.title}
                className={cn(
                  "w-full",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.title}</span>
                {renderBadge(item)}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children!.map((child) => (
                  <SidebarMenuSubItem key={child.id}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isMenuItemActive(child.href, pathname)}
                    >
                      <Link href={child.href}>
                        <child.icon className="h-3 w-3" />
                        <span>{child.title}</span>
                        {renderBadge(child)}
                        {child.isNew && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            New
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton 
          asChild 
          isActive={isActive}
          tooltip={item.title}
        >
          <Link href={item.href}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {renderBadge(item)}
            {item.isNew && (
              <Badge variant="secondary" className="ml-auto text-xs">
                New
              </Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  if (loading) {
    return (
      <Sidebar variant="inset" className={className}>
        <SidebarHeader>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </SidebarHeader>
      </Sidebar>
    )
  }

  return (
    <Sidebar variant="inset" className={className}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                  <Brain className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AI Marketplace</span>
                  <span className="truncate text-xs">
                    {userInfo?.displayName || 'Dashboard'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Actions Section */}
        {quickActions.length > 0 && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Plus className="h-3 w-3" />
                Quick Actions
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-col gap-1 px-2">
                  {quickActions.map(renderQuickAction)}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        {/* Dynamic Menu Sections */}
        {sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <SidebarGroup>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {index < sections.length - 1 && <SidebarSeparator />}
          </React.Fragment>
        ))}

        {/* Notifications section if any exist */}
        {Object.keys(notifications).length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Bell className="h-3 w-3" />
                Notifications
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2 text-xs text-muted-foreground">
                  {Object.values(notifications).reduce((sum, notif) => sum + notif.count, 0)} items need attention
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {user?.firstName?.charAt(0) || user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.fullName || user?.firstName || 'User'}
                    </span>
                    <span className="truncate text-xs flex items-center gap-1">
                      <Shield className="size-3" />
                      {userInfo?.displayName || 'User'}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center justify-between"
                  onSelect={(e) => e.preventDefault()}
                >
                  <span>Theme</span>
                  <ThemeToggle />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default RoleBasedSidebar