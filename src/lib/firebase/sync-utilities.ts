import { getAdminDb } from '@/lib/firebase';

/**
 * Utility functions for keeping onboarding and organization collections in sync
 */

export interface OrganizationCompletenessAnalysis {
  checks: Record<string, boolean>;
  completedStepsCount: number;
  totalSteps: number;
  percentComplete: number;
  overallComplete: boolean;
  completedSteps: number[];
  missingFields: string[];
}

export interface SyncResult {
  success: boolean;
  organizationId?: string;
  userId?: string;
  previousStatus?: string;
  newStatus?: string;
  error?: string;
}

/**
 * Analyze organization data completeness
 */
export function analyzeOrganizationCompleteness(orgData: any): OrganizationCompletenessAnalysis {
  const checks = {
    basicInfo: !!(orgData.name && orgData.type && orgData.description),
    contactInfo: !!(orgData.contact?.email || orgData.website),
    location: !!orgData.location,
    industry: !!orgData.industry,
    billing: !!(orgData.billing?.plan && orgData.billing?.status === 'active'),
    settings: !!orgData.settings,
    team: !!(orgData.team?.totalMembers > 0 || orgData.adminUserId),
  };

  const missingFields: string[] = [];
  
  // Add missing field tracking
  if (!checks.basicInfo) missingFields.push('Basic organization information');
  if (!checks.contactInfo) missingFields.push('Contact information');
  if (!checks.location) missingFields.push('Location');
  if (!checks.industry) missingFields.push('Industry');
  if (!checks.billing) missingFields.push('Billing setup');
  if (!checks.settings) missingFields.push('Organization settings');
  if (!checks.team) missingFields.push('Team configuration');

  // Vendor-specific checks
  if (orgData.type === 'vendor') {
    const vendorChecks = {
      services: !!(orgData.vendorInfo?.services?.length > 0),
      specialties: !!(orgData.vendorInfo?.specialties?.length > 0),
      verification: !!orgData.vendorStatus?.verified,
      portfolio: !!(orgData.socialProof?.caseStudies?.length > 0 || orgData.socialProof?.testimonials?.length > 0),
      certifications: !!(orgData.vendorInfo?.certifications?.length > 0),
      businessMetrics: !!(orgData.businessMetrics?.rating !== undefined),
      workingHours: !!(orgData.settings?.workingHours?.timezone),
      pricing: !!(orgData.vendorInfo?.services?.length > 0) // Assuming pricing is tied to services
    };

    Object.assign(checks, vendorChecks);

    // Add vendor-specific missing fields
    if (!vendorChecks.services) missingFields.push('Services listing');
    if (!vendorChecks.specialties) missingFields.push('Specialties');
    if (!vendorChecks.verification) missingFields.push('Profile verification');
    if (!vendorChecks.portfolio) missingFields.push('Portfolio/case studies');
    if (!vendorChecks.certifications) missingFields.push('Certifications');
    if (!vendorChecks.businessMetrics) missingFields.push('Business metrics');
    if (!vendorChecks.workingHours) missingFields.push('Working hours');
    if (!vendorChecks.pricing) missingFields.push('Pricing configuration');
  }

  // Customer-specific checks
  if (orgData.type === 'customer') {
    const customerChecks = {
      projectNeeds: true, // Customers don't need to define services upfront
      billingActive: !!(orgData.billing?.status === 'active')
    };

    Object.assign(checks, customerChecks);
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
    completedSteps: Object.keys(checks).filter(key => checks[key]).map((_, index) => index + 1),
    missingFields
  };
}

/**
 * Get next recommended action based on completeness analysis
 */
export function getNextRecommendedAction(analysis: OrganizationCompletenessAnalysis, orgType: string): string {
  if (analysis.overallComplete) {
    return orgType === 'vendor' ? 'Start accepting client projects' : 'Begin posting project requirements';
  }

  if (analysis.missingFields.length > 0) {
    return `Complete: ${analysis.missingFields[0]}`;
  }

  return 'Complete remaining profile sections';
}

/**
 * Sync onboarding record based on organization data
 */
