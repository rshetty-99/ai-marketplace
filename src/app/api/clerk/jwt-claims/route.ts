import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';

/**
 * POST /api/clerk/jwt-claims
 * Webhook endpoint for Clerk JWT token generation
 * This endpoint is called by Clerk before issuing JWT tokens
 * We use it to add custom claims from our Firebase data
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId } = await req.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 });
    }

    const adminDb = await getAdminDb();
    
    // Find user in Firebase by Clerk user ID or email
    // First try to find by Clerk ID in metadata
    let userSnapshot = await adminDb
      .collection('users')
      .where('metadata.clerkUserId', '==', userId)
      .limit(1)
      .get();

    // If not found, we need to handle this differently
    if (userSnapshot.empty) {
      // For now, return minimal claims
      return NextResponse.json({
        uid: userId,
        user_type: 'freelancer',
        roles: ['freelancer'],
        permissions: [],
        onboarding_status: 'not_started',
        onboarding_completed: false
      });
    }

    const userData = userSnapshot.docs[0].data();
    const firebaseUserId = userSnapshot.docs[0].id;

    // Get additional data if user has organization
    let organizationData = null;
    if (userData.organizationId) {
      const orgDoc = await adminDb.collection('organizations').doc(userData.organizationId).get();
      if (orgDoc.exists) {
        organizationData = orgDoc.data();
      }
    }

    // Build JWT claims
    const claims = {
      // Core identity
      uid: firebaseUserId,
      email: userData.email,
      user_type: userData.userType || 'freelancer',
      
      // Roles and permissions
      roles: userData.roles || [userData.primaryRole || 'freelancer'],
      permissions: userData.permissions || [],
      primary_role: userData.primaryRole || userData.roles?.[0] || 'freelancer',
      
      // Onboarding status
      onboarding_status: userData.onboarding_status || 'not_started',
      onboarding_completed: userData.onboarding_completed || false,
      onboarding_current_step: userData.onboarding_current_step || 0,
      
      // User status
      user_status: userData.user_status || 'active',
      freelancer_verified: userData.freelancer_verified || false,
      api_access_level: userData.api_access_level || 'basic',
      
      // Organization data (if applicable)
      ...(organizationData && {
        organization_id: userData.organizationId,
        organization_name: userData.organizationName || organizationData.name,
        organization_role: userData.organizationRole,
        organization_type: userData.organizationType || organizationData.type
      }),
      
      // Metadata
      synced_at: new Date().toISOString(),
      source: 'firebase'
    };

    return NextResponse.json(claims);

  } catch (error) {
    console.error('JWT claims generation failed:', error);
    
    // Return minimal safe claims on error
    return NextResponse.json({
      uid: req.body?.userId || 'unknown',
      user_type: 'freelancer',
      roles: ['freelancer'],
      permissions: [],
      onboarding_status: 'not_started',
      onboarding_completed: false,
      error: 'Claims generation failed'
    });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';