import { Permission, Role, User } from './types';

export class PermissionManager {
  static hasPermission(user: User, permission: Permission, resourceId?: string): boolean {
    if (!user.isActive) {
      return false;
    }

    return user.roles.some((role) => 
      role.permissions.includes(permission) &&
      this.hasResourceAccess(user, role, resourceId)
    );
  }

  static hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  static hasAllPermissions(user: User, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  private static hasResourceAccess(user: User, role: Role, resourceId?: string): boolean {
    if (!resourceId) {
      return true;
    }

    if (role.organizationId && user.organizationId !== role.organizationId) {
      return false;
    }

    return true;
  }

  static canManageUser(currentUser: User, targetUser: User): boolean {
    if (currentUser.id === targetUser.id) {
      return true;
    }

    if (this.hasPermission(currentUser, Permission.PLATFORM_ADMIN)) {
      return true;
    }

    if (this.hasPermission(currentUser, Permission.USER_MANAGEMENT)) {
      return currentUser.organizationId === targetUser.organizationId;
    }

    if (this.hasPermission(currentUser, Permission.MANAGE_TEAM)) {
      return currentUser.organizationId === targetUser.organizationId;
    }

    return false;
  }

  static canAccessProject(user: User, projectId: string, projectOrgId: string): boolean {
    if (this.hasPermission(user, Permission.PLATFORM_ADMIN)) {
      return true;
    }

    if (user.organizationId === projectOrgId) {
      return this.hasPermission(user, Permission.VIEW_PROJECT);
    }

    return false;
  }

  static canModifyProject(user: User, projectId: string, projectOrgId: string): boolean {
    if (this.hasPermission(user, Permission.PLATFORM_ADMIN)) {
      return true;
    }

    if (user.organizationId === projectOrgId) {
      return this.hasPermission(user, Permission.EDIT_PROJECT);
    }

    return false;
  }

  static getMaxFreelancerTier(user: User): string | null {
    const vendorRoles = user.roles.filter(role => role.type === 'vendor');
    
    if (vendorRoles.some(role => role.tier === 'enterprise')) {
      return 'enterprise';
    }
    
    if (vendorRoles.some(role => role.tier === 'premium')) {
      return 'premium';
    }
    
    if (vendorRoles.some(role => role.tier === 'verified')) {
      return 'verified';
    }

    return null;
  }
}