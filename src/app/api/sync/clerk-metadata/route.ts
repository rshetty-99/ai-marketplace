import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * POST /api/sync/clerk-metadata
 * Sync Firebase user data to Clerk metadata for proper dashboard display
 */
export async function POST(req: NextRequest) {
  try {
    const { userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'userEmail is required'
      }, { status: 400 });
    }

    const adminDb = await getAdminDb();
    
    // Get user data from Firebase
    const userSnapshot = await adminDb
      .collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: `User not found in Firebase: ${userEmail}`
      }, { status: 404 });
    }

    const userData = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;

    // Get Clerk user
    const client = clerkClient();
    let clerkUser;
    
    try {
      // Try to find Clerk user by email
      const clerkUsers = await client.users.getUserList({
        emailAddress: [userEmail]
      });
      
      if (clerkUsers.data.length === 0) {
        return NextResponse.json({
          success: false,
          error: `User not found in Clerk: ${userEmail}`
        }, { status: 404 });
      }
      
      clerkUser = clerkUsers.data[0];
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch Clerk user: ${(error as Error).message}`
      }, { status: 500 });
    }

    // Prepare metadata for Clerk
    const publicMetadata = {
      user_type: userData.userType,
      primary_role: userData.primaryRole,
      roles: JSON.stringify(userData.roles || []),
      permissions: JSON.stringify(userData.permissions || []),
      onboarding_status: userData.onboarding_status,
      onboarding_completed: userData.onboarding_completed,
      onboarding_current_step: userData.onboarding_current_step || 0,
      user_status: userData.user_status,
      freelancer_verified: userData.freelancer_verified,
      api_access_level: userData.api_access_level,
      firebase_user_id: userId,
      synced_at: new Date().toISOString()
    };

    // Add organization data if present
    if (userData.organizationId) {
      Object.assign(publicMetadata, {
        organization_id: userData.organizationId,
        organization_name: userData.organizationName,
        organization_role: userData.organizationRole,
        organization_type: userData.organizationType
      });
    }

    // Update Clerk user metadata
    await client.users.updateUserMetadata(clerkUser.id, {
      publicMetadata
    });

    return NextResponse.json({
      success: true,
      message: 'Clerk metadata synced successfully',
      data: {
        clerkUserId: clerkUser.id,
        email: userEmail,
        firebaseUserId: userId,
        userType: userData.userType,
        primaryRole: userData.primaryRole,
        syncedMetadata: publicMetadata
      }
    });

  } catch (error) {
    console.error('Clerk metadata sync failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/sync/clerk-metadata?email=xxx
 * Check current Clerk metadata for a user
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'email parameter is required'
      }, { status: 400 });
    }

    const client = clerkClient();
    
    // Get Clerk user
    const clerkUsers = await client.users.getUserList({
      emailAddress: [userEmail]
    });
    
    if (clerkUsers.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: `User not found in Clerk: ${userEmail}`
      }, { status: 404 });
    }
    
    const clerkUser = clerkUsers.data[0];

    // Get Firebase user for comparison
    const adminDb = await getAdminDb();
    const userSnapshot = await adminDb
      .collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    const firebaseUser = userSnapshot.empty ? null : {
      id: userSnapshot.docs[0].id,
      ...userSnapshot.docs[0].data()
    };

    return NextResponse.json({
      success: true,
      data: {
        clerkUser: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          publicMetadata: clerkUser.publicMetadata,
          hasMetadata: Object.keys(clerkUser.publicMetadata).length > 0
        },
        firebaseUser: firebaseUser ? {
          id: firebaseUser.id,
          userType: firebaseUser.userType,
          primaryRole: firebaseUser.primaryRole,
          roles: firebaseUser.roles,
          onboardingStatus: firebaseUser.onboarding_status
        } : null,
        syncNeeded: !clerkUser.publicMetadata.primary_role || 
                   !clerkUser.publicMetadata.user_type ||
                   !clerkUser.publicMetadata.synced_at
      }
    });

  } catch (error) {
    console.error('Failed to check Clerk metadata:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';