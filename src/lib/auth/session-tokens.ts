/**
 * Session Token Types and Utilities for AI Marketplace
 * 
 * This module provides type definitions and helper functions for working with
 * custom session tokens from Clerk. These tokens contain user metadata, roles,
 * and permissions for efficient frontend authorization.
 */

import { UserType, OnboardingStatus } from '@/lib/firebase/onboarding-schema';
import { Permission, FreelancerTier } from '@/lib/rbac/types';

/**
 * Custom session token claims structure
 * This matches the template defined in clerk-session-token.js
 */
export interface CustomSessionClaims {
  // Standard user information
  user_id: string;
  email: string;
  email_verified: boolean;
  name: string;
  username?: string;
  created_at: number;
  updated_at: number;

  // AI Marketplace specific claims
  user_type?: UserType;
  onboarding_status: OnboardingStatus;
  onboarding_completed: boolean;
  onboarding_current_step: number;

  // Organization information
  organization_id?: string;
  organization_name?: string;
  organization_role?: string;

  // Roles and permissions (JSON strings)
  roles: string; // JSON array of role objects
  permissions: string; // JSON array of permission strings
  user_status: 'active' | 'inactive' | 'suspended' | 'pending';

  // Freelancer-specific data
  freelancer_tier?: FreelancerTier;
  freelancer_verified: boolean;
  freelancer_rating?: number;

  // Organization-specific data
  organization_type?: 'freelancer' | 'vendor_company' | 'customer_organization';
  can_invite_users: boolean;
  max_budget_approval: number;

  // Feature flags and preferences (JSON strings)
  feature_flags: string; // JSON object
  preferences: string; // JSON object

  // Security and compliance
  background_check_status: 'not_started' | 'in_progress' | 'verified' | 'failed';
  compliance_status: 'pending' | 'compliant' | 'non_compliant' | 'under_review';
  api_access_level: 'none' | 'basic' | 'professional' | 'enterprise';

  // Session metadata
  session_id: string;
  session_status: string;
  last_active_at: number;

  // Standard JWT claims
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  azp: string;

  // Organization context (null if not in an organization)
  org?: {
    id: string;
    name: string;
    slug: string;
    role: string;
    permissions: string; // Comma-separated permission strings
    created_at: number;
    updated_at: number;
  } | null;
}

/**
 * Parsed session token data with type-safe properties
 */
