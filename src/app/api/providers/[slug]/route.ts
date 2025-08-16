import { NextRequest, NextResponse } from 'next/server';
import { getProviderBySlug } from '@/lib/api/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Provider slug is required' },
        { status: 400 }
      );
    }
    
    // Get provider by slug
    const provider = await getProviderBySlug(slug);
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }
    
    // Return provider data with caching headers
    return NextResponse.json(provider, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Provider detail API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get provider details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}