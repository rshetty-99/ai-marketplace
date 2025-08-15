'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, useAuth } from "@clerk/nextjs"
import {
  Brain,
  BarChart3,
  Calendar,
  FileText,
  Settings,
  Users,
  Package,
  TrendingUp,
  CreditCard,
  BookOpen,
  Home,
  LogOut,
  User,
  Shield
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

// Menu items for main dashboard navigation
const dashboardItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: Package,
  },
  {
    title: "Bookings",
    url: "/dashboard/bookings",
    icon: Calendar,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: TrendingUp,
  },
  {
    title: "Billing",
    url: "/dashboard/billing",
    icon: CreditCard,
  },
]

// Menu items for marketplace navigation
const marketplaceItems = [
  {
    title: "Browse Services",
    url: "/catalog",
    icon: Brain,
  },
  {
    title: "Service Providers",
    url: "/providers",
    icon: Users,
  },
  {
    title: "Resources",
    url: "/resources",
    icon: BookOpen,
  },
]

// Menu items for settings
const settingsItems = [
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useAuth()

  // Get user role from metadata
  const getUserRole = () => {
    if (!user) return 'User'
    
    const role = user.publicMetadata?.role || user.privateMetadata?.role || user.unsafeMetadata?.role
    
    if (typeof role === 'string') {
      return role.charAt(0).toUpperCase() + role.slice(1)
    }
    
    if (user.emailAddresses?.[0]?.emailAddress?.includes('@')) {
      const domain = user.emailAddresses[0].emailAddress.split('@')[1]
      if (domain.includes('admin') || domain.includes('staff')) {
        return 'Admin'
      }
    }
    
    return 'User'
  }

  const userRole = getUserRole()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                  <Brain className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AI Marketplace</span>
                  <span className="truncate text-xs">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Marketplace Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Marketplace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {marketplaceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                      {userRole}
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
                  <Link href="/dashboard/profile" className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-between">
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