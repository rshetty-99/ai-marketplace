'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Cloud, CloudOff } from 'lucide-react';
import { UserType, OnboardingStatus, FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

// Step Components
import { PersonalInfoStep } from './steps/personal-info-step';
import { SkillsAssessmentStep } from './steps/skills-assessment-step';
import { PortfolioStep } from './steps/portfolio-step';
import { PricingStrategyStep } from './steps/pricing-strategy-step';
import { PaymentInfoStep } from './steps/payment-info-step';
import { TaxInfoStep } from './steps/tax-info-step';
import { BackgroundCheckStep } from './steps/background-check-step';
import { PersonalityAssessmentStep } from './steps/personality-assessment-step';
import { AIAgentConfigStep } from './steps/ai-agent-config-step';

interface OnboardingWizardProps {
  userType: UserType;
  onComplete?: () => void;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  required: boolean;
  estimatedMinutes: number;
}

interface StepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const FREELANCER_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Personal Information',
    description: 'Basic profile and identity verification',
    component: PersonalInfoStep,
    required: true,
    estimatedMinutes: 5,
  },
  {
    id: 2,
    title: 'Skills Assessment',
    description: 'AI-proctored skills testing and verification',
    component: SkillsAssessmentStep,
    required: true,
    estimatedMinutes: 30,
  },
  {
    id: 3,
    title: 'Portfolio & Experience',
    description: 'Upload work samples and connect integrations',
    component: PortfolioStep,
    required: true,
    estimatedMinutes: 15,
  },
  {
    id: 4,
    title: 'Pricing Strategy',
    description: 'Set your rates with AI recommendations',
    component: PricingStrategyStep,
    required: true,
    estimatedMinutes: 10,
  },
  {
    id: 5,
    title: 'Payment Information',
    description: 'Banking and payment method setup',
    component: PaymentInfoStep,
    required: true,
    estimatedMinutes: 8,
  },
  {
    id: 6,
    title: 'Tax Information',
    description: 'Tax forms and business structure',
    component: TaxInfoStep,
    required: true,
    estimatedMinutes: 5,
  },
  {
    id: 7,
    title: 'Background Check',
    description: 'Consent and verification process',
    component: BackgroundCheckStep,
    required: true,
    estimatedMinutes: 3,
  },
  {
    id: 8,
    title: 'Work Style Assessment',
    description: 'Personality and work preference analysis',
    component: PersonalityAssessmentStep,
    required: false,
    estimatedMinutes: 12,
  },
  {
    id: 9,
    title: 'AI Agent Setup',
    description: 'Configure custom AI tools (optional)',
    component: AIAgentConfigStep,
    required: false,
    estimatedMinutes: 10,
  },
];

