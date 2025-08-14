import { describe, it, expect, beforeEach } from '@jest/globals';
import { PermissionManager } from '@/lib/rbac/permissions';
import { Permission, Role, User } from '@/lib/rbac/types';
import { TestDataFactory } from '@/tests/fixtures/test-data-factory';

describe('PermissionManager', () => {
  let testUser: User;
  let testRole: Role;
  const organizationId = 'test-org-id';

  beforeEach(() => {
    TestDataFactory.setSeed(12345);
    
    testRole = {
      id: 'role-1',
      name: 'test_role',
      description: 'Test role',
      permissions: [Permission.SERVICE_VIEW, Permission.BOOKING_CREATE],
      organizationId,
      tier: 'basic',
      type: 'buyer',
    };

    testUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      organizationId,
      roles: [testRole],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('hasPermission', () => {
    it('should return true when user has the required permission', () => {
      const result = PermissionManager.hasPermission(testUser, Permission.SERVICE_VIEW);
      expect(result).toBe(true);
    });

    it('should return false when user does not have the required permission', () => {
      const result = PermissionManager.hasPermission(testUser, Permission.SERVICE_DELETE);
      expect(result).toBe(false);
    });

    it('should return false when user is inactive', () => {
      const inactiveUser = { ...testUser, isActive: false };
      const result = PermissionManager.hasPermission(inactiveUser, Permission.SERVICE_VIEW);
      expect(result).toBe(false);
    });

    it('should handle resource-specific permissions', () => {
      const result = PermissionManager.hasPermission(
        testUser, 
        Permission.SERVICE_VIEW, 
        'service-123'
      );
      expect(result).toBe(true);
    });

    it('should deny cross-organization resource access', () => {
      const crossOrgRole = {
        ...testRole,
        organizationId: 'other-org-id',
      };
      const crossOrgUser = {
        ...testUser,
        roles: [crossOrgRole],
      };

      const result = PermissionManager.hasPermission(
        crossOrgUser,
        Permission.SERVICE_VIEW,
        'service-123'
      );
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one of the required permissions', () => {
      const permissions = [Permission.SERVICE_DELETE, Permission.SERVICE_VIEW];
      const result = PermissionManager.hasAnyPermission(testUser, permissions);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the required permissions', () => {
      const permissions = [Permission.SERVICE_DELETE, Permission.USER_MANAGEMENT];
      const result = PermissionManager.hasAnyPermission(testUser, permissions);
      expect(result).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      const result = PermissionManager.hasAnyPermission(testUser, []);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all required permissions', () => {
      const permissions = [Permission.SERVICE_VIEW, Permission.BOOKING_CREATE];
      const result = PermissionManager.hasAllPermissions(testUser, permissions);
      expect(result).toBe(true);
    });

    it('should return false when user is missing some permissions', () => {
      const permissions = [Permission.SERVICE_VIEW, Permission.SERVICE_DELETE];
      const result = PermissionManager.hasAllPermissions(testUser, permissions);
      expect(result).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      const result = PermissionManager.hasAllPermissions(testUser, []);
      expect(result).toBe(true);
    });
  });

  describe('canManageUser', () => {
    it('should allow user to manage themselves', () => {
      const result = PermissionManager.canManageUser(testUser, testUser);
      expect(result).toBe(true);
    });

    it('should allow platform admin to manage any user', () => {
      const adminUser = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.PLATFORM_ADMIN],
        }],
      };
      const otherUser = TestDataFactory.createUser(organizationId);

      const result = PermissionManager.canManageUser(adminUser, otherUser);
      expect(result).toBe(true);
    });

    it('should allow org admin to manage users in same organization', () => {
      const orgAdmin = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.USER_MANAGEMENT],
        }],
      };
      const sameOrgUser = TestDataFactory.createUser(organizationId);

      const result = PermissionManager.canManageUser(orgAdmin, sameOrgUser);
      expect(result).toBe(true);
    });

    it('should deny cross-organization user management', () => {
      const orgAdmin = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.USER_MANAGEMENT],
        }],
      };
      const otherOrgUser = TestDataFactory.createUser('other-org-id');

      const result = PermissionManager.canManageUser(orgAdmin, otherOrgUser);
      expect(result).toBe(false);
    });

    it('should allow team manager to manage team members in same organization', () => {
      const teamManager = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.MANAGE_TEAM],
        }],
      };
      const teamMember = TestDataFactory.createUser(organizationId);

      const result = PermissionManager.canManageUser(teamManager, teamMember);
      expect(result).toBe(true);
    });
  });

  describe('canAccessProject', () => {
    const projectId = 'project-123';
    const projectOrgId = organizationId;

    it('should allow platform admin to access any project', () => {
      const adminUser = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.PLATFORM_ADMIN],
        }],
      };

      const result = PermissionManager.canAccessProject(adminUser, projectId, projectOrgId);
      expect(result).toBe(true);
    });

    it('should allow user to access project in their organization', () => {
      const userWithProjectAccess = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.VIEW_PROJECT],
        }],
      };

      const result = PermissionManager.canAccessProject(userWithProjectAccess, projectId, projectOrgId);
      expect(result).toBe(true);
    });

    it('should deny access to project in different organization', () => {
      const userWithProjectAccess = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.VIEW_PROJECT],
        }],
      };

      const result = PermissionManager.canAccessProject(userWithProjectAccess, projectId, 'other-org-id');
      expect(result).toBe(false);
    });

    it('should deny access when user lacks project permission', () => {
      const userWithoutProjectAccess = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.SERVICE_VIEW], // No project permission
        }],
      };

      const result = PermissionManager.canAccessProject(userWithoutProjectAccess, projectId, projectOrgId);
      expect(result).toBe(false);
    });
  });

  describe('canModifyProject', () => {
    const projectId = 'project-123';
    const projectOrgId = organizationId;

    it('should allow platform admin to modify any project', () => {
      const adminUser = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.PLATFORM_ADMIN],
        }],
      };

      const result = PermissionManager.canModifyProject(adminUser, projectId, projectOrgId);
      expect(result).toBe(true);
    });

    it('should allow user to modify project in their organization with edit permission', () => {
      const userWithEditAccess = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.EDIT_PROJECT],
        }],
      };

      const result = PermissionManager.canModifyProject(userWithEditAccess, projectId, projectOrgId);
      expect(result).toBe(true);
    });

    it('should deny modification of project in different organization', () => {
      const userWithEditAccess = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.EDIT_PROJECT],
        }],
      };

      const result = PermissionManager.canModifyProject(userWithEditAccess, projectId, 'other-org-id');
      expect(result).toBe(false);
    });

    it('should deny modification when user lacks edit permission', () => {
      const userWithoutEditAccess = {
        ...testUser,
        roles: [{
          ...testRole,
          permissions: [Permission.VIEW_PROJECT], // No edit permission
        }],
      };

      const result = PermissionManager.canModifyProject(userWithoutEditAccess, projectId, projectOrgId);
      expect(result).toBe(false);
    });
  });

  describe('getMaxFreelancerTier', () => {
    it('should return highest tier when user has multiple vendor roles', () => {
      const userWithMultipleTiers = {
        ...testUser,
        roles: [
          { ...testRole, type: 'vendor', tier: 'verified' },
          { ...testRole, type: 'vendor', tier: 'premium' },
          { ...testRole, type: 'vendor', tier: 'enterprise' },
        ],
      };

      const result = PermissionManager.getMaxFreelancerTier(userWithMultipleTiers);
      expect(result).toBe('enterprise');
    });

    it('should return premium when user has premium and verified tiers', () => {
      const userWithPremiumTier = {
        ...testUser,
        roles: [
          { ...testRole, type: 'vendor', tier: 'verified' },
          { ...testRole, type: 'vendor', tier: 'premium' },
        ],
      };

      const result = PermissionManager.getMaxFreelancerTier(userWithPremiumTier);
      expect(result).toBe('premium');
    });

    it('should return verified when user has only verified tier', () => {
      const userWithVerifiedTier = {
        ...testUser,
        roles: [
          { ...testRole, type: 'vendor', tier: 'verified' },
        ],
      };

      const result = PermissionManager.getMaxFreelancerTier(userWithVerifiedTier);
      expect(result).toBe('verified');
    });

    it('should return null when user has no vendor roles', () => {
      const userWithoutVendorRoles = {
        ...testUser,
        roles: [
          { ...testRole, type: 'buyer', tier: 'premium' },
        ],
      };

      const result = PermissionManager.getMaxFreelancerTier(userWithoutVendorRoles);
      expect(result).toBeNull();
    });

    it('should ignore non-vendor roles when determining tier', () => {
      const userWithMixedRoles = {
        ...testUser,
        roles: [
          { ...testRole, type: 'buyer', tier: 'enterprise' },
          { ...testRole, type: 'vendor', tier: 'premium' },
          { ...testRole, type: 'admin', tier: 'enterprise' },
        ],
      };

      const result = PermissionManager.getMaxFreelancerTier(userWithMixedRoles);
      expect(result).toBe('premium');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle user with empty roles array', () => {
      const userWithoutRoles = {
        ...testUser,
        roles: [],
      };

      const result = PermissionManager.hasPermission(userWithoutRoles, Permission.SERVICE_VIEW);
      expect(result).toBe(false);
    });

    it('should handle role with empty permissions array', () => {
      const roleWithoutPermissions = {
        ...testRole,
        permissions: [],
      };
      const userWithEmptyRole = {
        ...testUser,
        roles: [roleWithoutPermissions],
      };

      const result = PermissionManager.hasPermission(userWithEmptyRole, Permission.SERVICE_VIEW);
      expect(result).toBe(false);
    });

    it('should handle undefined resource ID gracefully', () => {
      const result = PermissionManager.hasPermission(
        testUser,
        Permission.SERVICE_VIEW,
        undefined
      );
      expect(result).toBe(true);
    });

    it('should handle null values gracefully', () => {
      const userWithNullOrg = {
        ...testUser,
        organizationId: null as any,
      };

      const result = PermissionManager.hasPermission(userWithNullOrg, Permission.SERVICE_VIEW);
      expect(result).toBe(true); // Should still work for non-resource-specific permissions
    });
  });

  describe('multi-tenant scenarios', () => {
    it('should handle subsidiary user permissions correctly', () => {
      const parentOrgId = 'parent-org-id';
      const subsidiaryOrgId = 'subsidiary-org-id';
      
      const subsidiaryUser = {
        ...testUser,
        organizationId: subsidiaryOrgId,
        roles: [{
          ...testRole,
          organizationId: subsidiaryOrgId,
          permissions: [Permission.SERVICE_VIEW, Permission.BOOKING_CREATE],
        }],
      };

      // Should have access within their subsidiary
      const canAccessInSubsidiary = PermissionManager.hasPermission(
        subsidiaryUser,
        Permission.SERVICE_VIEW
      );
      expect(canAccessInSubsidiary).toBe(true);

      // Should not have access to parent org resources
      const parentResource = PermissionManager.canAccessProject(
        subsidiaryUser,
        'project-123',
        parentOrgId
      );
      expect(parentResource).toBe(false);
    });

    it('should handle channel partner permissions correctly', () => {
      const channelPartnerOrgId = 'channel-partner-org-id';
      
      const channelPartnerUser = {
        ...testUser,
        organizationId: channelPartnerOrgId,
        roles: [{
          ...testRole,
          organizationId: channelPartnerOrgId,
          permissions: [Permission.SERVICE_VIEW, Permission.BOOKING_CREATE],
        }],
      };

      const canViewServices = PermissionManager.hasPermission(
        channelPartnerUser,
        Permission.SERVICE_VIEW
      );
      expect(canViewServices).toBe(true);

      const canCreateBookings = PermissionManager.hasPermission(
        channelPartnerUser,
        Permission.BOOKING_CREATE
      );
      expect(canCreateBookings).toBe(true);

      // Channel partners should not be able to manage users
      const canManageUsers = PermissionManager.hasPermission(
        channelPartnerUser,
        Permission.USER_MANAGEMENT
      );
      expect(canManageUsers).toBe(false);
    });
  });
});