'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Building, Users, FileCheck } from 'lucide-react';
import { VendorCompanyOnboarding, OnboardingStatus, UserType } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

// Step Components
import { CompanyInfoStep } from './steps/vendor/company-info-step';
import { RBACSetupStep } from './steps/vendor/rbac-setup-step';
import { EmployeeRosterStep } from './steps/vendor/employee-roster-step';
import { ServiceCatalogStep } from './steps/vendor/service-catalog-step';
import { ComplianceInfoStep } from './steps/vendor/compliance-info-step';
import { PricingModelsStep } from './steps/vendor/pricing-models-step';
import { WhiteLabelSetupStep } from './steps/vendor/white-label-setup-step';
import { APIAccessStep } from './steps/vendor/api-access-step';

interface VendorOnboardingWizardProps {
  onComplete?: () => void;
}

interface StepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  required: boolean;
  estimatedMinutes: number;
  icon: React.ReactNode;
}

const VENDOR_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Company Information',
    description: 'Business verification and legal details',
    component: CompanyInfoStep,
    required: true,
    estimatedMinutes: 15,
    icon: <Building className="w-4 h-4" />,
  },
  {
    id: 2,
    title: 'RBAC Setup',
    description: 'Multi-user roles and permissions',
    component: RBACSetupStep,
    required: true,
    estimatedMinutes: 20,
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 3,
    title: 'Employee Roster',
    description: 'Team structure and department breakdown',
    component: EmployeeRosterStep,
    required: true,
    estimatedMinutes: 10,
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 4,
    title: 'Service Catalog',
    description: 'Define your AI service offerings',
    component: ServiceCatalogStep,
    required: true,
    estimatedMinutes: 25,
    icon: <FileCheck className="w-4 h-4" />,
  },
  {
    id: 5,
    title: 'Compliance Documentation',
    description: 'Upload SOC2, HIPAA, and other certifications',
    component: ComplianceInfoStep,
    required: true,
    estimatedMinutes: 15,
    icon: <FileCheck className="w-4 h-4" />,
  },
  {
    id: 6,
    title: 'Pricing Models',
    description: 'Set pricing tiers and models',
    component: PricingModelsStep,
    required: true,
    estimatedMinutes: 12,
    icon: <Building className="w-4 h-4" />,
  },
  {
    id: 7,
    title: 'White-Label Setup',
    description: 'Custom branding options (optional)',
    component: WhiteLabelSetupStep,
    required: false,
    estimatedMinutes: 8,
    icon: <Building className="w-4 h-4" />,
  },
  {
    id: 8,
    title: 'API Access',
    description: 'Configure API endpoints and rate limits',
    component: APIAccessStep,
    required: false,
    estimatedMinutes: 10,
    icon: <Building className="w-4 h-4" />,
  },
];

