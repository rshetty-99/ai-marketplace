import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';

/**
 * POST /api/test/update-onboarding
 * Update onboarding status for TechSamurai to reflect completion
 */
export async function POST(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Find the TechSamurai user (Rajesh Shetty)
    const userSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'rshetty@techsamur.ai')
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'TechSamurai user (rshetty@techsamur.ai) not found'
      }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    // Get current onboarding record
    const onboardingDoc = await adminDb.collection('onboarding').doc(userId).get();
    
    if (!onboardingDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Onboarding record not found for user'
      }, { status: 404 });
    }

    const currentOnboardingData = onboardingDoc.data();

    // Update onboarding to reflect completion
    const completedOnboardingData = {
      ...currentOnboardingData,
      
      // Main status fields
      status: 'completed',
      currentStep: 8, // Final step
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8], // All 8 steps completed
      
      // Update completion flags
      onboarding_completed: true,
      completedAt: new Date(),
      updatedAt: new Date(),
      
      // Vendor onboarding specific data - all completed
      onboardingData: {
        organizationSetup: true, // ✅ Organization created and configured
        companyProfileCompleted: true, // ✅ Full company profile with description, contact info
        servicesListed: true, // ✅ All 8 services listed with specialties
        teamMembersAdded: true, // ✅ Core team of 8 members added
        portfolioUploaded: true, // ✅ Portfolio projects and case studies added
        pricingConfigured: true, // ✅ Pricing model set ($150/hr, $25k minimum)
        verificationSubmitted: true, // ✅ All verifications completed
        firstClientOnboarded: false, // This would happen when first project is accepted
        
        // Additional completion tracking
        certificationsAdded: true, // ✅ 3 professional certifications added
        businessMetricsSetup: true, // ✅ Performance metrics configured
        workingHoursConfigured: true, // ✅ Business hours and availability set
        paymentMethodVerified: true, // ✅ Billing and payment setup complete
        profilePublished: true, // ✅ Profile is live and searchable
        
        // Completion timestamps
        stepCompletionDates: {
          organizationSetup: new Date('2025-08-15T16:56:56.390Z'), // Original creation
          companyProfileCompleted: new Date(),
          servicesListed: new Date(),
          teamMembersAdded: new Date(),
          portfolioUploaded: new Date(),
          pricingConfigured: new Date(),
          verificationSubmitted: new Date(),
          certificationsAdded: new Date(),
          businessMetricsSetup: new Date(),
          workingHoursConfigured: new Date(),
          paymentMethodVerified: new Date(),
          profilePublished: new Date()
        }
      },
      
      // Progress tracking
      progress: {
        totalSteps: 8,
        completedSteps: 8,
        percentageComplete: 100,
        estimatedTimeRemaining: 0,
        nextRecommendedAction: 'Start accepting client projects'
      },
      
      // Metadata
      metadata: {
        completionMethod: 'manual_profile_setup',
        completionSource: 'admin_update',
        profileCompleteness: 100,
        readyForClients: true,
        qualityScore: 95 // High quality profile
      }
    };

    // Update the onboarding document
    await adminDb.collection('onboarding').doc(userId).set(completedOnboardingData, { merge: true });

    // Also update the user document to reflect onboarding completion
    const updatedUserData = {
      onboarding_status: 'completed',
      onboarding_completed: true,
      onboarding_completed_at: new Date(),
      profile_complete: true,
      ready_for_projects: true,
      updatedAt: new Date()
    };

    await adminDb.collection('users').doc(userId).update(updatedUserData);

    return NextResponse.json({
      success: true,
      message: 'TechSamurai onboarding status updated to completed',
      data: {
        userId,
        previousStatus: currentOnboardingData?.status || 'unknown',
        newStatus: 'completed',
        completedSteps: completedOnboardingData.completedSteps,
        progressPercentage: 100,
        onboardingData: completedOnboardingData.onboardingData,
        userProfileUpdated: true,
        readyForClients: true
      }
    });

  } catch (error) {
    console.error('Onboarding update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * GET /api/test/update-onboarding
 * Get current onboarding status for TechSamurai user
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Find the TechSamurai user
    const userSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'rshetty@techsamur.ai')
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'TechSamurai user not found'
      }, { status: 404 });
    }

    const user = {
      id: userSnapshot.docs[0].id,
      ...userSnapshot.docs[0].data()
    };

    // Get onboarding record
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
          onboarding_status: user.onboarding_status,
          onboarding_completed: user.onboarding_completed,
          profile_complete: user.profile_complete,
          ready_for_projects: user.ready_for_projects
        },
        onboarding,
        hasOnboardingRecord: !!onboarding
      }
    });

  } catch (error) {
    console.error('Failed to fetch onboarding status:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';