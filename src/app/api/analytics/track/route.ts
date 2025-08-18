/**
 * Analytics Tracking API Route
 * Handles analytics events from beacon API
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProfileAnalyticsService } from '@/lib/analytics/profile-analytics-service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.profileId || !data.eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Track the event
    await ProfileAnalyticsService.trackEvent(
      data.profileId,
      data.eventType,
      data.metadata
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// Support beacon API which uses POST with text/plain
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}