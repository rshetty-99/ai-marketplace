/**
 * Slug Reservation API Route
 * Handles slug reservation and updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { SlugService } from '@/lib/profile/slug-service';

interface ReserveSlugRequest {
  slug: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  collectionName: string;
  isUpdate?: boolean;
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

    const body: ReserveSlugRequest = await request.json();
    
    // Validate required fields
    if (!body.slug || typeof body.slug !== 'string') {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!body.userType || !['freelancer', 'vendor', 'organization'].includes(body.userType)) {
      return NextResponse.json(
        { error: 'Valid userType is required (freelancer, vendor, organization)' },
        { status: 400 }
      );
    }

    if (!body.collectionName || typeof body.collectionName !== 'string') {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    // Validate slug format first
    const validation = SlugService.validateSlug(body.slug);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.errors?.[0] || 'Invalid slug format'
      });
    }

    // Check availability
    const isAvailable = await SlugService.checkAvailability(body.slug, userId);
    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        error: 'Slug is not available'
      });
    }

    // Reserve or update the slug
    const result = body.isUpdate 
      ? await SlugService.updateSlug(userId, body.userType, body.slug, body.collectionName)
      : await SlugService.reserveSlug(userId, body.userType, body.slug, body.collectionName);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error reserving slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Alias for update operation
  try {
    const body = await request.json();
    body.isUpdate = true;
    
    // Re-process as POST with update flag
    const response = await POST(request);
    return response;
  } catch (error) {
    console.error('Error updating slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}