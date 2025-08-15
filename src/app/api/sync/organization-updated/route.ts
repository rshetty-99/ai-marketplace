import { NextRequest, NextResponse } from 'next/server';
import { syncOnboardingFromOrganization } from '@/lib/firebase/sync-utilities';

/**
 * POST /api/sync/organization-updated
 * Webhook/trigger endpoint called when an organization is updated
 * Automatically syncs the corresponding onboarding record
 */
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await req.json();

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'organizationId is required'
      }, { status: 400 });
    }

    // Perform automatic sync
    const syncResult = await syncOnboardingFromOrganization(organizationId);

    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        error: syncResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding automatically synced with organization changes',
      data: syncResult
    });

  } catch (error) {
    console.error('Auto-sync organization update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';