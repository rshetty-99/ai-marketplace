import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';

/**
 * POST /api/test/clerk-webhook
 * Simulate a Clerk webhook event to test the user creation flow
 */
export async function POST(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Simulate a user.created webhook payload
    const mockClerkEvent = {
      type: 'user.created',
      data: {
        id: `user_test_${Date.now()}`,
        email_addresses: [
          {
            email_address: 'webhook-test@example.com',
            verification: { status: 'verified' }
          }
        ],
        first_name: 'Webhook',
        last_name: 'Test',
        username: 'webhook_test',
        image_url: 'https://example.com/avatar.jpg',
        created_at: Date.now(),
        updated_at: Date.now()
      }
    };

    // Simulate the user creation process that would happen in the webhook
    const userId = mockClerkEvent.data.id;
    
    // Create user document (similar to webhook handler)
    const userDoc = {
      id: userId,
      email: mockClerkEvent.data.email_addresses[0].email_address,
      name: `${mockClerkEvent.data.first_name} ${mockClerkEvent.data.last_name}`,
      avatar: mockClerkEvent.data.image_url,
      roles: [], // Default empty roles
      organizationId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        clerkCreatedAt: new Date(mockClerkEvent.data.created_at),
        clerkUpdatedAt: new Date(mockClerkEvent.data.updated_at),
        emailVerified: mockClerkEvent.data.email_addresses[0].verification.status === 'verified',
        phoneVerified: false
      },
      // Session metadata initialization
      onboarding_status: 'not_started',
      onboarding_completed: false,
      onboarding_current_step: 0,
      user_status: 'active',
      freelancer_verified: false,
      api_access_level: 'basic'
    };

    await adminDb.collection('users').doc(userId).set(userDoc);

    // Create initial onboarding record
    const onboardingDoc = {
      userId,
      userType: null, // Not yet determined
      status: 'not_started',
      currentStep: 0,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('onboarding').doc(userId).set(onboardingDoc);

    return NextResponse.json({
      success: true,
      message: 'Mock Clerk webhook processed successfully',
      data: {
        event: mockClerkEvent,
        userDocument: userDoc,
        onboardingDocument: onboardingDoc,
        simulatedWebhookType: 'user.created'
      }
    });

  } catch (error) {
    console.error('Mock Clerk webhook processing failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/test/clerk-webhook
 * Get all webhook-created test users
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get all webhook test users
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'webhook-test@example.com')
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: {
        webhookTestUsers: users,
        count: users.length
      }
    });

  } catch (error) {
    console.error('Failed to fetch webhook test users:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';