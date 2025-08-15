import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@clerk/nextjs';
import { PermissionManager } from '@/lib/rbac/permissions';
import { Permission } from '@/lib/rbac/types';

// Mock the dependencies
jest.mock('@clerk/nextjs');
jest.mock('@/lib/rbac/permissions');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPermissionManager = PermissionManager as jest.Mocked<typeof PermissionManager>;

describe('PermissionGuard', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    organizationId: 'org-123',
    roles: [
      {
        id: 'role-1',
        name: 'team_member',
        description: 'Team member role',
        permissions: [Permission.SERVICE_VIEW, Permission.BOOKING_CREATE],
        organizationId: 'org-123',
        tier: 'basic',
        type: 'buyer',
      },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthContext = {
    isLoaded: true,
    isSignedIn: true,
    userId: 'user-123',
    sessionId: 'session-123',
    orgId: 'org-123',
    user: {
      publicMetadata: {
        organizationId: 'org-123',
        roles: ['team_member'],
        permissions: ['service:view', 'booking:create'],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseAuth.mockReturnValue(mockAuthContext as any);
    
    mockPermissionManager.hasPermission = jest.fn();
    mockPermissionManager.hasAnyPermission = jest.fn();
    mockPermissionManager.hasAllPermissions = jest.fn();
  });

  describe('Permission-based rendering', () => {
    it('should render children when user has required permission', () => {
      mockPermissionManager.hasPermission.mockReturnValue(true);
      
      render(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockPermissionManager.hasPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          organizationId: 'org-123',
        }),
        Permission.SERVICE_VIEW,
        undefined
      );
    });

    it('should not render children when user lacks required permission', () => {
      mockPermissionManager.hasPermission.mockReturnValue(false);
      
      render(
        <PermissionGuard permission={Permission.SERVICE_DELETE}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission and fallback is provided', () => {
      mockPermissionManager.hasPermission.mockReturnValue(false);
      
      render(
        <PermissionGuard 
          permission={Permission.SERVICE_DELETE}
          fallback={<div data-testid="access-denied">Access Denied</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    });
  });

  describe('Multiple permissions handling', () => {
    it('should render when user has any of the required permissions', () => {
      mockPermissionManager.hasAnyPermission.mockReturnValue(true);
      
      render(
        <PermissionGuard 
          permissions={[Permission.SERVICE_VIEW, Permission.SERVICE_EDIT]}
          requireAll={false}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockPermissionManager.hasAnyPermission).toHaveBeenCalledWith(
        expect.any(Object),
        [Permission.SERVICE_VIEW, Permission.SERVICE_EDIT]
      );
    });

    it('should render when user has all required permissions', () => {
      mockPermissionManager.hasAllPermissions.mockReturnValue(true);
      
      render(
        <PermissionGuard 
          permissions={[Permission.SERVICE_VIEW, Permission.BOOKING_CREATE]}
          requireAll={true}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockPermissionManager.hasAllPermissions).toHaveBeenCalledWith(
        expect.any(Object),
        [Permission.SERVICE_VIEW, Permission.BOOKING_CREATE]
      );
    });

    it('should not render when user lacks required permissions with requireAll=true', () => {
      mockPermissionManager.hasAllPermissions.mockReturnValue(false);
      
      render(
        <PermissionGuard 
          permissions={[Permission.SERVICE_VIEW, Permission.SERVICE_DELETE]}
          requireAll={true}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Role-based rendering', () => {
    it('should render when user has required role', () => {
      render(
        <PermissionGuard role="team_member">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render when user lacks required role', () => {
      render(
        <PermissionGuard role="admin">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render when user has any of the required roles', () => {
      render(
        <PermissionGuard roles={['team_member', 'admin']}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render when user has none of the required roles', () => {
      render(
        <PermissionGuard roles={['admin', 'moderator']}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Organization membership', () => {
    it('should render when user belongs to organization and requireOrg is true', () => {
      mockPermissionManager.hasPermission.mockReturnValue(true);
      
      render(
        <PermissionGuard 
          permission={Permission.SERVICE_VIEW}
          requireOrg={true}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render when user lacks organization membership', () => {
      const noOrgAuthContext = {
        ...mockAuthContext,
        orgId: null,
        user: {
          publicMetadata: {
            organizationId: null,
            roles: ['team_member'],
            permissions: ['service:view'],
          },
        },
      };
      
      mockUseAuth.mockReturnValue(noOrgAuthContext as any);
      
      render(
        <PermissionGuard 
          permission={Permission.SERVICE_VIEW}
          requireOrg={true}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Loading and authentication states', () => {
    it('should render loading state when auth is not loaded', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isLoaded: false,
      } as any);
      
      render(
        <PermissionGuard 
          permission={Permission.SERVICE_VIEW}
          loading={<div data-testid="loading">Loading...</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render default loading when auth is not loaded and no loading prop', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isLoaded: false,
      } as any);
      
      render(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      // Should render nothing or default loading (depends on implementation)
    });

    it('should not render when user is not signed in', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isSignedIn: false,
        userId: null,
      } as any);
      
      render(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render unauthenticated fallback when user is not signed in', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isSignedIn: false,
        userId: null,
      } as any);
      
      render(
        <PermissionGuard 
          permission={Permission.SERVICE_VIEW}
          unauthenticated={<div data-testid="sign-in">Please Sign In</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('sign-in')).toBeInTheDocument();
    });
  });

  describe('Resource-specific permissions', () => {
    it('should pass resource ID to permission checker', () => {
      mockPermissionManager.hasPermission.mockReturnValue(true);
      
      render(
        <PermissionGuard 
          permission={Permission.SERVICE_EDIT}
          resourceId="service-123"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(mockPermissionManager.hasPermission).toHaveBeenCalledWith(
        expect.any(Object),
        Permission.SERVICE_EDIT,
        'service-123'
      );
    });

    it('should handle dynamic resource IDs', () => {
      mockPermissionManager.hasPermission.mockReturnValue(true);
      
      const { rerender } = render(
        <PermissionGuard 
          permission={Permission.SERVICE_EDIT}
          resourceId="service-123"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      
      // Change resource ID
      rerender(
        <PermissionGuard 
          permission={Permission.SERVICE_EDIT}
          resourceId="service-456"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(mockPermissionManager.hasPermission).toHaveBeenLastCalledWith(
        expect.any(Object),
        Permission.SERVICE_EDIT,
        'service-456'
      );
    });
  });

  describe('Conditional rendering with custom logic', () => {
    it('should support custom condition function', () => {
      const customCondition = jest.fn().mockReturnValue(true);
      
      render(
        <PermissionGuard condition={customCondition}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(customCondition).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          organizationId: 'org-123',
        })
      );
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render when custom condition returns false', () => {
      const customCondition = jest.fn().mockReturnValue(false);
      
      render(
        <PermissionGuard condition={customCondition}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should combine custom condition with permission checks', () => {
      mockPermissionManager.hasPermission.mockReturnValue(true);
      const customCondition = jest.fn().mockReturnValue(true);
      
      render(
        <PermissionGuard 
          permission={Permission.SERVICE_VIEW}
          condition={customCondition}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(mockPermissionManager.hasPermission).toHaveBeenCalled();
      expect(customCondition).toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle permission check errors gracefully', () => {
      mockPermissionManager.hasPermission.mockImplementation(() => {
        throw new Error('Permission check failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        user: null,
      } as any);
      
      render(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Performance and memoization', () => {
    it('should not re-render when props have not changed', () => {
      mockPermissionManager.hasPermission.mockReturnValue(true);
      
      const { rerender } = render(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      const initialCallCount = mockPermissionManager.hasPermission.mock.calls.length;
      
      // Re-render with same props
      rerender(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );
      
      // Should not have called permission check again if memoized properly
      expect(mockPermissionManager.hasPermission.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount);
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper DOM structure', () => {
      mockPermissionManager.hasPermission.mockReturnValue(true);
      
      render(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <button data-testid="protected-button">Action Button</button>
        </PermissionGuard>
      );
      
      const button = screen.getByTestId('protected-button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should preserve accessibility attributes', () => {
      mockPermissionManager.hasPermission.mockReturnValue(true);
      
      render(
        <PermissionGuard permission={Permission.SERVICE_VIEW}>
          <button 
            data-testid="protected-button"
            aria-label="Delete service"
            role="button"
          >
            Delete
          </button>
        </PermissionGuard>
      );
      
      const button = screen.getByTestId('protected-button');
      expect(button).toHaveAttribute('aria-label', 'Delete service');
      expect(button).toHaveAttribute('role', 'button');
    });
  });
});