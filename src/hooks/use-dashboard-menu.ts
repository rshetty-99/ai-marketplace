'use client';

import { useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePermissions, useUserType, useOrganization } from '@/lib/rbac/hooks';
import { 
  buildMenuForRole, 
  getQuickActionsForRole,
  getMenuNotifications,
  type MenuSection,
  type QuickAction,
  type MenuNotification
} from '@/lib/dashboard/menu-builder';
import { useDashboardNotifications } from '@/lib/dashboard/notification-service';

export interface DashboardMenuData {
  sections: MenuSection[];
  quickActions: QuickAction[];
  notifications: Record<string, MenuNotification>;
  userInfo: {
    role: string;
    userType: string;
    displayName: string;
    organization?: {
      id: string;
      name: string;
      role: string;
    };
  } | null;
  loading: boolean;
}

/**
 * Hook to get user's dashboard menu based on their role and permissions
 */
export function useDashboardMenu(): DashboardMenuData {
  const { user: clerkUser } = useUser();
  const { 
    hasPermission, 
    hasRole, 
    sessionToken, 
    loading: permissionsLoading 
  } = usePermissions();
  const { userType, loading: userTypeLoading } = useUserType();
  const { organization, loading: orgLoading } = useOrganization();

  const loading = permissionsLoading || userTypeLoading || orgLoading;

  // Get user role information
  const userRole = useMemo(() => {
    if (!clerkUser || !sessionToken) return null;

    // Get primary role from session token
    const primaryRole = sessionToken.primaryRole || '';
    
    // Get display name for the role
    const displayName = sessionToken.roleDisplayName || 
      primaryRole.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
      role: primaryRole,
      displayName,
      permissions: sessionToken.permissions || [],
      userRoles: sessionToken.roles || []
    };
  }, [clerkUser, sessionToken]);

  // Get user permissions as array
  const userPermissions = useMemo(() => {
    if (!sessionToken) return [];
    return sessionToken.permissions || [];
  }, [sessionToken]);

  // Get user roles as array
  const userRoles = useMemo(() => {
    if (!sessionToken) return [];
    return sessionToken.roles || [];
  }, [sessionToken]);

  // Build menu sections based on user role and permissions
  const menuSections = useMemo(() => {
    if (!userType || !userRole || loading) return [];

    return buildMenuForRole(
      userType,
      userRole.role,
      userPermissions,
      userRoles
    );
  }, [userType, userRole, userPermissions, userRoles, loading]);

  // Get quick actions for the user's role
  const quickActions = useMemo(() => {
    if (!userRole || loading) return [];

    return getQuickActionsForRole(
      userRole.role,
      userPermissions
    );
  }, [userRole, userPermissions, loading]);

  // Get real-time notification data
  const { notifications: realtimeNotifications, loading: notificationsLoading } = useDashboardNotifications();
  
  const notifications = useMemo(() => {
    if (!clerkUser || !userType || loading || notificationsLoading) return {};
    
    // Use real-time notifications if available, fallback to mock data
    return Object.keys(realtimeNotifications).length > 0 
      ? realtimeNotifications 
      : getMenuNotifications(userType, clerkUser.id);
  }, [clerkUser, userType, loading, notificationsLoading, realtimeNotifications]);

  // Prepare user info
  const userInfo = useMemo(() => {
    if (!clerkUser || !userRole || !userType || loading) return null;

    return {
      role: userRole.role,
      userType: userType,
      displayName: userRole.displayName,
      organization: organization ? {
        id: organization.organizationId || '',
        name: organization.organizationName || '',
        role: organization.organizationRole || ''
      } : undefined
    };
  }, [clerkUser, userRole, userType, organization, loading]);

  return {
    sections: menuSections,
    quickActions,
    notifications,
    userInfo,
    loading
  };
}

/**
 * Hook to check if a specific menu item should be visible
 */
export function useMenuItemVisibility() {
  const { hasPermission, hasRole } = usePermissions();

  const isMenuItemVisible = (
    requiredPermissions?: string[],
    requiredRoles?: string[]
  ): boolean => {
    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission => 
        hasPermission(permission as any)
      );
      if (!hasRequiredPermission) return false;
    }

    // Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        hasRole(role)
      );
      if (!hasRequiredRole) return false;
    }

    return true;
  };

  return { isMenuItemVisible };
}

/**
 * Hook to get badge data for menu items
 */
export function useMenuBadges() {
  const { notifications, userInfo } = useDashboardMenu();

  const getBadgeForMenuItem = (itemId: string): string | number | undefined => {
    // Check real-time notifications first
    if (notifications[itemId] && notifications[itemId].count > 0) {
      return notifications[itemId].count;
    }

    // Fallback to static badge data for items without notifications
    const staticBadges: Record<string, string | number> = {
      'active-projects': userInfo?.userType === 'vendor' ? 12 : 3,
      'members': 8,
      'team-members': 8
    };

    return staticBadges[itemId];
  };

  return { getBadgeForMenuItem };
}

/**
 * Hook for menu navigation helpers
 */
export function useMenuNavigation() {
  const isMenuItemActive = (href: string, currentPath: string): boolean => {
    if (href === '/dashboard' && currentPath === '/dashboard') {
      return true;
    }
    
    if (href !== '/dashboard' && currentPath.startsWith(href)) {
      return true;
    }
    
    return false;
  };

  const getMenuItemProps = (item: any, currentPath: string) => {
    return {
      isActive: isMenuItemActive(item.href, currentPath),
      className: isMenuItemActive(item.href, currentPath) 
        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
        : ''
    };
  };

  return {
    isMenuItemActive,
    getMenuItemProps
  };
}

export default useDashboardMenu;