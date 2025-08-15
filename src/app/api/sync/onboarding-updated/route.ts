import { NextRequest, NextResponse } from 'next/server';
import { syncOrganizationFromOnboarding } from '@/lib/firebase/sync-utilities';

/**
 * POST /api/sync/onboarding-updated
 * Webhook/trigger endpoint called when onboarding is updated
 * Automatically syncs the corresponding organization record
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 });
    }

    // Perform automatic reverse sync
    const syncResult = await syncOrganizationFromOnboarding(userId);

    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        error: syncResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Organization automatically synced with onboarding changes',
      data: syncResult
    });

  } catch (error) {
    console.error('Auto-sync onboarding update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';