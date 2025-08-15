// API route for updating user metadata on the server side
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { UserMetadataUpdate, validateMetadataForJWT } from '@/lib/auth/metadata-sync';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, updates } = body as {
      userId: string;
      updates: UserMetadataUpdate;
    };

    // Verify the user is updating their own metadata or has permission
    if (userId !== clerkUserId) {
      // Here you would check if the current user has permission to update other users
      // For now, only allow self-updates
      return NextResponse.json(
        { error: 'Forbidden: Can only update own metadata' },
        { status: 403 }
      );
    }

    // Validate metadata for JWT compatibility
    const validation = validateMetadataForJWT(updates);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid metadata',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Get current user
    const user = await clerkClient.users.getUser(userId);
    
    // Merge with existing metadata
    const updatedMetadata = {
      ...user.publicMetadata,
      ...updates
    };

    // Update user metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });

    return NextResponse.json({
      success: true,
      estimatedJWTSize: validation.estimatedSize
    });

  } catch (error) {
    console.error('Error updating user metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current metadata
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId') || clerkUserId;

    // Verify permission to read metadata
    if (targetUserId !== clerkUserId) {
      // Here you would check if the current user has permission to read other users
      return NextResponse.json(
        { error: 'Forbidden: Can only read own metadata' },
        { status: 403 }
      );
    }

    const user = await clerkClient.users.getUser(targetUserId);
    
    return NextResponse.json({
      metadata: user.publicMetadata,
      privateMetadata: user.privateMetadata, // Only if user has permission
      emailAddresses: user.emailAddresses.map(email => ({
        emailAddress: email.emailAddress,
        verified: email.verification?.status === 'verified'
      })),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error('Error retrieving user metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint for partial metadata updates
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { field, value } = body as {
      field: keyof UserMetadataUpdate;
      value: any;
    };

    // Validate single field update
    const updates = { [field]: value } as UserMetadataUpdate;
    const validation = validateMetadataForJWT(updates);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid metadata field',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Get current user and update single field
    const user = await clerkClient.users.getUser(clerkUserId);
    
    const updatedMetadata = {
      ...user.publicMetadata,
      [field]: value
    };

    await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: updatedMetadata
    });

    return NextResponse.json({
      success: true,
      field,
      value,
      estimatedJWTSize: validation.estimatedSize
    });

  } catch (error) {
    console.error('Error updating metadata field:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}