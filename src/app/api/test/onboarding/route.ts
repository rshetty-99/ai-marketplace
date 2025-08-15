import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';

/**
 * POST /api/test/onboarding
 * Test endpoint to create onboarding records
 */
export async function POST(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Test data
    const testUser = {
      id: `test_user_${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      userType: 'freelancer',
      createdAt: new Date(),
      roles: ['freelancer'],
      isActive: true,
      onboardingStatus: 'not_started'
    };

    // Create user document
    await adminDb.collection('users').doc(testUser.id).set(testUser);

    // Create onboarding document
    const onboardingData = {
      userId: testUser.id,
      userType: 'freelancer',
      status: 'not_started',
      currentStep: 0,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('onboarding').doc(testUser.id).set(onboardingData);

    return NextResponse.json({
      success: true,
      message: 'Test user and onboarding record created successfully',
      data: {
        userId: testUser.id,
        userDocument: testUser,
        onboardingDocument: onboardingData
      }
    });

  } catch (error) {
    console.error('Test onboarding creation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/test/onboarding
 * Test endpoint to read onboarding records
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get recent test users
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'test@example.com')
      .limit(5)
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get corresponding onboarding records
    const onboardingPromises = users.map(user => 
      adminDb.collection('onboarding').doc(user.id).get()
    );
    
    const onboardingSnapshots = await Promise.all(onboardingPromises);
    const onboardingRecords = onboardingSnapshots.map(doc => ({
      id: doc.id,
      exists: doc.exists,
      data: doc.exists ? doc.data() : null
    }));

    return NextResponse.json({
      success: true,
      data: {
        users,
        onboardingRecords,
        totalUsers: users.length
      }
    });

  } catch (error) {
    console.error('Test onboarding read failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';