import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';
import { getDefaultRole } from '@/lib/firebase/rbac-schema';

/**
 * POST /api/test/freelancer-user
 * Test Clerk webhook for specific freelancer user (rshetty99@gmail.com)
 */
export async function POST(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Simulate the specific user from Clerk
    const mockClerkEvent = {
      type: 'user.created',
      data: {
        id: `user_freelancer_rajesh_${Date.now()}`,
        email_addresses: [
          {
            email_address: 'rshetty99@gmail.com',
            verification: { status: 'verified' }
          }
        ],
        first_name: 'Rajesh',
        last_name: 'rshetty99',
        username: 'rajesh_rshetty99',
        image_url: 'https://lh3.googleusercontent.com/a/default-user',
        created_at: Date.now(),
        updated_at: Date.now(),
        external_accounts: [
          {
            provider: 'google',
            email_address: 'rshetty99@gmail.com'
          }
        ]
      }
    };

    const userId = mockClerkEvent.data.id;
    
    // Determine user type (freelancer since no organization)
    const userType = 'freelancer';
    const defaultRole = getDefaultRole(userType, true); // First user gets default role

    // Create user document with role information
    const userDoc = {
      id: userId,
      email: mockClerkEvent.data.email_addresses[0].email_address,
      name: `${mockClerkEvent.data.first_name} ${mockClerkEvent.data.last_name}`,
      firstName: mockClerkEvent.data.first_name,
      lastName: mockClerkEvent.data.last_name,
      username: mockClerkEvent.data.username,
      avatar: mockClerkEvent.data.image_url,
      
      // Role and permissions
      userType: userType,
      roles: [defaultRole],
      primaryRole: defaultRole,
      
      // Organization info
      organizationId: null,
      organizationRole: null,
      
      // User status
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Authentication metadata
      metadata: {
        clerkUserId: userId,
        clerkCreatedAt: new Date(mockClerkEvent.data.created_at),
        clerkUpdatedAt: new Date(mockClerkEvent.data.updated_at),
        emailVerified: mockClerkEvent.data.email_addresses[0].verification.status === 'verified',
        phoneVerified: false,
        provider: 'google',
        externalAccountEmail: 'rshetty99@gmail.com'
      },
      
      // Onboarding and session metadata
      onboarding_status: 'not_started',
      onboarding_completed: false,
      onboarding_current_step: 0,
      user_status: 'active',
      freelancer_verified: false,
      api_access_level: 'basic',
      
      // Freelancer specific fields
      profile: {
        bio: null,
        skills: [],
        hourlyRate: null,
        availability: 'available',
        portfolioUrl: null,
        linkedinUrl: null,
        githubUrl: null
      },
      
      // Settings
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        theme: 'system'
      }
    };

    await adminDb.collection('users').doc(userId).set(userDoc);

    // Create onboarding record specific to freelancer
    const onboardingDoc = {
      userId,
      userType: userType,
      status: 'not_started',
      currentStep: 0,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Freelancer onboarding specific data
      onboardingData: {
        profileCompleted: false,
        skillsAdded: false,
        portfolioUploaded: false,
        rateSet: false,
        verificationSubmitted: false
      }
    };

    await adminDb.collection('onboarding').doc(userId).set(onboardingDoc);

    // Create freelancer profile document
    const freelancerProfile = {
      userId,
      email: userDoc.email,
      name: userDoc.name,
      role: defaultRole,
      
      // Professional info
      title: null,
      bio: null,
      skills: [],
      experience: null,
      hourlyRate: null,
      
      // Availability
      availability: 'available',
      timezone: null,
      workingHours: null,
      
      // Portfolio
      portfolio: {
        projects: [],
        testimonials: [],
        certifications: []
      },
      
      // Social links
      links: {
        website: null,
        linkedin: null,
        github: null,
        twitter: null
      },
      
      // Stats
      stats: {
        totalProjects: 0,
        completedProjects: 0,
        rating: 0,
        reviewCount: 0,
        responseTime: null
      },
      
      // Verification status
      verification: {
        identity: false,
        email: true, // Already verified through Google
        phone: false,
        portfolio: false,
        skills: false
      },
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('freelancers').doc(userId).set(freelancerProfile);

    return NextResponse.json({
      success: true,
      message: 'Freelancer user created successfully with role data',
      data: {
        userId,
        mockClerkEvent,
        userDocument: userDoc,
        onboardingDocument: onboardingDoc,
        freelancerProfile,
        roleInfo: {
          userType,
          defaultRole,
          roles: [defaultRole],
          primaryRole: defaultRole
        }
      }
    });

  } catch (error) {
    console.error('Freelancer user test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/test/freelancer-user
 * Get freelancer user data to examine structure
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get freelancer users
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'rshetty99@gmail.com')
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get corresponding freelancer profiles
    const freelancerProfiles = [];
    const onboardingRecords = [];
    
    for (const user of users) {
      // Get freelancer profile
      const freelancerDoc = await adminDb.collection('freelancers').doc(user.id).get();
      if (freelancerDoc.exists) {
        freelancerProfiles.push({
          id: freelancerDoc.id,
          ...freelancerDoc.data()
        });
      }
      
      // Get onboarding record
      const onboardingDoc = await adminDb.collection('onboarding').doc(user.id).get();
      if (onboardingDoc.exists) {
        onboardingRecords.push({
          id: onboardingDoc.id,
          ...onboardingDoc.data()
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        freelancerProfiles,
        onboardingRecords,
        counts: {
          totalUsers: users.length,
          freelancerProfiles: freelancerProfiles.length,
          onboardingRecords: onboardingRecords.length
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch freelancer user data:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';