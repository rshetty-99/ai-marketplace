'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Building, Users, FileCheck, Clock, Skip } from 'lucide-react';
import { CustomerOrganizationOnboarding, OnboardingStatus, UserType } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

// Step Components
import { OrganizationInfoStep } from './steps/customer/organization-info-step';
import { RequirementsStep } from './steps/customer/requirements-step';
import { BudgetAndTimelineStep } from './steps/customer/budget-timeline-step';
import { TeamStructureStep } from './steps/customer/team-structure-step';
import { SecurityComplianceStep } from './steps/customer/security-compliance-step';
import { IntegrationRequirementsStep } from './steps/customer/integration-requirements-step';

interface CustomerOnboardingWizardProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

interface StepProps {
  data: Partial<CustomerOrganizationOnboarding>;
  onUpdate: (data: Partial<CustomerOrganizationOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
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
  skippable: boolean;
}

const CUSTOMER_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Organization Information',
    description: 'Company details and basic information',
    component: OrganizationInfoStep,
    required: true,
    estimatedMinutes: 10,
    icon: <Building className="w-4 h-4" />,
    skippable: false,
  },
  {
    id: 2,
    title: 'AI Requirements',
    description: 'Define your AI needs and use cases',
    component: RequirementsStep,
    required: false,
    estimatedMinutes: 15,
    icon: <FileCheck className="w-4 h-4" />,
    skippable: true,
  },
  {
    id: 3,
    title: 'Budget & Timeline',
    description: 'Project budget and timeline expectations',
    component: BudgetAndTimelineStep,
    required: false,
    estimatedMinutes: 8,
    icon: <Clock className="w-4 h-4" />,
    skippable: true,
  },
  {
    id: 4,
    title: 'Team Structure',
    description: 'Your team and decision makers',
    component: TeamStructureStep,
    required: false,
    estimatedMinutes: 12,
    icon: <Users className="w-4 h-4" />,
    skippable: true,
  },
  {
    id: 5,
    title: 'Security & Compliance',
    description: 'Security requirements and compliance needs',
    component: SecurityComplianceStep,
    required: false,
    estimatedMinutes: 10,
    icon: <CheckCircle className="w-4 h-4" />,
    skippable: true,
  },
  {
    id: 6,
    title: 'Integration Requirements',
    description: 'Technical integration and system requirements',
    component: IntegrationRequirementsStep,
    required: false,
    estimatedMinutes: 15,
    icon: <Building className="w-4 h-4" />,
    skippable: true,
  },
];

