/**
 * Profiles Sitemap Route
 * Returns XML sitemap for profile pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { SitemapGenerator } from '@/lib/seo/sitemap-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    
    const entries = await SitemapGenerator.generateProfilesSitemap(page);
    const xml = SitemapGenerator.generateSitemapXML(entries);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating profiles sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}