export async function syncOnboardingFromOrganization(organizationId: string): Promise<SyncResult> {
  try {
    const adminDb = await getAdminDb();
    
    // Get organization data
    const orgDoc = await adminDb.collection('organizations').doc(organizationId).get();
    
    if (!orgDoc.exists) {
      return { success: false, error: 'Organization not found' };
    }

    const orgData = orgDoc.data();
    const adminUserId = orgData?.adminUserId || orgData?.createdBy;

    if (!adminUserId) {
      return { success: false, error: 'No admin user found for organization' };
    }

    // Get current onboarding data
    const onboardingDoc = await adminDb.collection('onboarding').doc(adminUserId).get();
    
    if (!onboardingDoc.exists) {
      return { success: false, error: 'Onboarding record not found' };
    }

    const currentOnboardingData = onboardingDoc.data();
    const completenessAnalysis = analyzeOrganizationCompleteness(orgData);

    // Calculate new onboarding status
    let newStatus = 'not_started';
    if (completenessAnalysis.overallComplete) {
      newStatus = 'completed';
    } else if (completenessAnalysis.percentComplete > 30) {
      newStatus = 'in_progress';
    }

    // Create synced onboarding data
    const syncedOnboardingData = {
      ...currentOnboardingData,
      
      // Sync status
      status: newStatus,
      currentStep: completenessAnalysis.completedStepsCount,
      completedSteps: completenessAnalysis.completedSteps,
      
      // Sync completion flags
      onboarding_completed: completenessAnalysis.overallComplete,
      completedAt: completenessAnalysis.overallComplete ? new Date() : null,
      updatedAt: new Date(),
      
      // Sync onboarding data based on organization analysis
      onboardingData: {
        ...currentOnboardingData.onboardingData,
        
        // Basic setup
        organizationSetup: completenessAnalysis.checks.basicInfo,
        companyProfileCompleted: completenessAnalysis.checks.basicInfo && 
                                 completenessAnalysis.checks.contactInfo && 
                                 completenessAnalysis.checks.location,
        
        // Vendor-specific syncing
        ...(orgData.type === 'vendor' && {
          servicesListed: completenessAnalysis.checks.services,
          portfolioUploaded: completenessAnalysis.checks.portfolio,
          pricingConfigured: completenessAnalysis.checks.pricing,
          verificationSubmitted: completenessAnalysis.checks.verification,
          certificationsAdded: completenessAnalysis.checks.certifications,
          businessMetricsSetup: completenessAnalysis.checks.businessMetrics,
          workingHoursConfigured: completenessAnalysis.checks.workingHours,
        }),
        
        // Customer-specific syncing
        ...(orgData.type === 'customer' && {
          billingConfigured: completenessAnalysis.checks.billingActive,
        }),
        
        // Common fields
        teamMembersAdded: completenessAnalysis.checks.team,
        paymentMethodVerified: completenessAnalysis.checks.billing,
        profilePublished: completenessAnalysis.overallComplete,
        
        // Keep existing fields that can't be auto-determined
        firstClientOnboarded: currentOnboardingData?.onboardingData?.firstClientOnboarded || false,
        firstProjectCreated: currentOnboardingData?.onboardingData?.firstProjectCreated || false
      },
      
      // Update progress
      progress: {
        totalSteps: completenessAnalysis.totalSteps,
        completedSteps: completenessAnalysis.completedStepsCount,
        percentageComplete: completenessAnalysis.percentComplete,
        estimatedTimeRemaining: completenessAnalysis.overallComplete ? 0 : 
          Math.max(1, completenessAnalysis.totalSteps - completenessAnalysis.completedStepsCount) * 15,
        nextRecommendedAction: getNextRecommendedAction(completenessAnalysis, orgData.type),
        missingFields: completenessAnalysis.missingFields
      },
      
      // Update metadata
      metadata: {
        ...currentOnboardingData.metadata,
        lastSyncedAt: new Date(),
        syncedFromOrganization: true,
        organizationCompleteness: completenessAnalysis.percentComplete,
        syncTrigger: 'organization_update'
      }
    };

    // Update onboarding record
    await adminDb.collection('onboarding').doc(adminUserId).set(syncedOnboardingData, { merge: true });

    // Update user record
    await adminDb.collection('users').doc(adminUserId).update({
      onboarding_status: newStatus,
      onboarding_completed: completenessAnalysis.overallComplete,
      profile_complete: completenessAnalysis.overallComplete,
      ready_for_projects: completenessAnalysis.overallComplete && orgData.type === 'vendor',
      updatedAt: new Date()
    });

    return {
      success: true,
      organizationId,
      userId: adminUserId,
      previousStatus: currentOnboardingData?.status,
      newStatus
    };

  } catch (error) {
    return { 
      success: false, 
      error: `Sync failed: ${(error as Error).message}` 
    };
  }
}

/**
 * Sync organization data when onboarding changes (reverse sync)
 */
export async function syncOrganizationFromOnboarding(userId: string): Promise<SyncResult> {
  try {
    const adminDb = await getAdminDb();
    
    // Get onboarding data
    const onboardingDoc = await adminDb.collection('onboarding').doc(userId).get();
    
    if (!onboardingDoc.exists) {
      return { success: false, error: 'Onboarding record not found' };
    }

    const onboardingData = onboardingDoc.data();
    const organizationId = onboardingData?.organizationId;

    if (!organizationId) {
      return { success: false, error: 'No organization linked to user' };
    }

    // Get organization data
    const orgDoc = await adminDb.collection('organizations').doc(organizationId).get();
    
    if (!orgDoc.exists) {
      return { success: false, error: 'Organization not found' };
    }

    // Update organization metadata to reflect onboarding status
    const updateData = {
      metadata: {
        ...orgDoc.data()?.metadata,
        lastOnboardingSyncAt: new Date(),
        onboardingStatus: onboardingData.status,
        onboardingProgress: onboardingData.progress?.percentageComplete || 0
      },
      updatedAt: new Date()
    };

    await adminDb.collection('organizations').doc(organizationId).update(updateData);

    return {
      success: true,
      organizationId,
      userId,
      previousStatus: orgDoc.data()?.metadata?.onboardingStatus,
      newStatus: onboardingData.status
    };

  } catch (error) {
    return { 
      success: false, 
      error: `Reverse sync failed: ${(error as Error).message}` 
    };
  }
}

/**
 * Auto-sync trigger function - call this whenever organization or onboarding data changes
 */
export async function autoSyncCollections(
  triggerType: 'organization' | 'onboarding',
  recordId: string
): Promise<SyncResult> {
  if (triggerType === 'organization') {
    return await syncOnboardingFromOrganization(recordId);
  } else {
    return await syncOrganizationFromOnboarding(recordId);
  }
}

/**
 * Batch sync all organizations and onboarding records
 */
export async function batchSyncAllRecords(): Promise<{
  success: boolean;
  results: SyncResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  try {
    const adminDb = await getAdminDb();
    const organizationsSnapshot = await adminDb.collection('organizations').get();
    
    const results: SyncResult[] = [];
    
    for (const orgDoc of organizationsSnapshot.docs) {
      const syncResult = await syncOnboardingFromOrganization(orgDoc.id);
      results.push(syncResult);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: true,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      }
    };

  } catch (error) {
    return {
      success: false,
      results: [],
      summary: { total: 0, successful: 0, failed: 1 }
    };
  }
}