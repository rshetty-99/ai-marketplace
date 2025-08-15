import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';
import { getDefaultRole } from '@/lib/firebase/rbac-schema';

/**
 * POST /api/test/update-test-account
 * Update the test account rshetty99@hotmail.com to have proper freelancer role
 */
export async function POST(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Find the test user account
    const userSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'rshetty99@hotmail.com')
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      // Create the user if doesn't exist
      const newUserId = `user_freelancer_test_${Date.now()}`;
      const userType = 'freelancer';
      const defaultRole = getDefaultRole(userType, true);

      const newUserData = {
        id: newUserId,
        email: 'rshetty99@hotmail.com',
        name: 'Test Freelancer',
        firstName: 'Test',
        lastName: 'Freelancer',
        username: 'testfreelancer',
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
        
        // Proper freelancer role setup
        userType: 'freelancer',
        roles: [defaultRole],
        primaryRole: defaultRole,
        
        // No organization for freelancers
        organizationId: null,
        organizationRole: null,
        
        // User status
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Metadata
        metadata: {
          clerkUserId: newUserId,
          emailVerified: true,
          phoneVerified: false,
          provider: 'email',
          isTestAccount: true
        },
        
        // Onboarding status
        onboarding_status: 'not_started',
        onboarding_completed: false,
        onboarding_current_step: 0,
        user_status: 'active',
        freelancer_verified: false,
        api_access_level: 'basic',
        
        // Freelancer profile
        profile: {
          bio: 'Test freelancer account for development',
          skills: ['Testing', 'Development', 'QA'],
          hourlyRate: 50,
          availability: 'available',
          portfolioUrl: null,
          linkedinUrl: null,
          githubUrl: null
        },
        
        preferences: {
          emailNotifications: true,
          pushNotifications: false,
          marketingEmails: false,
          theme: 'system'
        }
      };

      await adminDb.collection('users').doc(newUserId).set(newUserData);

      // Create freelancer profile
      const freelancerProfile = {
        userId: newUserId,
        email: 'rshetty99@hotmail.com',
        name: 'Test Freelancer',
        role: defaultRole,
        
        title: 'Test Developer',
        bio: 'Test freelancer account for development and testing purposes',
        skills: ['Testing', 'Development', 'QA', 'Automation'],
        experience: '5 years',
        hourlyRate: 50,
        availability: 'available',
        timezone: 'America/Los_Angeles',
        
        portfolio: {
          projects: [],
          testimonials: [],
          certifications: []
        },
        
        links: {
          website: null,
          linkedin: null,
          github: null,
          twitter: null
        },
        
        stats: {
          totalProjects: 0,
          completedProjects: 0,
          rating: 0,
          reviewCount: 0,
          responseTime: null
        },
        
        verification: {
          identity: false,
          email: true,
          phone: false,
          portfolio: false,
          skills: false
        },
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await adminDb.collection('freelancers').doc(newUserId).set(freelancerProfile);

      // Create onboarding record
      const onboardingData = {
        userId: newUserId,
        userType: 'freelancer',
        status: 'not_started',
        currentStep: 0,
        completedSteps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        
        onboardingData: {
          profileCompleted: false,
          skillsAdded: true, // Has some test skills
          portfolioUploaded: false,
          rateSet: true, // Has test rate
          verificationSubmitted: false
        }
      };

      await adminDb.collection('onboarding').doc(newUserId).set(onboardingData);

      return NextResponse.json({
        success: true,
        message: 'Test account created as freelancer',
        data: {
          action: 'created',
          userId: newUserId,
          email: 'rshetty99@hotmail.com',
          userType: 'freelancer',
          role: defaultRole,
          freelancerProfileCreated: true,
          onboardingCreated: true
        }
      });

    } else {
      // Update existing user
      const userDoc = userSnapshot.docs[0];
      const userId = userDoc.id;
      const currentData = userDoc.data();

      // Update to proper freelancer role
      const userType = 'freelancer';
      const defaultRole = getDefaultRole(userType, true);

      const updateData = {
        userType: 'freelancer',
        roles: [defaultRole],
        primaryRole: defaultRole,
        
        // Clear any organization data
        organizationId: null,
        organizationRole: null,
        organizationType: null,
        
        // Update status
        user_status: 'active',
        freelancer_verified: false,
        api_access_level: 'basic',
        
        // Update profile if missing
        profile: currentData.profile || {
          bio: 'Test freelancer account for development',
          skills: ['Testing', 'Development', 'QA'],
          hourlyRate: 50,
          availability: 'available'
        },
        
        updatedAt: new Date(),
        
        metadata: {
          ...currentData.metadata,
          isTestAccount: true,
          roleUpdated: true,
          previousRole: currentData.roles?.[0] || 'user'
        }
      };

      await adminDb.collection('users').doc(userId).update(updateData);

      // Check if freelancer profile exists
      const freelancerDoc = await adminDb.collection('freelancers').doc(userId).get();
      
      if (!freelancerDoc.exists) {
        // Create freelancer profile
        const freelancerProfile = {
          userId,
          email: 'rshetty99@hotmail.com',
          name: currentData.name || 'Test Freelancer',
          role: defaultRole,
          
          title: 'Test Developer',
          bio: 'Test freelancer account',
          skills: ['Testing', 'Development', 'QA'],
          experience: '5 years',
          hourlyRate: 50,
          availability: 'available',
          
          portfolio: {
            projects: [],
            testimonials: [],
            certifications: []
          },
          
          stats: {
            totalProjects: 0,
            completedProjects: 0,
            rating: 0,
            reviewCount: 0,
            responseTime: null
          },
          
          verification: {
            identity: false,
            email: true,
            phone: false,
            portfolio: false,
            skills: false
          },
          
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await adminDb.collection('freelancers').doc(userId).set(freelancerProfile);
      }

      // Update or create onboarding record
      const onboardingDoc = await adminDb.collection('onboarding').doc(userId).get();
      
      if (!onboardingDoc.exists) {
        const onboardingData = {
          userId,
          userType: 'freelancer',
          status: 'not_started',
          currentStep: 0,
          completedSteps: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          
          onboardingData: {
            profileCompleted: false,
            skillsAdded: false,
            portfolioUploaded: false,
            rateSet: false,
            verificationSubmitted: false
          }
        };

        await adminDb.collection('onboarding').doc(userId).set(onboardingData);
      } else {
        await adminDb.collection('onboarding').doc(userId).update({
          userType: 'freelancer',
          updatedAt: new Date()
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Test account updated to freelancer role',
        data: {
          action: 'updated',
          userId,
          email: 'rshetty99@hotmail.com',
          previousRole: currentData.roles?.[0] || 'user',
          newRole: defaultRole,
          userType: 'freelancer',
          freelancerProfileCreated: !freelancerDoc.exists,
          onboardingUpdated: true
        }
      });
    }

  } catch (error) {
    console.error('Test account update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/test/update-test-account
 * Get current status of the test account
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get the test user
    const userSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'rshetty99@hotmail.com')
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'Test account not found'
      }, { status: 404 });
    }

    const user = {
      id: userSnapshot.docs[0].id,
      ...userSnapshot.docs[0].data()
    };

    // Get freelancer profile if exists
    const freelancerDoc = await adminDb.collection('freelancers').doc(user.id).get();
    const freelancerProfile = freelancerDoc.exists ? {
      id: freelancerDoc.id,
      ...freelancerDoc.data()
    } : null;

    // Get onboarding if exists
    const onboardingDoc = await adminDb.collection('onboarding').doc(user.id).get();
    const onboarding = onboardingDoc.exists ? {
      id: onboardingDoc.id,
      ...onboardingDoc.data()
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          roles: user.roles,
          primaryRole: user.primaryRole,
          organizationId: user.organizationId,
          isTestAccount: user.metadata?.isTestAccount
        },
        freelancerProfile: freelancerProfile ? {
          exists: true,
          skills: freelancerProfile.skills,
          hourlyRate: freelancerProfile.hourlyRate,
          availability: freelancerProfile.availability
        } : { exists: false },
        onboarding: onboarding ? {
          exists: true,
          status: onboarding.status,
          userType: onboarding.userType,
          progress: onboarding.progress
        } : { exists: false }
      }
    });

  } catch (error) {
    console.error('Failed to fetch test account:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';