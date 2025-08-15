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

interface NavChild {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  description: string;
  icon: typeof Brain;
  children?: NavChild[];
}

interface DashboardNavItem {
  name: string;
  href: string;
  icon: typeof Brain;
}

const navigation: NavItem[] = [
  {
    name: 'Services',
    href: '/catalog',
    description: 'Browse AI solutions',
    icon: Brain,
    children: [
      { name: 'Computer Vision', href: '/catalog?category=computer_vision' },
      { name: 'Natural Language Processing', href: '/catalog?category=nlp' },
      { name: 'Machine Learning', href: '/catalog?category=machine_learning' },
      { name: 'Data Science', href: '/catalog?category=data_science' },
      { name: 'All Categories', href: '/catalog' },
    ]
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

const dashboardNavigation: DashboardNavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: BarChart3 },
  { name: 'Projects', href: '/dashboard/projects', icon: Zap },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function HeaderFixed() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { user } = useUser();
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

  const isDashboard = pathname.startsWith('/dashboard');
  const currentNav = isDashboard ? dashboardNavigation : navigation;

  // Get user role from metadata or public metadata
  const getUserRole = () => {
    if (!user) return 'User';
    
    // Check public metadata first, then private metadata
    const role = user.publicMetadata?.role || user.privateMetadata?.role || user.unsafeMetadata?.role;
    
    if (typeof role === 'string') {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    // Default role based on email or organization
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Marketplace
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {!isDashboard && (
              <>
                {navigation.map((item) => (
                  <div
                    key={item.name}
                    ref={item.children ? dropdownRef : undefined}
                    className="relative"
                  >
                    {item.children ? (
                      <button
                        className={cn(
                          'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          pathname.startsWith(item.href) 
                            ? 'text-blue-600 bg-blue-50' 
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
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
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        )}
                      >
                        {item.name}
                      </Link>
                    )}

                    {/* Dropdown Menu */}
                    {item.children && openDropdown === item.name && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {child.name}
                          </Link>
                        ))}
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
                        className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
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
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      </button>

                      {/* Profile Dropdown Menu */}
                      {openDropdown === 'profile' && (
                        <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
                          {/* User Info Section */}
                          <div className="px-4 py-3 border-b border-gray-100">
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
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user?.fullName || user?.firstName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
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
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <BarChart3 className="w-4 h-4 mr-3" />
                              Dashboard
                            </Link>
                            <Link
                              href="/dashboard/projects"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <Zap className="w-4 h-4 mr-3" />
                              My Projects
                            </Link>
                            <Link
                              href="/dashboard/settings"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <Settings className="w-4 h-4 mr-3" />
                              Settings
                            </Link>
                          </div>

                          {/* Sign Out */}
                          <div className="border-t border-gray-100 py-1">
                            <button
                              onClick={() => {
                                setOpenDropdown(null);
                                signOut();
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Search */}
            {!isDashboard && (
              <div className="pb-4 border-b border-gray-100">
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
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    {/* Mobile User Profile */}
                    <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
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
                        <p className="text-sm font-medium text-gray-900 truncate">
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
                      >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/projects"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <Zap className="w-4 h-4 mr-3" />
                        My Projects
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
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
                  <div className="pt-4 border-t border-gray-100 space-y-2">
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