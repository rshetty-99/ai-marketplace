import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedProviders } from '@/lib/api/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    
    // Get featured providers
    const providers = await getFeaturedProviders(limit);
    
    return NextResponse.json(providers, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Featured providers API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get featured providers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}