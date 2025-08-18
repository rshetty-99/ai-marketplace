/**
 * Slug Suggestions API Route
 * Generates alternative slug suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { SlugService } from '@/lib/profile/slug-service';

interface SuggestionsRequest {
  baseSlug: string;
  count?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SuggestionsRequest = await request.json();
    
    if (!body.baseSlug || typeof body.baseSlug !== 'string') {
      return NextResponse.json(
        { error: 'Base slug is required' },
        { status: 400 }
      );
    }

    const count = Math.min(body.count || 5, 20); // Limit to max 20 suggestions
    const suggestions = await SlugService.generateSuggestions(body.baseSlug, count);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Error generating slug suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseSlug = searchParams.get('baseSlug');
    const count = parseInt(searchParams.get('count') || '5');

    if (!baseSlug) {
      return NextResponse.json(
        { error: 'baseSlug parameter is required' },
        { status: 400 }
      );
    }

    const limitedCount = Math.min(count, 20);
    const suggestions = await SlugService.generateSuggestions(baseSlug, limitedCount);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Error generating slug suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}