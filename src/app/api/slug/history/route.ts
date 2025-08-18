/**
 * Slug History API Route
 * Retrieves slug history for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { SlugService } from '@/lib/profile/slug-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || userId;

    // Only allow users to see their own history unless they're admin
    // Add admin check here if needed
    if (targetUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const history = await SlugService.getSlugHistory(targetUserId);

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Error fetching slug history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}