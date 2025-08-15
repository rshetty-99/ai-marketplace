/**
 * Session Token Test API Route
 * 
 * This endpoint helps test and debug custom session token implementation.
 * It returns both raw session claims and parsed token data for inspection.
 * 
 * GET /api/test/session-token
 * 
 * Usage:
 * - Access while authenticated to see your current session token
 * - Use for debugging permission issues
 * - Verify onboarding status and user type
 * - Check feature flags and organization membership
 */

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { parseSessionToken, validateOnboardingData } from '@/lib/auth/session-tokens';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims, sessionId } = await auth();
    
    if (!userId || !sessionClaims) {
      return createErrorResponse('Not authenticated', 401);
    }

    // Parse the session token
    let parsedToken;
    let parseError;
    
    try {
      parsedToken = parseSessionToken(sessionClaims as any);
    } catch (error) {
      parseError = (error as Error).message;
      logger.error('Failed to parse session token in test endpoint', error as Error, { userId });
    }

    // Validate onboarding data if token parsed successfully
    let validationResult;
    if (parsedToken) {
      validationResult = validateOnboardingData(parsedToken);
    }

    // Get URL to test various checks
    const baseUrl = new URL(req.url).origin;

    const response = {
      meta: {
        timestamp: new Date().toISOString(),
        userId,
        sessionId,
        endpoint: '/api/test/session-token'
      },
      authentication: {
        isAuthenticated: true,
        hasSessionClaims: !!sessionClaims,
        canParseToken: !!parsedToken,
        parseError
      },
      rawSessionClaims: sessionClaims,
      parsedToken,
      validation: validationResult,
      capabilities: parsedToken ? {
        userType: parsedToken.userType,
        onboardingComplete: parsedToken.onboardingCompleted,
        needsOnboarding: !parsedToken.onboardingCompleted,
        hasOrganization: !!parsedToken.organizationId,
        isFreelancer: parsedToken.userType === 'freelancer',
        isVendorCompany: parsedToken.userType === 'vendor_company',
        isCustomerOrganization: parsedToken.userType === 'customer_organization',
        permissionCount: parsedToken.permissions?.length || 0,
        roleCount: parsedToken.roles?.length || 0,
        featureFlagCount: Object.keys(parsedToken.featureFlags || {}).length,
        isActive: parsedToken.userStatus === 'active'
      } : null,
      permissions: parsedToken?.permissions || [],
      roles: parsedToken?.roles?.map(role => ({
        name: role.name,
        type: role.type,
        permissionCount: role.permissions?.length || 0,
        tier: role.tier
      })) || [],
      featureFlags: parsedToken?.featureFlags || {},
      organization: parsedToken?.organization || null,
      testUrls: {
        dashboard: `${baseUrl}/dashboard`,
        onboarding: `${baseUrl}/onboarding`,
        profile: `${baseUrl}/profile`,
        admin: `${baseUrl}/admin`
      },
      troubleshooting: {
        commonIssues: [
          {
            issue: "Session token not updating",
            solution: "Sign out and back in to refresh token"
          },
          {
            issue: "Missing permissions",
            solution: "Check user roles in Firestore and run webhook sync"
          },
          {
            issue: "Onboarding redirect not working",
            solution: "Verify onboarding status and middleware configuration"
          },
          {
            issue: "Organization data missing",
            solution: "Check Clerk organization membership and webhook events"
          }
        ],
        nextSteps: parseError ? [
          "1. Check session token template in Clerk dashboard",
          "2. Verify user metadata exists in Clerk publicMetadata",
          "3. Run user sync script to update session claims",
          "4. Check webhook logs for sync errors"
        ] : [
          "1. Verify permissions match expected roles",
          "2. Test protected routes and middleware",
          "3. Check onboarding flow redirects",
          "4. Validate feature flags and organization data"
        ]
      }
    };

    // Log the test request for debugging
    logger.info('Session token test endpoint accessed', {
      userId,
      canParseToken: !!parsedToken,
      userType: parsedToken?.userType,
      onboardingStatus: parsedToken?.onboardingStatus,
      organizationId: parsedToken?.organizationId,
      permissionCount: parsedToken?.permissions?.length || 0
    });

    return createSuccessResponse(response);

  } catch (error) {
    logger.error('Session token test endpoint error', error as Error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Also support POST for testing with request body
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testType } = body;

    const { userId, sessionClaims } = await auth();
    
    if (!userId || !sessionClaims) {
      return createErrorResponse('Not authenticated', 401);
    }

    const parsedToken = parseSessionToken(sessionClaims as any);

    let testResult;

    switch (testType) {
      case 'permissions':
        testResult = {
          type: 'permissions',
          hasCreateProject: parsedToken.permissions.includes('create_project' as any),
          hasManageTeam: parsedToken.permissions.includes('manage_team' as any),
          hasPlatformAdmin: parsedToken.permissions.includes('platform_admin' as any),
          allPermissions: parsedToken.permissions
        };
        break;

      case 'onboarding':
        testResult = {
          type: 'onboarding',
          status: parsedToken.onboardingStatus,
          completed: parsedToken.onboardingCompleted,
          currentStep: parsedToken.onboardingCurrentStep,
          needsRedirect: !parsedToken.onboardingCompleted,
          redirectPath: parsedToken.onboardingCompleted ? '/dashboard' : `/onboarding?type=${parsedToken.userType}&step=${parsedToken.onboardingCurrentStep}`
        };
        break;

      case 'organization':
        testResult = {
          type: 'organization',
          hasOrganization: !!parsedToken.organizationId,
          organizationId: parsedToken.organizationId,
          organizationName: parsedToken.organizationName,
          role: parsedToken.organizationRole,
          canInviteUsers: parsedToken.canInviteUsers,
          maxBudgetApproval: parsedToken.maxBudgetApproval
        };
        break;

      case 'features':
        testResult = {
          type: 'features',
          flags: parsedToken.featureFlags,
          preferences: parsedToken.preferences,
          apiAccessLevel: parsedToken.apiAccessLevel,
          complianceStatus: parsedToken.complianceStatus
        };
        break;

      default:
        return createErrorResponse('Invalid test type. Use: permissions, onboarding, organization, or features', 400);
    }

    return createSuccessResponse({
      userId,
      testType,
      result: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Session token POST test error', error as Error);
    return createErrorResponse('Test failed', 500);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';