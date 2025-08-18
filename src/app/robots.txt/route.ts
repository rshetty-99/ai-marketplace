/**
 * Robots.txt Route
 * Returns robots.txt content
 */

import { NextResponse } from 'next/server';
import { SitemapGenerator } from '@/lib/seo/sitemap-generator';

export async function GET() {
  try {
    const robotsTxt = SitemapGenerator.generateRobotsTxt();

    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    return new NextResponse('Error generating robots.txt', { status: 500 });
  }
}