export function VendorOnboardingWizard({ onComplete }: VendorOnboardingWizardProps) {
  const { user } = useUser();
  const { trackEvent } = useAnalytics();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<VendorCompanyOnboarding>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = VENDOR_STEPS.find(step => step.id === currentStep);
  const progress = (completedSteps.size / VENDOR_STEPS.length) * 100;
  const totalEstimatedTime = VENDOR_STEPS.reduce((sum, step) => sum + step.estimatedMinutes, 0);
  const remainingTime = VENDOR_STEPS
    .filter(step => !completedSteps.has(step.id))
    .reduce((sum, step) => sum + step.estimatedMinutes, 0);

  useEffect(() => {
    // Load existing onboarding data if any
    loadOnboardingProgress();
    
    // Track onboarding started
    trackEvent('vendor_onboarding_started', {
      userType: UserType.VENDOR_COMPANY,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const loadOnboardingProgress = async () => {
    try {
      // TODO: Load from Firestore
      const savedData = localStorage.getItem(`vendor-onboarding-${user?.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setOnboardingData(parsed.data);
        setCurrentStep(parsed.currentStep);
        setCompletedSteps(new Set(parsed.completedSteps));
      }
    } catch (error) {
      console.error('Failed to load vendor onboarding progress:', error);
    }
  };

  const saveOnboardingProgress = async (data: Partial<VendorCompanyOnboarding>, step: number) => {
    try {
      // Save to localStorage for now, will replace with Firestore
      const progressData = {
        data,
        currentStep: step,
        completedSteps: Array.from(completedSteps),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`vendor-onboarding-${user?.id}`, JSON.stringify(progressData));

      // Track progress
      trackEvent('vendor_onboarding_step_completed', {
        userType: UserType.VENDOR_COMPANY,
        stepId: step,
        stepTitle: currentStepData?.title,
        completedSteps: completedSteps.size,
        totalSteps: VENDOR_STEPS.length,
        userId: user?.id,
      });
    } catch (error) {
      console.error('Failed to save vendor onboarding progress:', error);
    }
  };

  const handleStepUpdate = (updatedData: Partial<VendorCompanyOnboarding>) => {
    setOnboardingData(prev => ({ ...prev, ...updatedData }));
  };

  const handleNext = async () => {
    if (!currentStepData) return;

    setIsSubmitting(true);
    try {
      // Mark current step as completed
      const newCompletedSteps = new Set(completedSteps);
      newCompletedSteps.add(currentStep);
      setCompletedSteps(newCompletedSteps);

      // Save progress
      await saveOnboardingProgress(onboardingData, currentStep + 1);

      // Move to next step or complete
      if (currentStep < VENDOR_STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Failed to proceed to next step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      const finalData: VendorCompanyOnboarding = {
        ...onboardingData,
        userId: user?.id || '',
        userType: UserType.VENDOR_COMPANY,
        status: OnboardingStatus.COMPLETED,
        currentStep: VENDOR_STEPS.length,
        totalSteps: VENDOR_STEPS.length,
        completedAt: new Date(),
        createdAt: onboardingData.createdAt || new Date(),
        updatedAt: new Date(),
      } as VendorCompanyOnboarding;

      // TODO: Save to Firestore
      console.log('Completing vendor onboarding with data:', finalData);

      // Track completion
      trackEvent('vendor_onboarding_completed', {
        userType: UserType.VENDOR_COMPANY,
        userId: user?.id,
        totalTime: Date.now(), // TODO: Calculate actual time
        completedSteps: completedSteps.size,
        totalSteps: VENDOR_STEPS.length,
        companyName: finalData.companyInfo?.legalName,
        serviceCount: finalData.serviceCatalog?.primaryServices?.length || 0,
      });

      // Clear localStorage
      localStorage.removeItem(`vendor-onboarding-${user?.id}`);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to complete vendor onboarding:', error);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    if (stepId < currentStep) return 'accessible';
    return 'locked';
  };

  const CurrentStepComponent = currentStepData?.component;

  if (!user || !currentStepData || !CurrentStepComponent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building className="w-6 h-6 text-blue-600" />
                Vendor Company Onboarding
              </h1>
              <p className="text-muted-foreground">Set up your AI services company profile</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                Step {currentStep} of {VENDOR_STEPS.length}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                ≈ {remainingTime} min remaining
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}% Complete</span>
              <span>Total time: ≈ {totalEstimatedTime} minutes</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Setup Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {VENDOR_STEPS.map((step) => {
                  const status = getStepStatus(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        status === 'current' 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : status === 'completed'
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/10'
                          : status === 'accessible'
                          ? 'text-muted-foreground cursor-pointer hover:bg-muted'
                          : 'text-muted-foreground/50'
                      }`}
                      onClick={() => {
                        if (status === 'accessible' || status === 'completed') {
                          setCurrentStep(step.id);
                        }
                      }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {step.icon}
                          <div className="text-sm font-medium truncate">
                            {step.title}
                          </div>
                        </div>
                        <div className="text-xs opacity-75 truncate mb-1">
                          {step.description}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>{step.estimatedMinutes} min</span>
                          {step.required && (
                            <span className="text-red-500 font-medium">Required</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {currentStepData.icon}
                  <div>
                    <CardTitle>{currentStepData.title}</CardTitle>
                    <CardDescription>{currentStepData.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CurrentStepComponent
                  data={onboardingData}
                  onUpdate={handleStepUpdate}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                {!currentStepData.required && (
                  <Button
                    variant="ghost"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Skip
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="min-w-24"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : currentStep === VENDOR_STEPS.length ? (
                    'Complete Setup'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}