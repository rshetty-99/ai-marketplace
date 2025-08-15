import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';

/**
 * POST /api/test/sync-onboarding
 * Ensure onboarding collection is synchronized with organization collection data
 */
export async function POST(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get all organizations to sync their onboarding status
    const organizationsSnapshot = await adminDb.collection('organizations').get();
    const syncResults = [];

    for (const orgDoc of organizationsSnapshot.docs) {
      const orgData = orgDoc.data();
      const orgId = orgDoc.id;

      // Find the admin user for this organization
      const adminUserId = orgData.adminUserId || orgData.createdBy;
      
      if (!adminUserId) {
        syncResults.push({
          organizationId: orgId,
          status: 'skipped',
          reason: 'No admin user found'
        });
        continue;
      }

      // Get the user's onboarding record
      const onboardingDoc = await adminDb.collection('onboarding').doc(adminUserId).get();
      
      if (!onboardingDoc.exists) {
        syncResults.push({
          organizationId: orgId,
          userId: adminUserId,
          status: 'skipped',
          reason: 'No onboarding record found'
        });
        continue;
      }

      const currentOnboardingData = onboardingDoc.data();

      // Analyze organization completeness
      const completenessAnalysis = analyzeOrganizationCompleteness(orgData);
      
      // Calculate onboarding status based on organization data
      const syncedOnboardingData = {
        ...currentOnboardingData,
        
        // Sync basic status
        status: completenessAnalysis.overallComplete ? 'completed' : 
                completenessAnalysis.percentComplete > 50 ? 'in_progress' : 'not_started',
        
        currentStep: completenessAnalysis.completedStepsCount,
        completedSteps: completenessAnalysis.completedSteps,
        
        // Sync completion flags
        onboarding_completed: completenessAnalysis.overallComplete,
        completedAt: completenessAnalysis.overallComplete ? new Date() : null,
        updatedAt: new Date(),
        
        // Sync onboarding data based on organization fields
        onboardingData: {
          // Basic organization setup
          organizationSetup: !!orgData.name && !!orgData.type,
          
          // Company profile completion
          companyProfileCompleted: !!(
            orgData.description && 
            orgData.industry && 
            orgData.location && 
            orgData.contact?.email
          ),
          
          // Services listed (vendor-specific)
          servicesListed: orgData.type === 'vendor' ? 
            !!(orgData.vendorInfo?.services?.length > 0) : true,
          
          // Team members added
          teamMembersAdded: !!(orgData.team?.totalMembers > 1 || orgData.team?.coreTeam?.length > 0),
          
          // Portfolio uploaded (vendor-specific)
          portfolioUploaded: orgData.type === 'vendor' ? 
            !!(orgData.socialProof?.caseStudies?.length > 0 || orgData.socialProof?.testimonials?.length > 0) : true,
          
          // Pricing configured (vendor-specific)
          pricingConfigured: orgData.type === 'vendor' ? 
            !!(orgData.vendorInfo?.services?.length > 0) : true,
          
          // Verification completed
          verificationSubmitted: orgData.type === 'vendor' ? 
            !!orgData.vendorStatus?.verified : !!orgData.billing?.status,
          
          // First client onboarded (remains as is - requires actual project)
          firstClientOnboarded: currentOnboardingData?.onboardingData?.firstClientOnboarded || false,
          
          // Additional completions based on org data
          certificationsAdded: orgData.type === 'vendor' ? 
            !!(orgData.vendorInfo?.certifications?.length > 0) : true,
          
          businessMetricsSetup: !!(orgData.businessMetrics?.rating !== undefined),
          
          workingHoursConfigured: !!(orgData.settings?.workingHours?.timezone),
          
          paymentMethodVerified: !!(orgData.billing?.paymentMethod),
          
          profilePublished: completenessAnalysis.overallComplete,
          
          // Customer-specific onboarding fields
          ...(orgData.type === 'customer' && {
            teamMembersInvited: !!(orgData.team?.totalMembers > 1),
            firstProjectCreated: false, // Would be set when first project is created
            billingConfigured: !!(orgData.billing?.plan && orgData.billing?.status === 'active')
          }),
          
          // Completion timestamps
          stepCompletionDates: {
            organizationSetup: orgData.createdAt,
            companyProfileCompleted: orgData.lastProfileUpdate || orgData.updatedAt,
            servicesListed: orgData.lastProfileUpdate || orgData.updatedAt,
            teamMembersAdded: orgData.lastProfileUpdate || orgData.updatedAt,
            portfolioUploaded: orgData.lastProfileUpdate || orgData.updatedAt,
            pricingConfigured: orgData.lastProfileUpdate || orgData.updatedAt,
            verificationSubmitted: orgData.lastProfileUpdate || orgData.updatedAt,
            certificationsAdded: orgData.lastProfileUpdate || orgData.updatedAt,
            businessMetricsSetup: orgData.lastProfileUpdate || orgData.updatedAt,
            workingHoursConfigured: orgData.lastProfileUpdate || orgData.updatedAt,
            paymentMethodVerified: orgData.lastProfileUpdate || orgData.updatedAt,
            profilePublished: completenessAnalysis.overallComplete ? new Date() : null
          }
        },
        
        // Sync progress tracking
        progress: {
          totalSteps: orgData.type === 'vendor' ? 8 : 6,
          completedSteps: completenessAnalysis.completedStepsCount,
          percentageComplete: completenessAnalysis.percentComplete,
          estimatedTimeRemaining: completenessAnalysis.overallComplete ? 0 : 
            Math.max(1, 8 - completenessAnalysis.completedStepsCount) * 30, // 30 min per step
          nextRecommendedAction: getNextRecommendedAction(completenessAnalysis, orgData.type)
        },
        
        // Sync metadata
        metadata: {
          ...currentOnboardingData.metadata,
          lastSyncedAt: new Date(),
          syncedFromOrganization: true,
          organizationCompleteness: completenessAnalysis.percentComplete,
          autoSynced: true
        }
      };

      // Update the onboarding record
      await adminDb.collection('onboarding').doc(adminUserId).set(syncedOnboardingData, { merge: true });

      // Also update the user record to reflect onboarding status
      await adminDb.collection('users').doc(adminUserId).update({
        onboarding_status: syncedOnboardingData.status,
        onboarding_completed: syncedOnboardingData.onboarding_completed,
        profile_complete: completenessAnalysis.overallComplete,
        ready_for_projects: completenessAnalysis.overallComplete && orgData.type === 'vendor',
        updatedAt: new Date()
      });

      syncResults.push({
        organizationId: orgId,
        organizationType: orgData.type,
        organizationName: orgData.name,
        userId: adminUserId,
        status: 'synced',
        previousOnboardingStatus: currentOnboardingData?.status,
        newOnboardingStatus: syncedOnboardingData.status,
        completenessPercentage: completenessAnalysis.percentComplete,
        completedSteps: completenessAnalysis.completedStepsCount,
        isReadyForProjects: completenessAnalysis.overallComplete && orgData.type === 'vendor'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding collections synchronized with organization data',
      data: {
        totalOrganizations: organizationsSnapshot.docs.length,
        syncResults,
        summary: {
          synced: syncResults.filter(r => r.status === 'synced').length,
          skipped: syncResults.filter(r => r.status === 'skipped').length,
          completed: syncResults.filter(r => r.newOnboardingStatus === 'completed').length,
          inProgress: syncResults.filter(r => r.newOnboardingStatus === 'in_progress').length
        }
      }
    });

  } catch (error) {
    console.error('Onboarding sync failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

/**
 * Analyze organization data completeness
 */
function analyzeOrganizationCompleteness(orgData: any) {
  const checks = {
    basicInfo: !!(orgData.name && orgData.type && orgData.description),
    contactInfo: !!(orgData.contact?.email || orgData.website),
    location: !!orgData.location,
    industry: !!orgData.industry,
    billing: !!(orgData.billing?.plan && orgData.billing?.status),
    settings: !!orgData.settings,
    team: !!(orgData.team?.totalMembers || orgData.adminUserId),
  };

  // Vendor-specific checks
  if (orgData.type === 'vendor') {
    Object.assign(checks, {
      services: !!(orgData.vendorInfo?.services?.length > 0),
      specialties: !!(orgData.vendorInfo?.specialties?.length > 0),
      verification: !!orgData.vendorStatus?.verified,
      portfolio: !!(orgData.socialProof?.caseStudies?.length > 0 || orgData.socialProof?.testimonials?.length > 0),
      certifications: !!(orgData.vendorInfo?.certifications?.length > 0),
      businessMetrics: !!orgData.businessMetrics?.rating
    });
  }

  const completedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const percentComplete = Math.round((completedChecks / totalChecks) * 100);

  return {
    checks,
    completedStepsCount: completedChecks,
    totalSteps: totalChecks,
    percentComplete,
    overallComplete: percentComplete >= 90, // 90% threshold for completion
    completedSteps: Object.keys(checks).filter(key => checks[key]).map((_, index) => index + 1)
  };
}

/**
 * Get next recommended action based on completeness analysis
 */
function getNextRecommendedAction(analysis: any, orgType: string) {
  if (analysis.overallComplete) {
    return orgType === 'vendor' ? 'Start accepting client projects' : 'Begin posting project requirements';
  }

  const { checks } = analysis;
  
  if (!checks.basicInfo) return 'Complete basic organization information';
  if (!checks.contactInfo) return 'Add contact information';
  if (!checks.location) return 'Set organization location';
  if (!checks.industry) return 'Specify industry sector';
  if (!checks.billing) return 'Configure billing and payment';
  
  if (orgType === 'vendor') {
    if (!checks.services) return 'List your services and capabilities';
    if (!checks.specialties) return 'Define your specialties';
    if (!checks.portfolio) return 'Add portfolio projects and testimonials';
    if (!checks.certifications) return 'Upload professional certifications';
    if (!checks.verification) return 'Complete profile verification';
  }
  
  return 'Complete remaining profile sections';
}

/**
 * GET /api/test/sync-onboarding
 * Check sync status between onboarding and organizations
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get all organizations and their corresponding onboarding records
    const organizationsSnapshot = await adminDb.collection('organizations').get();
    const syncStatus = [];

    for (const orgDoc of organizationsSnapshot.docs) {
      const orgData = orgDoc.data();
      const adminUserId = orgData.adminUserId || orgData.createdBy;

      if (adminUserId) {
        const onboardingDoc = await adminDb.collection('onboarding').doc(adminUserId).get();
        const onboardingData = onboardingDoc.exists ? onboardingDoc.data() : null;

        const completeness = analyzeOrganizationCompleteness(orgData);

        syncStatus.push({
          organizationId: orgDoc.id,
          organizationName: orgData.name,
          organizationType: orgData.type,
          userId: adminUserId,
          organizationCompleteness: completeness.percentComplete,
          onboardingStatus: onboardingData?.status || 'not_found',
          onboardingProgress: onboardingData?.progress?.percentageComplete || 0,
          isInSync: onboardingData ? 
            Math.abs(completeness.percentComplete - (onboardingData.progress?.percentageComplete || 0)) <= 10 : false,
          needsSync: !onboardingData || 
            Math.abs(completeness.percentComplete - (onboardingData.progress?.percentageComplete || 0)) > 10
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalOrganizations: organizationsSnapshot.docs.length,
        syncStatus,
        summary: {
          inSync: syncStatus.filter(s => s.isInSync).length,
          needsSync: syncStatus.filter(s => s.needsSync).length,
          noOnboardingRecord: syncStatus.filter(s => s.onboardingStatus === 'not_found').length
        }
      }
    });

  } catch (error) {
    console.error('Failed to check sync status:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';