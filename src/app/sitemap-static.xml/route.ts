/**
 * Static Pages Sitemap Route
 * Returns XML sitemap for static pages
 */

import { NextResponse } from 'next/server';
import { SitemapGenerator } from '@/lib/seo/sitemap-generator';

export async function GET() {
  try {
    const entries = SitemapGenerator.generateStaticSitemap();
    const xml = SitemapGenerator.generateSitemapXML(entries);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error generating static sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}