// JWT Claims Utility
// Handles optimized JWT claims from Clerk with size constraints

export interface OptimizedJWTClaims {
  uid: string; // user.id
  email: string;
  verified: boolean;
  name: string;
  type: 'freelancer' | 'vendor' | 'customer';
  onb_status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  onb_done: boolean;
  onb_step: number;
  roles: string; // JSON array as string
  perms: string; // JSON array as string
  status?: string;
  tier?: string;
  fl_verified?: boolean;
  api_lvl?: string;
  org?: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

export interface ExpandedUserData {
  userId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  userType: 'freelancer' | 'vendor' | 'customer';
  onboarding: {
    status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
    completed: boolean;
    currentStep: number;
  };
  roles: string[];
  permissions: string[];
  userStatus?: string;
  freelancer?: {
    tier?: string;
    verified: boolean;
  };
  apiAccessLevel?: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

/**
 * Expand optimized JWT claims into full user data structure
 */
export function expandJWTClaims(claims: OptimizedJWTClaims): ExpandedUserData {
  let roles: string[] = [];
  let permissions: string[] = [];

  try {
    roles = JSON.parse(claims.roles || '[]');
  } catch (error) {
    console.warn('Failed to parse roles from JWT claims:', error);
  }

  try {
    permissions = JSON.parse(claims.perms || '[]');
  } catch (error) {
    console.warn('Failed to parse permissions from JWT claims:', error);
  }

  return {
    userId: claims.uid,
    email: claims.email,
    emailVerified: claims.verified,
    name: claims.name,
    userType: claims.type,
    onboarding: {
      status: claims.onb_status,
      completed: claims.onb_done,
      currentStep: claims.onb_step
    },
    roles,
    permissions,
    userStatus: claims.status,
    freelancer: {
      tier: claims.tier,
      verified: claims.fl_verified || false
    },
    apiAccessLevel: claims.api_lvl,
    organization: claims.org
  };
}

/**
 * Get user permissions from JWT claims
 */
export function getUserPermissionsFromClaims(claims: OptimizedJWTClaims): string[] {
  try {
    return JSON.parse(claims.perms || '[]');
  } catch (error) {
    console.warn('Failed to parse permissions from JWT claims:', error);
    return [];
  }
}

/**
 * Get user roles from JWT claims
 */
export function getUserRolesFromClaims(claims: OptimizedJWTClaims): string[] {
  try {
    return JSON.parse(claims.roles || '[]');
  } catch (error) {
    console.warn('Failed to parse roles from JWT claims:', error);
    return [];
  }
}

/**
 * Check if user has specific permission based on JWT claims
 */
export function hasPermissionInClaims(
  claims: OptimizedJWTClaims, 
  permission: string
): boolean {
  const permissions = getUserPermissionsFromClaims(claims);
  return permissions.includes(permission);
}

/**
 * Check if user has specific role based on JWT claims
 */
export function hasRoleInClaims(
  claims: OptimizedJWTClaims, 
  role: string
): boolean {
  const roles = getUserRolesFromClaims(claims);
  return roles.includes(role);
}

/**
 * Get organization context from JWT claims
 */
export function getOrganizationFromClaims(claims: OptimizedJWTClaims): {
  id?: string;
  name?: string;
  slug?: string;
  role?: string;
} {
  if (!claims.org?.id) {
    return {};
  }

  return {
    id: claims.org.id,
    name: claims.org.name,
    slug: claims.org.slug,
    role: claims.org.role
  };
}

/**
 * Check if user needs onboarding
 */
export function needsOnboarding(claims: OptimizedJWTClaims): boolean {
  return !claims.onb_done || claims.onb_status !== 'completed';
}

/**
 * Get onboarding redirect URL based on user type and current step
 */
export function getOnboardingRedirectUrl(claims: OptimizedJWTClaims): string {
  if (!needsOnboarding(claims)) {
    return '/dashboard';
  }

  const baseUrl = `/onboarding/${claims.type}`;
  return claims.onb_step > 0 ? `${baseUrl}?step=${claims.onb_step}` : baseUrl;
}

/**
 * Utility to safely access JWT claims from auth context
 */
export function getJWTClaims(auth: any): OptimizedJWTClaims | null {
  try {
    // This will depend on how Clerk exposes the custom claims
    // Typically available in auth.sessionClaims or similar
    return auth?.sessionClaims as OptimizedJWTClaims;
  } catch (error) {
    console.warn('Failed to access JWT claims:', error);
    return null;
  }
}

/**
 * Create a summary for debugging/logging (without sensitive data)
 */
export function createClaimsSummary(claims: OptimizedJWTClaims): {
  userId: string;
  userType: string;
  onboardingStatus: string;
  hasOrganization: boolean;
  roleCount: number;
  permissionCount: number;
} {
  const roles = getUserRolesFromClaims(claims);
  const permissions = getUserPermissionsFromClaims(claims);

  return {
    userId: claims.uid,
    userType: claims.type,
    onboardingStatus: claims.onb_status,
    hasOrganization: !!claims.org?.id,
    roleCount: roles.length,
    permissionCount: permissions.length
  };
}

/**
 * Validate JWT claims structure
 */
export function validateJWTClaims(claims: any): claims is OptimizedJWTClaims {
  return (
    typeof claims === 'object' &&
    typeof claims.uid === 'string' &&
    typeof claims.email === 'string' &&
    typeof claims.type === 'string' &&
    ['freelancer', 'vendor', 'customer'].includes(claims.type)
  );
}

/**
 * Estimate JWT size for debugging
 */
export function estimateJWTSize(claims: OptimizedJWTClaims): {
  estimatedSize: number;
  isWithinLimit: boolean;
  breakdown: Record<string, number>;
} {
  const claimsString = JSON.stringify(claims);
  const estimatedSize = Buffer.byteLength(claimsString, 'utf8');
  
  const breakdown: Record<string, number> = {};
  Object.entries(claims).forEach(([key, value]) => {
    breakdown[key] = Buffer.byteLength(JSON.stringify(value), 'utf8');
  });

  return {
    estimatedSize,
    isWithinLimit: estimatedSize <= 2048,
    breakdown
  };
}