export function CustomerOnboardingWizard({ onComplete, onSkip }: CustomerOnboardingWizardProps) {
  const { user } = useUser();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<CustomerOrganizationOnboarding>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());
  const [isDraft, setIsDraft] = useState(false);

  const currentStepData = CUSTOMER_STEPS.find(step => step.id === currentStep);
  const totalSteps = CUSTOMER_STEPS.length;
  const completedCount = completedSteps.size;
  const skippedCount = skippedSteps.size;
  const progress = ((completedCount + skippedCount) / totalSteps) * 100;
  
  const totalEstimatedTime = CUSTOMER_STEPS.reduce((sum, step) => sum + step.estimatedMinutes, 0);
  const remainingTime = CUSTOMER_STEPS
    .filter(step => !completedSteps.has(step.id) && !skippedSteps.has(step.id))
    .reduce((sum, step) => sum + step.estimatedMinutes, 0);

  useEffect(() => {
    // Load existing onboarding data if any
    loadOnboardingProgress();
    
    // Track onboarding started
    trackEvent('customer_onboarding_started', {
      userType: UserType.CUSTOMER_ORGANIZATION,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const loadOnboardingProgress = async () => {
    try {
      // TODO: Load from Firestore
      const savedData = localStorage.getItem(`customer-onboarding-${user?.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setOnboardingData(parsed.data);
        setCurrentStep(parsed.currentStep);
        setCompletedSteps(new Set(parsed.completedSteps));
        setSkippedSteps(new Set(parsed.skippedSteps || []));
        setIsDraft(parsed.isDraft || false);
      }
    } catch (error) {
      console.error('Failed to load customer onboarding progress:', error);
    }
  };

  const saveOnboardingProgress = async (data: Partial<CustomerOrganizationOnboarding>, step: number, draft: boolean = false) => {
    try {
      // Save to localStorage for now, will replace with Firestore
      const progressData = {
        data,
        currentStep: step,
        completedSteps: Array.from(completedSteps),
        skippedSteps: Array.from(skippedSteps),
        isDraft: draft,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`customer-onboarding-${user?.id}`, JSON.stringify(progressData));

      // Track progress
      trackEvent('customer_onboarding_step_completed', {
        userType: UserType.CUSTOMER_ORGANIZATION,
        stepId: step,
        stepTitle: currentStepData?.title,
        completedSteps: completedSteps.size,
        skippedSteps: skippedSteps.size,
        totalSteps: CUSTOMER_STEPS.length,
        userId: user?.id,
        isDraft: draft,
      });
    } catch (error) {
      console.error('Failed to save customer onboarding progress:', error);
    }
  };

  const handleStepUpdate = (updatedData: Partial<CustomerOrganizationOnboarding>) => {
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

      // Remove from skipped if it was skipped before
      const newSkippedSteps = new Set(skippedSteps);
      newSkippedSteps.delete(currentStep);
      setSkippedSteps(newSkippedSteps);

      // Save progress
      await saveOnboardingProgress(onboardingData, currentStep + 1);

      // Move to next step or complete
      if (currentStep < CUSTOMER_STEPS.length) {
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

  const handleSkipStep = async () => {
    if (!currentStepData || !currentStepData.skippable) return;

    setIsSubmitting(true);
    try {
      // Mark current step as skipped
      const newSkippedSteps = new Set(skippedSteps);
      newSkippedSteps.add(currentStep);
      setSkippedSteps(newSkippedSteps);

      // Remove from completed if it was completed before
      const newCompletedSteps = new Set(completedSteps);
      newCompletedSteps.delete(currentStep);
      setCompletedSteps(newCompletedSteps);

      // Save progress
      await saveOnboardingProgress(onboardingData, currentStep + 1);

      trackEvent('customer_onboarding_step_skipped', {
        stepId: currentStep,
        stepTitle: currentStepData?.title,
        userId: user?.id,
      });

      // Move to next step or complete
      if (currentStep < CUSTOMER_STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Failed to skip step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);
    try {
      setIsDraft(true);
      await saveOnboardingProgress(onboardingData, currentStep, true);
      
      trackEvent('customer_onboarding_saved_as_draft', {
        currentStep,
        completedSteps: completedSteps.size,
        skippedSteps: skippedSteps.size,
        userId: user?.id,
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save as draft:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      trackEvent('customer_onboarding_skipped_entirely', {
        userId: user?.id,
        currentStep,
      });

      // Clear any saved progress
      localStorage.removeItem(`customer-onboarding-${user?.id}`);

      if (onSkip) {
        onSkip();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      const finalData: CustomerOrganizationOnboarding = {
        ...onboardingData,
        userId: user?.id || '',
        userType: UserType.CUSTOMER_ORGANIZATION,
        status: OnboardingStatus.COMPLETED,
        currentStep: CUSTOMER_STEPS.length,
        totalSteps: CUSTOMER_STEPS.length,
        completedAt: new Date(),
        createdAt: onboardingData.createdAt || new Date(),
        updatedAt: new Date(),
        skippedSteps: Array.from(skippedSteps),
      } as CustomerOrganizationOnboarding;

      // TODO: Save to Firestore
      console.log('Completing customer onboarding with data:', finalData);

      // Track completion
      trackEvent('customer_onboarding_completed', {
        userType: UserType.CUSTOMER_ORGANIZATION,
        userId: user?.id,
        totalTime: Date.now(), // TODO: Calculate actual time
        completedSteps: completedSteps.size,
        skippedSteps: skippedSteps.size,
        totalSteps: CUSTOMER_STEPS.length,
        organizationName: finalData.organizationInfo?.companyName,
      });

      // Clear localStorage
      localStorage.removeItem(`customer-onboarding-${user?.id}`);

      if (onComplete) {
        onComplete();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete customer onboarding:', error);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (skippedSteps.has(stepId)) return 'skipped';
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
                <Building className="w-6 h-6 text-green-600" />
                Customer Organization Setup
              </h1>
              <p className="text-muted-foreground">Help us understand your AI needs (Optional - can be completed later)</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                Step {currentStep} of {CUSTOMER_STEPS.length}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                ≈ {remainingTime} min remaining
              </Badge>
              {isDraft && (
                <Badge variant="default" className="px-3 py-1">
                  Draft Saved
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}% Complete ({completedCount} completed, {skippedCount} skipped)</span>
              <span>Total estimated time: ≈ {totalEstimatedTime} minutes</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveAsDraft}>
                Save as Draft
              </Button>
              <Button variant="ghost" onClick={handleSkipOnboarding}>
                Skip Setup
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              You can complete this setup later in your dashboard
            </p>
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
                {CUSTOMER_STEPS.map((step) => {
                  const status = getStepStatus(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        status === 'current' 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : status === 'completed'
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/10'
                          : status === 'skipped'
                          ? 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/10'
                          : status === 'accessible'
                          ? 'text-muted-foreground cursor-pointer hover:bg-muted'
                          : 'text-muted-foreground/50'
                      }`}
                      onClick={() => {
                        if (status === 'accessible' || status === 'completed' || status === 'skipped') {
                          setCurrentStep(step.id);
                        }
                      }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : status === 'skipped' ? (
                          <Skip className="h-4 w-4" />
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
                          <div className="flex gap-1">
                            {step.required && (
                              <span className="text-red-500 font-medium">Required</span>
                            )}
                            {step.skippable && (
                              <span className="text-blue-500 font-medium">Optional</span>
                            )}
                          </div>
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
                    <CardTitle className="flex items-center gap-2">
                      {currentStepData.title}
                      {currentStepData.skippable && (
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      )}
                      {currentStepData.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </CardTitle>
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
                  onSkip={handleSkipStep}
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
                {currentStepData.skippable && (
                  <Button
                    variant="ghost"
                    onClick={handleSkipStep}
                    disabled={isSubmitting}
                  >
                    <Skip className="mr-2 h-4 w-4" />
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
                  ) : currentStep === CUSTOMER_STEPS.length ? (
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