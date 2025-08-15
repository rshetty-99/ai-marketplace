'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { AuthButtons } from '@/components/auth/auth-buttons';
import { Button } from '@/components/ui/button';
import { Search } from '@/components/shared/search/global-search';
import { 
  Menu, 
  X, 
  ChevronDown,
  Brain,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  Zap,
  Shield,
  User,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/components/providers/analytics-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { NAVIGATION_CATEGORIES } from '@/lib/categories/navigation-data';

interface NavChild {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  description: string;
  icon: any;
  children?: NavChild[];
  isNavigationMenu?: boolean;
}

const navigation: NavItem[] = [
  {
    name: 'Services',
    href: '/catalog',
    description: 'Browse services across all categories',
    icon: Brain,
    isNavigationMenu: true, // Flag to use NavigationMenu component
  },
  {
    name: 'Providers',
    href: '/providers',
    description: 'Find AI companies',
    icon: Users,
    children: [
      { name: 'Verified Providers', href: '/providers?verified=true' },
      { name: 'Enterprise Partners', href: '/providers?tier=enterprise' },
      { name: 'All Providers', href: '/providers' },
    ]
  },
  {
    name: 'Resources',
    href: '/resources',
    description: 'Learn about AI',
    icon: BookOpen,
    children: [
      { name: 'AI Guide', href: '/resources/guide' },
      { name: 'Case Studies', href: '/resources/case-studies' },
      { name: 'Blog', href: '/resources/blog' },
      { name: 'Documentation', href: '/resources/docs' },
    ]
  }
];

const dashboardNavigation = [
  { name: 'Overview', href: '/dashboard', icon: BarChart3 },
  { name: 'Projects', href: '/dashboard/projects', icon: Zap },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);
  const pathname = usePathname();
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { user } = useUser();
  const { trackEvent } = useAnalytics();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const handleNavClick = (itemName: string, href: string) => {
    trackEvent('navigation_clicked', {
      nav_item: itemName,
      destination: href,
      current_page: pathname,
    });
  };

  const isDashboard = pathname.startsWith('/dashboard');
  const currentNav = isDashboard ? dashboardNavigation : navigation;

  // Get user role from metadata or public metadata
  const getUserRole = () => {
    if (!user) return 'User';
    
    // Check email for test accounts first (same logic as AppSidebar)
    const email = user.primaryEmailAddress?.emailAddress || '';
    if (email === 'rshetty99@hotmail.com') {
      return 'Freelancer'; // Known test account
    }
    if (email === 'rshetty99@gmail.com') {
      return 'Freelancer'; // Known test account
    }
    if (email === 'rshetty@techsamur.ai') {
      return 'Vendor Admin'; // Known test account
    }
    if (email === 'alsmith141520@gmail.com') {
      return 'Customer Admin'; // Known test account
    }
    
    // Try to get from Clerk metadata (safe version)
    const role = user.publicMetadata?.primary_role || user.publicMetadata?.role;
    if (role && typeof role === 'string') {
      return role.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Try user type
    const userType = user.publicMetadata?.user_type;
    if (userType && typeof userType === 'string') {
      return userType.charAt(0).toUpperCase() + userType.slice(1);
    }
    
    // Default role based on email domain
    if (user.emailAddresses?.[0]?.emailAddress?.includes('@')) {
      const domain = user.emailAddresses[0].emailAddress.split('@')[1];
      if (domain.includes('admin') || domain.includes('staff')) {
        return 'Admin';
      }
    }
    
    return 'User';
  };

  const userRole = getUserRole();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              onClick={() => handleNavClick('Logo', '/')}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                AI Marketplace
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {!isDashboard && (
              <>
                {navigation.map((item) => (
                  <div key={item.name}>
                    {item.isNavigationMenu ? (
                      // Services mega menu
                      <NavigationMenu>
                        <NavigationMenuList>
                          <NavigationMenuItem>
                            <NavigationMenuTrigger className="text-sm font-medium dark:text-gray-200">
                              {item.name}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                              <div className="grid w-[800px] gap-3 p-4 md:w-[900px] md:grid-cols-3 lg:w-[1000px]">
                                {NAVIGATION_CATEGORIES.map((category) => (
                                  <div key={category.id} className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{category.icon}</span>
                                      <h3 className="font-medium leading-none">
                                        <NavigationMenuLink asChild>
                                          <Link
                                            href={category.href}
                                            className="text-sm font-semibold hover:text-blue-600 transition-colors"
                                            onClick={() => handleNavClick(category.name, category.href)}
                                          >
                                            {category.name}
                                          </Link>
                                        </NavigationMenuLink>
                                      </h3>
                                    </div>
                                    <div className="space-y-2">
                                      {category.subcategories.slice(0, 3).map((subcategory) => (
                                        <div key={subcategory.id} className="relative group/subcategory">
                                          <div className="flex items-center justify-between group/subcategory-item">
                                            <div 
                                              className="flex-1 text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium py-1 cursor-pointer relative"
                                              onMouseEnter={() => setExpandedSubcategory(subcategory.id)}
                                              onMouseLeave={() => setExpandedSubcategory(null)}
                                            >
                                              <span className="flex items-center">
                                                {subcategory.name}
                                                <ChevronDown className="w-3 h-3 ml-1 text-gray-400 transition-transform duration-200 group-hover/subcategory-item:rotate-90" />
                                              </span>
                                              
                                              {/* Domains dropdown - shows on hover */}
                                              {expandedSubcategory === subcategory.id && (
                                                <div 
                                                  className="absolute left-full top-0 ml-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
                                                  onMouseEnter={() => setExpandedSubcategory(subcategory.id)}
                                                  onMouseLeave={() => setExpandedSubcategory(null)}
                                                >
                                                  <div className="px-3 py-2 border-b border-gray-100">
                                                    <h4 className="font-semibold text-sm text-gray-900">{subcategory.name}</h4>
                                                  </div>
                                                  <div className="py-1">
                                                    {subcategory.domains.map((domain) => (
                                                      <NavigationMenuLink asChild key={domain.id}>
                                                        <Link
                                                          href={domain.href}
                                                          className="flex flex-col px-4 py-2 hover:bg-gray-50 transition-colors"
                                                          onClick={() => handleNavClick(domain.name, domain.href)}
                                                        >
                                                          <span className="text-sm font-medium text-gray-900">{domain.name}</span>
                                                          <span className="text-xs text-gray-500">{domain.description}</span>
                                                        </Link>
                                                      </NavigationMenuLink>
                                                    ))}
                                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                                      <NavigationMenuLink asChild>
                                                        <Link
                                                          href={subcategory.href}
                                                          className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium transition-colors"
                                                          onClick={() => handleNavClick('View All', subcategory.href)}
                                                        >
                                                          View All {subcategory.name} →
                                                        </Link>
                                                      </NavigationMenuLink>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      {category.subcategories.length > 3 && (
                                        <NavigationMenuLink asChild>
                                          <Link
                                            href={category.href}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={() => handleNavClick('View All', category.href)}
                                          >
                                            View All {category.name} →
                                          </Link>
                                        </NavigationMenuLink>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </NavigationMenuContent>
                          </NavigationMenuItem>
                        </NavigationMenuList>
                      </NavigationMenu>
                    ) : (
                      // Regular navigation items
                      <div
                        ref={item.children ? dropdownRef : undefined}
                        className="relative"
                      >
                        {item.children ? (
                          <button
                            className={cn(
                              'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              pathname.startsWith(item.href) 
                                ? 'text-blue-600 bg-blue-50' 
                                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            )}
                            onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                          >
                            <span>{item.name}</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              pathname.startsWith(item.href) 
                                ? 'text-blue-600 bg-blue-50' 
                                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            )}
                            onClick={() => handleNavClick(item.name, item.href)}
                          >
                            {item.name}
                          </Link>
                        )}

                        {/* Dropdown Menu */}
                        {item.children && openDropdown === item.name && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                                onClick={() => {
                                  handleNavClick(`${item.name} - ${child.name}`, child.href);
                                  setOpenDropdown(null);
                                }}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {isDashboard && (
              <>
                {dashboardNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    )}
                    onClick={() => handleNavClick(item.name, item.href)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Search Bar (Desktop) */}
          {!isDashboard && (
            <div className="hidden lg:block flex-1 max-w-lg mx-8">
              <Search variant="minimal" />
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="flex items-center space-x-3">
                    {!isDashboard && (
                      <Button variant="ghost" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                    )}
                    
                    {/* Custom Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                        aria-label="Profile menu"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {user?.imageUrl ? (
                            <img 
                              src={user.imageUrl} 
                              alt="Profile"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      </button>

                      {/* Profile Dropdown Menu */}
                      {openDropdown === 'profile' && (
                        <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                          {/* User Info Section */}
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                {user?.imageUrl ? (
                                  <img 
                                    src={user.imageUrl} 
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {user?.fullName || user?.firstName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {user?.emailAddresses?.[0]?.emailAddress}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Shield className="w-3 h-3 text-blue-500 mr-1" />
                                  <span className="text-xs text-blue-600 font-medium">{userRole}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <Link
                              href="/dashboard"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <BarChart3 className="w-4 h-4 mr-3" />
                              Dashboard
                            </Link>
                            <Link
                              href="/dashboard/projects"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <Zap className="w-4 h-4 mr-3" />
                              My Projects
                            </Link>
                            <Link
                              href="/dashboard/settings"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <Settings className="w-4 h-4 mr-3" />
                              Settings
                            </Link>
                          </div>

                          {/* Sign Out */}
                          <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                            <button
                              onClick={() => {
                                setOpenDropdown(null);
                                signOut();
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <LogOut className="w-4 h-4 mr-3" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <AuthButtons />
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 space-y-4">
            {/* Mobile Search */}
            {!isDashboard && (
              <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <Search variant="minimal" />
              </div>
            )}

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {currentNav.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-3 rounded-md font-medium transition-colors',
                      pathname.startsWith(item.href) 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                    onClick={() => handleNavClick(item.name, item.href)}
                  >
                    {'icon' in item && <item.icon className="w-5 h-5" />}
                    <span>{item.name}</span>
                  </Link>
                  
                  {/* Mobile Submenu */}
                  {'children' in item && item.children && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          onClick={() => handleNavClick(`${item.name} - ${child.name}`, child.href)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile User Actions */}
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    {/* Mobile User Profile */}
                    <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        {user?.imageUrl ? (
                          <img 
                            src={user.imageUrl} 
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user?.fullName || user?.firstName || 'User'}
                        </p>
                        <div className="flex items-center mt-0.5">
                          <Shield className="w-3 h-3 text-blue-500 mr-1" />
                          <span className="text-xs text-blue-600 font-medium">{userRole}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile Dashboard Links */}
                    <div className="space-y-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/projects"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Zap className="w-4 h-4 mr-3" />
                        My Projects
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                    </div>
                    
                    {/* Mobile Sign Out */}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <AuthButtons />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}