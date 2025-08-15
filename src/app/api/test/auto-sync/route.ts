import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';
import { triggerOrganizationSync, triggerOnboardingSync } from '@/lib/firebase/auto-sync-helpers';

/**
 * POST /api/test/auto-sync
 * Test automatic synchronization system
 */
export async function POST(req: NextRequest) {
  try {
    const { testType = 'organization' } = await req.json();
    
    const adminDb = await getAdminDb();
    
    if (testType === 'organization') {
      // Test: Update TechSamurai organization and trigger auto-sync
      const orgSnapshot = await adminDb
        .collection('organizations')
        .where('name', '==', 'TechSamurai')
        .limit(1)
        .get();

      if (orgSnapshot.empty) {
        return NextResponse.json({
          success: false,
          error: 'TechSamurai organization not found'
        }, { status: 404 });
      }

      const orgDoc = orgSnapshot.docs[0];
      const orgId = orgDoc.id;
      const currentData = orgDoc.data();

      // Make a test update to the organization
      const testUpdate = {
        description: currentData.description + ' [Auto-sync test update]',
        metadata: {
          ...currentData.metadata,
          testUpdate: true,
          testUpdatedAt: new Date()
        },
        updatedAt: new Date()
      };

      await adminDb.collection('organizations').doc(orgId).update(testUpdate);
      
      // Trigger automatic sync
      await triggerOrganizationSync(orgId);

      return NextResponse.json({
        success: true,
        message: 'Organization updated and auto-sync triggered',
        data: {
          organizationId: orgId,
          testType: 'organization_update',
          syncTriggered: true,
          updateApplied: testUpdate
        }
      });

    } else if (testType === 'onboarding') {
      // Test: Update onboarding and trigger reverse sync
      const userSnapshot = await adminDb
        .collection('users')
        .where('email', '==', 'rshetty@techsamur.ai')
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return NextResponse.json({
          success: false,
          error: 'TechSamurai user not found'
        }, { status: 404 });
      }

      const userDoc = userSnapshot.docs[0];
      const userId = userDoc.id;

      // Make a test update to onboarding
      const testUpdate = {
        metadata: {
          testUpdate: true,
          testUpdatedAt: new Date(),
          autoSyncTested: true
        },
        updatedAt: new Date()
      };

      await adminDb.collection('onboarding').doc(userId).update(testUpdate);
      
      // Trigger automatic reverse sync
      await triggerOnboardingSync(userId);

      return NextResponse.json({
        success: true,
        message: 'Onboarding updated and auto-sync triggered',
        data: {
          userId,
          testType: 'onboarding_update',
          syncTriggered: true,
          updateApplied: testUpdate
        }
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid testType. Use "organization" or "onboarding"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Auto-sync test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/test/auto-sync
 * Check if auto-sync is working by comparing timestamps
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get TechSamurai organization
    const orgSnapshot = await adminDb
      .collection('organizations')
      .where('name', '==', 'TechSamurai')
      .limit(1)
      .get();

    // Get corresponding user and onboarding
    const userSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'rshetty@techsamur.ai')
      .limit(1)
      .get();

    if (orgSnapshot.empty || userSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'Test data not found'
      }, { status: 404 });
    }

    const orgData = { id: orgSnapshot.docs[0].id, ...orgSnapshot.docs[0].data() };
    const userData = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };

    // Get onboarding record
    const onboardingDoc = await adminDb.collection('onboarding').doc(userData.id).get();
    const onboardingData = onboardingDoc.exists ? 
      { id: onboardingDoc.id, ...onboardingDoc.data() } : null;

    // Check sync status
    const syncStatus = {
      organizationLastUpdated: orgData.updatedAt,
      onboardingLastUpdated: onboardingData?.updatedAt,
      organizationHasTestUpdate: !!orgData.metadata?.testUpdate,
      onboardingHasTestUpdate: !!onboardingData?.metadata?.testUpdate,
      onboardingLastSynced: onboardingData?.metadata?.lastSyncedAt,
      organizationSyncStatus: orgData.metadata?.onboardingStatus,
      autoSyncEnabled: true,
      syncTimestampDiff: onboardingData?.metadata?.lastSyncedAt && orgData.updatedAt ?
        Math.abs(new Date(onboardingData.metadata.lastSyncedAt).getTime() - 
                new Date(orgData.updatedAt).getTime()) : null
    };

    return NextResponse.json({
      success: true,
      data: {
        organization: {
          id: orgData.id,
          name: orgData.name,
          updatedAt: orgData.updatedAt,
          hasTestUpdate: syncStatus.organizationHasTestUpdate,
          completeness: orgData.metadata?.completenessScore || 'unknown'
        },
        onboarding: {
          id: onboardingData?.id,
          status: onboardingData?.status,
          updatedAt: onboardingData?.updatedAt,
          hasTestUpdate: syncStatus.onboardingHasTestUpdate,
          progress: onboardingData?.progress?.percentageComplete,
          lastSynced: onboardingData?.metadata?.lastSyncedAt
        },
        syncStatus,
        isInSync: syncStatus.syncTimestampDiff ? syncStatus.syncTimestampDiff < 60000 : false // Within 1 minute
      }
    });

  } catch (error) {
    console.error('Failed to check auto-sync status:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';