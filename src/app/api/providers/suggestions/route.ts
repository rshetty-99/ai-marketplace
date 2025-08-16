import { NextRequest, NextResponse } from 'next/server';
import { getProviderSearchSuggestions } from '@/lib/api/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (query.length < 2) {
      return NextResponse.json({
        providers: [],
        expertise: [],
        industries: []
      });
    }
    
    // Get search suggestions
    const suggestions = await getProviderSearchSuggestions(query, limit);
    
    return NextResponse.json(suggestions, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Provider suggestions API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get provider suggestions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}