export function OnboardingWizard({ userType, onComplete }: OnboardingWizardProps) {
  const { user } = useUser();
  const { trackEvent } = useAnalytics();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<FreelancerOnboarding>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const steps = userType === UserType.FREELANCER ? FREELANCER_STEPS : [];
  const currentStepData = steps.find(step => step.id === currentStep);
  const progress = (currentStep / steps.length) * 100;

  useEffect(() => {
    // Load existing onboarding data if any
    loadOnboardingProgress();
    
    // Track onboarding started
    trackEvent('onboarding_started', {
      userType,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user?.id, userType, trackEvent]);

  const loadOnboardingProgress = async () => {
    try {
      // TODO: Load from Firestore
      const savedData = localStorage.getItem(`onboarding-${user?.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setOnboardingData(parsed.data);
        setCurrentStep(parsed.currentStep);
        setCompletedSteps(new Set(parsed.completedSteps));
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
    }
  };

  const saveOnboardingProgress = async (data: Partial<FreelancerOnboarding>, step: number, isAutoSave = false) => {
    try {
      setIsSaving(true);
      
      // Save to localStorage for now, will replace with Firestore
      const progressData = {
        data,
        currentStep: step,
        completedSteps: Array.from(completedSteps),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`onboarding-${user?.id}`, JSON.stringify(progressData));

      // Track progress (only for step completion, not auto-saves)
      if (!isAutoSave) {
        trackEvent('onboarding_step_completed', {
          userType,
          stepId: step,
          stepTitle: currentStepData?.title,
          completedSteps: completedSteps.size,
          totalSteps: steps.length,
          userId: user?.id,
        });
      }
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = useCallback((data: Partial<FreelancerOnboarding>, step: number) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (debounced by 1 second)
    saveTimeoutRef.current = setTimeout(() => {
      saveOnboardingProgress(data, step, true);
    }, 1000);
  }, []);

  const handleStepUpdate = useCallback((updatedData: Partial<FreelancerOnboarding>) => {
    setOnboardingData(prev => {
      const newData = { ...prev, ...updatedData };
      
      // Auto-save data with debouncing
      debouncedSave(newData, currentStep);
      
      return newData;
    });
  }, [currentStep, debouncedSave]);

  const handleNext = async () => {
    if (!currentStepData) return;

    setIsSubmitting(true);
    try {
      // Clear any pending debounced saves and save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Mark current step as completed
      const newCompletedSteps = new Set(completedSteps);
      newCompletedSteps.add(currentStep);
      setCompletedSteps(newCompletedSteps);

      // Save progress (immediate save, not auto-save)
      await saveOnboardingProgress(onboardingData, currentStep + 1, false);

      // Move to next step or complete
      if (currentStep < steps.length) {
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
      const finalData: FreelancerOnboarding = {
        ...onboardingData,
        userId: user?.id || '',
        userType: UserType.FREELANCER,
        status: OnboardingStatus.COMPLETED,
        currentStep: steps.length,
        totalSteps: steps.length,
        completedAt: new Date(),
        createdAt: onboardingData.createdAt || new Date(),
        updatedAt: new Date(),
      } as FreelancerOnboarding;

      // TODO: Save to Firestore
      console.log('Completing onboarding with data:', finalData);

      // Track completion
      trackEvent('onboarding_completed', {
        userType,
        userId: user?.id,
        totalTime: Date.now(), // TODO: Calculate actual time
        completedSteps: completedSteps.size,
        totalSteps: steps.length,
        onboardingScore: calculateOnboardingScore(finalData),
      });

      // Clear localStorage
      localStorage.removeItem(`onboarding-${user?.id}`);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const calculateOnboardingScore = (data: FreelancerOnboarding): number => {
    let score = 0;
    
    // Base completion score
    score += (completedSteps.size / steps.length) * 40;
    
    // Identity verification bonus
    if (data.personalInfo?.identityVerification?.status === 'verified') {
      score += 10;
    }
    
    // Skills assessment bonus
    if (data.skillsAssessment?.assessmentResults?.length > 0) {
      const avgScore = data.skillsAssessment.assessmentResults.reduce(
        (sum, result) => sum + result.score, 0
      ) / data.skillsAssessment.assessmentResults.length;
      score += (avgScore / 100) * 20;
    }
    
    // Portfolio quality bonus
    if (data.portfolio?.aiVerification) {
      score += (data.portfolio.aiVerification.originalityScore / 100) * 15;
    }
    
    // Background check bonus
    if (data.backgroundCheck?.status === 'verified') {
      score += 10;
    }
    
    // Cap at 100
    return Math.min(Math.round(score), 100);
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
              <h1 className="text-2xl font-bold">Freelancer Onboarding</h1>
              <p className="text-muted-foreground">Complete your profile to start receiving projects</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isSaving ? (
                  <>
                    <Cloud className="h-4 w-4 animate-pulse" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Cloud className="h-4 w-4 text-green-600" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4" />
                    <span>Not saved</span>
                  </>
                )}
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                Step {currentStep} of {steps.length}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}% Complete</span>
              <span>≈ {currentStepData.estimatedMinutes} min remaining</span>
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
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {steps.map((step) => {
                  const status = getStepStatus(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                        status === 'current' 
                          ? 'bg-primary/10 text-primary' 
                          : status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
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
                        <div className="text-sm font-medium truncate">
                          {step.title}
                        </div>
                        <div className="text-xs opacity-75 truncate">
                          {step.estimatedMinutes} min
                          {step.required && (
                            <span className="ml-1 text-red-500">*</span>
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
                <CardTitle>{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
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
                  ) : currentStep === steps.length ? (
                    'Complete'
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