import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';
import { getDefaultRole } from '@/lib/firebase/rbac-schema';

/**
 * POST /api/test/customer-user
 * Test Clerk webhook for specific customer user (alsmith141520@gmail.com)
 */
export async function POST(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Simulate the customer user creating an organization first
    const mockOrganizationId = `org_customer_alsmith_${Date.now()}`;
    const organizationName = "Smith Enterprises";
    
    // Simulate the specific customer user from Clerk
    const mockClerkEvent = {
      type: 'organizationMembership.created',
      data: {
        id: `orgmem_${Date.now()}`,
        organization: {
          id: mockOrganizationId,
          name: organizationName,
          slug: 'smith-enterprises'
        },
        public_user_data: {
          user_id: `user_customer_alan_${Date.now()}`,
          first_name: 'Alan',
          last_name: 'Smith',
          username: 'alsmith',
          image_url: 'https://lh3.googleusercontent.com/a/default-user'
        },
        role: 'admin', // Organization admin role in Clerk
        created_at: Date.now(),
        updated_at: Date.now()
      }
    };

    const userId = mockClerkEvent.data.public_user_data.user_id;
    const organizationId = mockClerkEvent.data.organization.id;
    
    // Determine user type (customer based on organization creation)
    const userType = 'customer';
    const isFirstUser = true; // Organization creator gets admin role
    const defaultRole = getDefaultRole(userType, isFirstUser);

    // Create organization document first
    const organizationDoc = {
      id: organizationId,
      name: organizationName,
      slug: 'smith-enterprises',
      type: 'customer', // Customer organization
      
      // Admin user (creator)
      createdBy: userId,
      adminUserId: userId,
      
      // Organization details
      description: null,
      industry: null,
      size: null,
      location: null,
      
      // Settings
      settings: {
        allowMemberInvites: true,
        requireApprovalForProjects: false,
        defaultProjectVisibility: 'organization'
      },
      
      // Billing
      billing: {
        plan: 'starter',
        status: 'active',
        trialEndsAt: null
      },
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('organizations').doc(organizationId).set(organizationDoc);

    // Create user document with customer role information
    const userDoc = {
      id: userId,
      email: 'alsmith141520@gmail.com',
      name: 'Alan Smith',
      firstName: 'Alan',
      lastName: 'Smith',
      username: 'alsmith',
      avatar: mockClerkEvent.data.public_user_data.image_url,
      
      // Role and permissions (Customer Admin)
      userType: userType,
      roles: [defaultRole],
      primaryRole: defaultRole,
      
      // Organization info
      organizationId: organizationId,
      organizationName: organizationName,
      organizationRole: 'admin', // Clerk organization role
      organizationType: 'customer',
      
      // User status
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Authentication metadata
      metadata: {
        clerkUserId: userId,
        clerkOrganizationId: organizationId,
        clerkCreatedAt: new Date(mockClerkEvent.data.created_at),
        clerkUpdatedAt: new Date(mockClerkEvent.data.updated_at),
        emailVerified: true,
        phoneVerified: false,
        provider: 'clerk',
        isOrganizationAdmin: true
      },
      
      // Onboarding and session metadata
      onboarding_status: 'not_started',
      onboarding_completed: false,
      onboarding_current_step: 0,
      user_status: 'active',
      api_access_level: 'standard',
      
      // Customer specific fields
      profile: {
        title: null,
        department: null,
        bio: null,
        phoneNumber: null
      },
      
      // Settings
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: true,
        theme: 'system'
      }
    };

    await adminDb.collection('users').doc(userId).set(userDoc);

    // Create onboarding record specific to customer
    const onboardingDoc = {
      userId,
      userType: userType,
      organizationId: organizationId,
      status: 'not_started',
      currentStep: 0,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Customer onboarding specific data
      onboardingData: {
        organizationSetup: true, // Already done by creating org
        teamMembersInvited: false,
        firstProjectCreated: false,
        billingConfigured: false,
        profileCompleted: false
      }
    };

    await adminDb.collection('onboarding').doc(userId).set(onboardingDoc);

    // Create customer organization membership record
    const membershipDoc = {
      userId,
      organizationId,
      organizationName,
      userEmail: userDoc.email,
      userName: userDoc.name,
      
      // Role information
      role: defaultRole, // Internal marketplace role
      clerkRole: 'admin', // Clerk organization role
      
      // Permissions within organization
      permissions: {
        canInviteMembers: true,
        canManageProjects: true,
        canViewBilling: true,
        canManageBilling: true,
        canManageSettings: true
      },
      
      // Status
      status: 'active',
      joinedAt: new Date(),
      invitedBy: null, // Self-created
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('organizationMemberships').doc(`${organizationId}_${userId}`).set(membershipDoc);

    return NextResponse.json({
      success: true,
      message: 'Customer user created successfully with organization and role data',
      data: {
        userId,
        organizationId,
        mockClerkEvent,
        organizationDocument: organizationDoc,
        userDocument: userDoc,
        onboardingDocument: onboardingDoc,
        membershipDocument: membershipDoc,
        roleInfo: {
          userType,
          defaultRole,
          roles: [defaultRole],
          primaryRole: defaultRole,
          organizationRole: 'admin',
          organizationType: 'customer'
        }
      }
    });

  } catch (error) {
    console.error('Customer user test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/test/customer-user
 * Get customer user data to examine structure
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get customer users
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'alsmith141520@gmail.com')
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get organizations, onboarding records, and memberships
    const organizations = [];
    const onboardingRecords = [];
    const memberships = [];
    
    for (const user of users) {
      // Get organization
      if (user.organizationId) {
        const orgDoc = await adminDb.collection('organizations').doc(user.organizationId).get();
        if (orgDoc.exists) {
          organizations.push({
            id: orgDoc.id,
            ...orgDoc.data()
          });
        }
      }
      
      // Get onboarding record
      const onboardingDoc = await adminDb.collection('onboarding').doc(user.id).get();
      if (onboardingDoc.exists) {
        onboardingRecords.push({
          id: onboardingDoc.id,
          ...onboardingDoc.data()
        });
      }
      
      // Get membership records
      const membershipSnapshot = await adminDb
        .collection('organizationMemberships')
        .where('userId', '==', user.id)
        .get();
      
      membershipSnapshot.docs.forEach(doc => {
        memberships.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        organizations,
        onboardingRecords,
        memberships,
        counts: {
          totalUsers: users.length,
          organizations: organizations.length,
          onboardingRecords: onboardingRecords.length,
          memberships: memberships.length
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch customer user data:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';