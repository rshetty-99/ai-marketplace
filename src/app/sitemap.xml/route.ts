/**
 * Main Sitemap Index Route
 * Returns sitemap index XML
 */

import { NextResponse } from 'next/server';
import { SitemapGenerator } from '@/lib/seo/sitemap-generator';

export async function GET() {
  try {
    const sitemapIndex = await SitemapGenerator.generateSitemapIndex();
    const xml = SitemapGenerator.generateSitemapIndexXML(sitemapIndex);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}