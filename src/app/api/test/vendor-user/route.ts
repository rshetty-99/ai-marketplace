import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';
import { getDefaultRole } from '@/lib/firebase/rbac-schema';

/**
 * POST /api/test/vendor-user
 * Test Clerk webhook for specific vendor user (rshetty@techsamur.ai)
 */
export async function POST(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Simulate the vendor user creating an organization first
    const mockOrganizationId = `org_vendor_techsamurai_${Date.now()}`;
    const organizationName = "TechSamurai";
    const organizationWebsite = "techsamur.ai";
    
    // Simulate the specific vendor user from Clerk
    const mockClerkEvent = {
      type: 'organizationMembership.created',
      data: {
        id: `orgmem_${Date.now()}`,
        organization: {
          id: mockOrganizationId,
          name: organizationName,
          slug: 'techsamurai'
        },
        public_user_data: {
          user_id: `user_vendor_rajesh_${Date.now()}`,
          first_name: 'Rajesh',
          last_name: 'Shetty',
          username: 'rshettytechsamurai',
          image_url: 'https://lh3.googleusercontent.com/a/default-user'
        },
        role: 'admin', // Organization admin role in Clerk
        created_at: Date.now(),
        updated_at: Date.now()
      }
    };

    const userId = mockClerkEvent.data.public_user_data.user_id;
    const organizationId = mockClerkEvent.data.organization.id;
    
    // Determine user type (vendor based on organization creation and heuristics)
    const userType = 'vendor';
    const isFirstUser = true; // Organization creator gets admin role
    const defaultRole = getDefaultRole(userType, isFirstUser);

    // Create organization document first
    const organizationDoc = {
      id: organizationId,
      name: organizationName,
      slug: 'techsamurai',
      type: 'vendor', // Vendor organization
      website: organizationWebsite,
      
      // Admin user (creator)
      createdBy: userId,
      adminUserId: userId,
      
      // Organization details
      description: 'AI and technology services provider',
      industry: 'Technology',
      size: 'small', // 1-10 employees
      location: null,
      
      // Vendor-specific information
      vendorInfo: {
        services: [],
        specialties: ['AI Development', 'Machine Learning', 'Software Development'],
        certifications: [],
        yearEstablished: null,
        employeeCount: null
      },
      
      // Settings
      settings: {
        allowMemberInvites: true,
        requireApprovalForProjects: true, // Vendors typically require approval
        defaultProjectVisibility: 'organization',
        autoAcceptProjects: false
      },
      
      // Billing and vendor status
      billing: {
        plan: 'professional', // Vendors typically start with higher plans
        status: 'active',
        trialEndsAt: null
      },
      
      vendorStatus: {
        verified: false,
        onboardingCompleted: false,
        profileCompleted: false,
        servicesListed: false
      },
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('organizations').doc(organizationId).set(organizationDoc);

    // Create user document with vendor role information
    const userDoc = {
      id: userId,
      email: 'rshetty@techsamur.ai',
      name: 'Rajesh Shetty',
      firstName: 'Rajesh',
      lastName: 'Shetty',
      username: 'rshettytechsamurai',
      avatar: mockClerkEvent.data.public_user_data.image_url,
      
      // Role and permissions (Vendor Admin)
      userType: userType,
      roles: [defaultRole],
      primaryRole: defaultRole,
      
      // Organization info
      organizationId: organizationId,
      organizationName: organizationName,
      organizationRole: 'admin', // Clerk organization role
      organizationType: 'vendor',
      organizationWebsite: organizationWebsite,
      
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
        isOrganizationAdmin: true,
        businessEmail: true // Using business domain
      },
      
      // Onboarding and session metadata
      onboarding_status: 'not_started',
      onboarding_completed: false,
      onboarding_current_step: 0,
      user_status: 'active',
      api_access_level: 'premium', // Vendors get highest access level
      
      // Vendor specific fields
      profile: {
        title: 'Founder & CEO',
        department: 'Executive',
        bio: null,
        phoneNumber: null,
        expertise: ['AI/ML', 'Software Architecture', 'Product Strategy']
      },
      
      // Settings
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false, // Business users typically opt out
        theme: 'system',
        projectNotifications: true,
        clientCommunications: true
      }
    };

    await adminDb.collection('users').doc(userId).set(userDoc);

    // Create onboarding record specific to vendor
    const onboardingDoc = {
      userId,
      userType: userType,
      organizationId: organizationId,
      status: 'not_started',
      currentStep: 0,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Vendor onboarding specific data
      onboardingData: {
        organizationSetup: true, // Already done by creating org
        companyProfileCompleted: false,
        servicesListed: false,
        teamMembersAdded: false,
        portfolioUploaded: false,
        pricingConfigured: false,
        verificationSubmitted: false,
        firstClientOnboarded: false
      }
    };

    await adminDb.collection('onboarding').doc(userId).set(onboardingDoc);

    // Create vendor organization membership record
    const membershipDoc = {
      userId,
      organizationId,
      organizationName,
      userEmail: userDoc.email,
      userName: userDoc.name,
      
      // Role information
      role: defaultRole, // Internal marketplace role
      clerkRole: 'admin', // Clerk organization role
      
      // Permissions within organization (Vendor admin has full permissions)
      permissions: {
        canInviteMembers: true,
        canManageProjects: true,
        canViewBilling: true,
        canManageBilling: true,
        canManageSettings: true,
        canManageServices: true,
        canViewAnalytics: true,
        canManageClients: true
      },
      
      // Status
      status: 'active',
      joinedAt: new Date(),
      invitedBy: null, // Self-created
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('organizationMemberships').doc(`${organizationId}_${userId}`).set(membershipDoc);

    // Create vendor profile document
    const vendorProfile = {
      userId,
      organizationId,
      email: userDoc.email,
      name: userDoc.name,
      organizationName,
      website: organizationWebsite,
      role: defaultRole,
      
      // Company information
      company: {
        name: organizationName,
        website: organizationWebsite,
        description: 'AI and technology services provider',
        industry: 'Technology',
        size: 'small',
        yearEstablished: null,
        headquarters: null
      },
      
      // Services and capabilities
      services: [],
      specialties: ['AI Development', 'Machine Learning', 'Software Development'],
      technologies: [],
      
      // Pricing and availability
      pricing: {
        hourlyRate: null,
        projectMinimum: null,
        currency: 'USD'
      },
      
      availability: {
        status: 'available',
        capacity: null,
        responseTime: null
      },
      
      // Portfolio and social proof
      portfolio: {
        projects: [],
        case_studies: [],
        testimonials: [],
        certifications: []
      },
      
      // Performance metrics
      stats: {
        totalProjects: 0,
        completedProjects: 0,
        clientRetention: 0,
        rating: 0,
        reviewCount: 0,
        averageProjectValue: 0
      },
      
      // Verification status
      verification: {
        identity: false,
        business: false,
        email: true,
        phone: false,
        portfolio: false,
        references: false
      },
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('vendors').doc(userId).set(vendorProfile);

    return NextResponse.json({
      success: true,
      message: 'Vendor user created successfully with organization and role data',
      data: {
        userId,
        organizationId,
        mockClerkEvent,
        organizationDocument: organizationDoc,
        userDocument: userDoc,
        onboardingDocument: onboardingDoc,
        membershipDocument: membershipDoc,
        vendorProfile,
        roleInfo: {
          userType,
          defaultRole,
          roles: [defaultRole],
          primaryRole: defaultRole,
          organizationRole: 'admin',
          organizationType: 'vendor'
        }
      }
    });

  } catch (error) {
    console.error('Vendor user test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/test/vendor-user
 * Get vendor user data to examine structure
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get vendor users
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'rshetty@techsamur.ai')
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get organizations, onboarding records, memberships, and vendor profiles
    const organizations = [];
    const onboardingRecords = [];
    const memberships = [];
    const vendorProfiles = [];
    
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
      
      // Get vendor profile
      const vendorDoc = await adminDb.collection('vendors').doc(user.id).get();
      if (vendorDoc.exists) {
        vendorProfiles.push({
          id: vendorDoc.id,
          ...vendorDoc.data()
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        organizations,
        onboardingRecords,
        memberships,
        vendorProfiles,
        counts: {
          totalUsers: users.length,
          organizations: organizations.length,
          onboardingRecords: onboardingRecords.length,
          memberships: memberships.length,
          vendorProfiles: vendorProfiles.length
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch vendor user data:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';