export interface ParsedSessionToken {
  userId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  username?: string;
  userType?: UserType;
  onboardingStatus: OnboardingStatus;
  onboardingCompleted: boolean;
  onboardingCurrentStep: number;
  organizationId?: string;
  organizationName?: string;
  organizationRole?: string;
  roles: Array<{
    id: string;
    name: string;
    type: string;
    permissions: Permission[];
    organizationId?: string;
    tier?: FreelancerTier;
  }>;
  permissions: Permission[];
  userStatus: 'active' | 'inactive' | 'suspended' | 'pending';
  freelancerTier?: FreelancerTier;
  freelancerVerified: boolean;
  freelancerRating?: number;
  organizationType?: UserType;
  canInviteUsers: boolean;
  maxBudgetApproval: number;
  featureFlags: Record<string, boolean>;
  preferences: Record<string, any>;
  backgroundCheckStatus: 'not_started' | 'in_progress' | 'verified' | 'failed';
  complianceStatus: 'pending' | 'compliant' | 'non_compliant' | 'under_review';
  apiAccessLevel: 'none' | 'basic' | 'professional' | 'enterprise';
  sessionId: string;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  organization?: {
    id: string;
    name: string;
    slug: string;
    role: string;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

/**
 * Parse JSON string safely with fallback
 */
function parseJsonSafely<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Parse custom session claims into a type-safe object
 */
export function parseSessionToken(claims: CustomSessionClaims): ParsedSessionToken {
  const roles = parseJsonSafely(claims.roles, []);
  const permissions = parseJsonSafely(claims.permissions, []);
  const featureFlags = parseJsonSafely(claims.feature_flags, {});
  const preferences = parseJsonSafely(claims.preferences, {});

  return {
    userId: claims.user_id,
    email: claims.email,
    emailVerified: claims.email_verified,
    name: claims.name,
    username: claims.username,
    userType: claims.user_type,
    onboardingStatus: claims.onboarding_status,
    onboardingCompleted: claims.onboarding_completed,
    onboardingCurrentStep: claims.onboarding_current_step,
    organizationId: claims.organization_id,
    organizationName: claims.organization_name,
    organizationRole: claims.organization_role,
    roles,
    permissions,
    userStatus: claims.user_status,
    freelancerTier: claims.freelancer_tier,
    freelancerVerified: claims.freelancer_verified,
    freelancerRating: claims.freelancer_rating,
    organizationType: claims.organization_type,
    canInviteUsers: claims.can_invite_users,
    maxBudgetApproval: claims.max_budget_approval,
    featureFlags,
    preferences,
    backgroundCheckStatus: claims.background_check_status,
    complianceStatus: claims.compliance_status,
    apiAccessLevel: claims.api_access_level,
    sessionId: claims.session_id,
    lastActiveAt: new Date(claims.last_active_at * 1000),
    createdAt: new Date(claims.created_at * 1000),
    updatedAt: new Date(claims.updated_at * 1000),
    expiresAt: new Date(claims.exp * 1000),
    organization: claims.org ? {
      id: claims.org.id,
      name: claims.org.name,
      slug: claims.org.slug,
      role: claims.org.role,
      permissions: claims.org.permissions.split(',').filter(Boolean) as Permission[],
      createdAt: new Date(claims.org.created_at * 1000),
      updatedAt: new Date(claims.org.updated_at * 1000),
    } : null,
  };
}

/**
 * Check if user has completed onboarding
 */
export function isOnboardingComplete(token: ParsedSessionToken): boolean {
  return token.onboardingCompleted && token.onboardingStatus === OnboardingStatus.COMPLETED;
}

/**
 * Check if user needs to complete onboarding
 */
export function needsOnboarding(token: ParsedSessionToken): boolean {
  return !token.onboardingCompleted || 
         token.onboardingStatus === OnboardingStatus.NOT_STARTED ||
         token.onboardingStatus === OnboardingStatus.IN_PROGRESS;
}

/**
 * Get onboarding redirect path based on user type and current step
 */
export function getOnboardingRedirectPath(token: ParsedSessionToken): string {
  if (isOnboardingComplete(token)) {
    return '/dashboard';
  }

  const step = token.onboardingCurrentStep || 0;
  const userType = token.userType;

  if (!userType) {
    return '/onboarding';
  }

  return `/onboarding?type=${userType}&step=${step}`;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(token: ParsedSessionToken, permission: Permission): boolean {
  return token.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(token: ParsedSessionToken, permissions: Permission[]): boolean {
  return permissions.some(permission => token.permissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(token: ParsedSessionToken, permissions: Permission[]): boolean {
  return permissions.every(permission => token.permissions.includes(permission));
}

/**
 * Check if user has a specific role
 */
export function hasRole(token: ParsedSessionToken, roleName: string): boolean {
  return token.roles.some(role => role.name.toLowerCase() === roleName.toLowerCase());
}

/**
 * Check if user is in an organization
 */
export function isInOrganization(token: ParsedSessionToken): boolean {
  return !!token.organizationId && !!token.organization;
}

/**
 * Check if user is an organization owner
 */
export function isOrganizationOwner(token: ParsedSessionToken): boolean {
  return isInOrganization(token) && hasRole(token, 'ORG_OWNER');
}

/**
 * Check if user can invite other users
 */
export function canInviteUsers(token: ParsedSessionToken): boolean {
  return token.canInviteUsers || isOrganizationOwner(token);
}

/**
 * Get user's maximum budget approval amount
 */
export function getMaxBudgetApproval(token: ParsedSessionToken): number {
  return token.maxBudgetApproval;
}

/**
 * Check if user is a freelancer
 */
export function isFreelancer(token: ParsedSessionToken): boolean {
  return token.userType === UserType.FREELANCER;
}

/**
 * Check if user is a vendor company
 */
export function isVendorCompany(token: ParsedSessionToken): boolean {
  return token.userType === UserType.VENDOR_COMPANY;
}

/**
 * Check if user is a customer organization
 */
export function isCustomerOrganization(token: ParsedSessionToken): boolean {
  return token.userType === UserType.CUSTOMER_ORGANIZATION;
}

/**
 * Check if feature flag is enabled for user
 */
export function isFeatureEnabled(token: ParsedSessionToken, featureName: string): boolean {
  return token.featureFlags[featureName] === true;
}

/**
 * Get user preference value
 */
export function getUserPreference<T>(token: ParsedSessionToken, key: string, defaultValue: T): T {
  return token.preferences[key] ?? defaultValue;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(token: ParsedSessionToken): boolean {
  return new Date() > token.expiresAt;
}

/**
 * Check if user account is active
 */
export function isUserActive(token: ParsedSessionToken): boolean {
  return token.userStatus === 'active';
}

/**
 * Validate that required onboarding data is present
 */
export function validateOnboardingData(token: ParsedSessionToken): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!token.userType) {
    missingFields.push('user_type');
  }

  if (!token.email || !token.emailVerified) {
    missingFields.push('verified_email');
  }

  if (!token.name.trim()) {
    missingFields.push('name');
  }

  // Add type-specific validation
  if (token.userType === UserType.FREELANCER) {
    if (!token.freelancerVerified) {
      missingFields.push('freelancer_verification');
    }
  } else if (token.userType === UserType.VENDOR_COMPANY || token.userType === UserType.CUSTOMER_ORGANIZATION) {
    if (!token.organizationId) {
      missingFields.push('organization_id');
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Export types for external use
 */
export type { CustomSessionClaims, ParsedSessionToken };