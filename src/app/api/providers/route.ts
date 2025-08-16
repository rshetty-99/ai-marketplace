import { NextRequest, NextResponse } from 'next/server';
import { searchProviders, generateProviderFilterCounts, ProviderFilters, ProviderSortOptions } from '@/lib/api/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: ProviderFilters = {};
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }
    
    if (searchParams.get('expertise')) {
      filters.expertise = searchParams.get('expertise')!.split(',');
    }
    
    if (searchParams.get('industries')) {
      filters.industries = searchParams.get('industries')!.split(',');
    }
    
    if (searchParams.get('location')) {
      filters.location = searchParams.get('location')!;
    }
    
    if (searchParams.get('certification')) {
      filters.certification = searchParams.get('certification')!.split(',');
    }
    
    if (searchParams.get('companySize')) {
      filters.companySize = searchParams.get('companySize') as any;
    }
    
    if (searchParams.get('rating')) {
      filters.rating = parseFloat(searchParams.get('rating')!);
    }
    
    if (searchParams.get('verified')) {
      filters.verified = searchParams.get('verified') === 'true';
    }
    
    if (searchParams.get('available')) {
      filters.available = searchParams.get('available') === 'true';
    }
    
    if (searchParams.get('technologies')) {
      filters.technologies = searchParams.get('technologies')!.split(',');
    }
    
    if (searchParams.get('languages')) {
      filters.languages = searchParams.get('languages')!.split(',');
    }
    
    // Parse pricing filters
    if (searchParams.get('pricingModel')) {
      filters.pricing = { model: searchParams.get('pricingModel') as any };
    }
    
    if (searchParams.get('minPrice')) {
      if (!filters.pricing) filters.pricing = {};
      filters.pricing.min = parseFloat(searchParams.get('minPrice')!);
    }
    
    if (searchParams.get('maxPrice')) {
      if (!filters.pricing) filters.pricing = {};
      filters.pricing.max = parseFloat(searchParams.get('maxPrice')!);
    }
    
    // Parse sorting options
    const sortOptions: ProviderSortOptions = {
      field: (searchParams.get('sortBy') as any) || 'relevance',
      direction: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    
    // Execute search
    const result = await searchProviders(filters, sortOptions, page, limit);
    
    // Return results with proper headers
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Provider search API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search providers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters = {}, sortOptions = { field: 'relevance', direction: 'desc' }, page = 1, limit = 24 } = body;
    
    // Execute search with more complex filters from POST body
    const result = await searchProviders(filters, sortOptions, page, limit);
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Provider search POST API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search providers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}