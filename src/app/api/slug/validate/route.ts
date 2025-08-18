/**
 * Slug Validation API Route
 * Provides real-time slug validation and availability checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { SlugService } from '@/lib/profile/slug-service';

interface ValidateSlugRequest {
  slug: string;
  excludeUserId?: string;
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

    const body: ValidateSlugRequest = await request.json();
    
    if (!body.slug || typeof body.slug !== 'string') {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    const result = await SlugService.validateAndCheck(
      body.slug,
      body.excludeUserId || userId
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error validating slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const excludeUserId = searchParams.get('excludeUserId');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const result = await SlugService.validateAndCheck(slug, excludeUserId || undefined);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error validating slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}