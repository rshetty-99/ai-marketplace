'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  User, 
  Brain, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Star,
  Target,
  TrendingUp,
  Award,
  ArrowRight,
  Clock
} from 'lucide-react';
import { DocumentUpload } from './document-upload';
import { SkillsAssessment } from './skills-assessment';
import { VerificationStatus } from './verification-status';
import { 
  DocumentType, 
  VerificationStatus as Status,
  AI_ML_SKILLS,
  DATA_SCIENCE_SKILLS,
  SOFTWARE_DEV_SKILLS,
  VERIFICATION_REQUIREMENTS,
  VERIFICATION_COSTS
} from '@/lib/firebase/verification-schema';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/components/providers/analytics-provider';

export interface VerificationCenterProps {
  userId: string;
  userType: 'freelancer' | 'vendor' | 'customer';
  onVerificationComplete?: () => void;
}

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
  estimatedTime: string;
  cost?: number;
}

export function VerificationCenter({ 
  userId, 
  userType, 
  onVerificationComplete 
}: VerificationCenterProps) {
  const { userType: currentUserType } = useAuth();
  const { trackEvent } = useAnalytics();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);

  const requirements = VERIFICATION_REQUIREMENTS[userType];
  const allSkills = [...AI_ML_SKILLS, ...DATA_SCIENCE_SKILLS, ...SOFTWARE_DEV_SKILLS];

  useEffect(() => {
    initializeVerificationSteps();
    trackEvent('verification_center_viewed', {
      userId,
      userType,
      requirements
    });
  }, [userType, userId]);

  const initializeVerificationSteps = () => {
    const steps: VerificationStep[] = [];

    // Identity Verification
    if (requirements.identity) {
      steps.push({
        id: 'identity',
        title: 'Identity Verification',
        description: 'Verify your identity with government-issued documents',
        icon: <User className="w-5 h-5" />,
        status: 'not_started',
        required: true,
        estimatedTime: '5-10 minutes',
        cost: VERIFICATION_COSTS.identityVerification
      });
    }

    // Skills Assessment
    if (requirements.skillAssessment) {
      steps.push({
        id: 'skills',
        title: 'Skills Assessment',
        description: `Complete assessments for ${requirements.minimumSkills || 2} skills minimum`,
        icon: <Brain className="w-5 h-5" />,
        status: 'not_started',
        required: true,
        estimatedTime: '30-60 minutes per skill',
        cost: VERIFICATION_COSTS.skillAssessment
      });
    }

    // Background Check
    if (requirements.backgroundCheck) {
      steps.push({
        id: 'background',
        title: 'Background Check',
        description: 'Professional background verification for enhanced trust',
        icon: <FileText className="w-5 h-5" />,
        status: 'not_started',
        required: true,
        estimatedTime: '2-5 business days',
        cost: VERIFICATION_COSTS.backgroundCheck
      });
    }

    setVerificationSteps(steps);
  };

  const handleStartVerification = (type: 'identity' | 'skills' | 'background') => {
    setActiveStep(type);
    
    trackEvent('verification_step_started', {
      userId,
      verificationType: type,
      userType
    });
  };

  const handleRetryVerification = (type: 'identity' | 'skills' | 'background', id: string) => {
    setActiveStep(type);
    
    trackEvent('verification_step_retried', {
      userId,
      verificationType: type,
      verificationId: id,
      userType
    });
  };

  const handleIdentityUploadComplete = (files: any[]) => {
    // Update verification status
    setVerificationSteps(prev => prev.map(step => 
      step.id === 'identity' 
        ? { ...step, status: 'in_progress' as const }
        : step
    ));

    trackEvent('identity_verification_submitted', {
      userId,
      documentCount: files.length,
      documentTypes: files.map(f => f.type)
    });

    setActiveStep(null);
  };

  const handleSkillsAssessmentComplete = (results: any[]) => {
    const passedSkills = results.filter(r => r.status === 'passed').length;
    const requiredSkills = requirements.minimumSkills || 2;
    
    setVerificationSteps(prev => prev.map(step => 
      step.id === 'skills' 
        ? { 
            ...step, 
            status: passedSkills >= requiredSkills ? 'completed' as const : 'failed' as const 
          }
        : step
    ));

    trackEvent('skills_assessment_completed_all', {
      userId,
      totalSkills: results.length,
      passedSkills,
      requiredSkills,
      averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
    });

    setActiveStep(null);

    if (passedSkills >= requiredSkills) {
      checkOverallCompletion();
    }
  };

  const handleSkillSelection = (skillIds: string[]) => {
    setSelectedSkills(skillIds);
  };

  const checkOverallCompletion = () => {
    const completedSteps = verificationSteps.filter(s => s.status === 'completed').length;
    const requiredSteps = verificationSteps.filter(s => s.required).length;
    
    if (completedSteps >= requiredSteps) {
      onVerificationComplete?.();
      
      trackEvent('verification_completed_all', {
        userId,
        userType,
        completedSteps,
        totalSteps: verificationSteps.length
      });
    }
  };

  const getStepStatusColor = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStepStatusIcon = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const completedSteps = verificationSteps.filter(s => s.status === 'completed').length;
  const totalSteps = verificationSteps.length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // If actively working on a verification step
  if (activeStep === 'identity') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Identity Verification
            </CardTitle>
            <CardDescription>
              Upload your government-issued documents to verify your identity
            </CardDescription>
          </CardHeader>
        </Card>

        <DocumentUpload
          documentType={DocumentType.PASSPORT}
          onUploadComplete={handleIdentityUploadComplete}
          onError={(error) => console.error('Upload error:', error)}
          requiresBothSides={false}
          requiresSelfie={true}
        />

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setActiveStep(null)}
          >
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  if (activeStep === 'skills') {
    if (selectedSkills.length === 0) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Select Skills to Assess
              </CardTitle>
              <CardDescription>
                Choose {requirements.minimumSkills || 2} or more skills to demonstrate your expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ai_ml" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ai_ml">AI & ML</TabsTrigger>
                  <TabsTrigger value="data_science">Data Science</TabsTrigger>
                  <TabsTrigger value="software_dev">Software Dev</TabsTrigger>
                </TabsList>

                <TabsContent value="ai_ml" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AI_ML_SKILLS.map((skill) => (
                      <div
                        key={skill.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedSkills.includes(skill.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                        onClick={() => {
                          if (selectedSkills.includes(skill.id)) {
                            setSelectedSkills(prev => prev.filter(id => id !== skill.id));
                          } else {
                            setSelectedSkills(prev => [...prev, skill.id]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{skill.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {skill.requiredLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {skill.category.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="data_science" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DATA_SCIENCE_SKILLS.map((skill) => (
                      <div
                        key={skill.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedSkills.includes(skill.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                        onClick={() => {
                          if (selectedSkills.includes(skill.id)) {
                            setSelectedSkills(prev => prev.filter(id => id !== skill.id));
                          } else {
                            setSelectedSkills(prev => [...prev, skill.id]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{skill.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {skill.requiredLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {skill.category.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="software_dev" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SOFTWARE_DEV_SKILLS.map((skill) => (
                      <div
                        key={skill.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedSkills.includes(skill.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                        onClick={() => {
                          if (selectedSkills.includes(skill.id)) {
                            setSelectedSkills(prev => prev.filter(id => id !== skill.id));
                          } else {
                            setSelectedSkills(prev => [...prev, skill.id]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{skill.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {skill.requiredLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {skill.category.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between pt-6 border-t">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Selected: {selectedSkills.length} skills (minimum {requirements.minimumSkills || 2} required)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(null)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedSkills.length >= (requirements.minimumSkills || 2)) {
                        // Continue to assessment
                      }
                    }}
                    disabled={selectedSkills.length < (requirements.minimumSkills || 2)}
                  >
                    Start Assessment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <SkillsAssessment
          userId={userId}
          selectedSkills={selectedSkills}
          onAssessmentComplete={handleSkillsAssessmentComplete}
          onProgress={(progress) => {
            trackEvent('skills_assessment_progress', {
              userId,
              ...progress
            });
          }}
        />

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setSelectedSkills([])}
          >
            Change Skills
          </Button>
        </div>
      </div>
    );
  }

  // Main verification overview
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verification Center
          </CardTitle>
          <CardDescription>
            Complete verification to unlock full platform access and build trust with clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge className={progressPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
              {completedSteps} of {totalSteps} steps completed
            </Badge>
            <span className="text-sm text-muted-foreground">
              {progressPercentage}% complete
            </span>
          </div>

          {progressPercentage === 100 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                🎉 Congratulations! Your verification is complete. You now have full access to the platform.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Verification Steps */}
      <div className="grid gap-4">
        {verificationSteps.map((step) => (
          <Card key={step.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{step.title}</h3>
                    <Badge className={getStepStatusColor(step.status)}>
                      {step.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {step.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.estimatedTime}
                    </span>
                    {step.cost !== undefined && (
                      <span>
                        {step.cost > 0 ? `$${step.cost}` : 'Free'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {step.status === 'not_started' && (
                    <Button onClick={() => handleStartVerification(step.id as any)}>
                      Start
                    </Button>
                  )}
                  {step.status === 'in_progress' && (
                    <Button variant="outline" onClick={() => handleStartVerification(step.id as any)}>
                      Continue
                    </Button>
                  )}
                  {step.status === 'failed' && (
                    <Button variant="outline" onClick={() => handleRetryVerification(step.id as any, step.id)}>
                      Retry
                    </Button>
                  )}
                  {step.status === 'completed' && (
                    <Button variant="ghost" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Status View */}
      <VerificationStatus
        userId={userId}
        userType={userType}
        onStartVerification={handleStartVerification}
        onRetryVerification={handleRetryVerification}
      />

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Build Trust</h4>
                <p className="text-xs text-muted-foreground">
                  Verified profiles get 3x more client inquiries
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Showcase Skills</h4>
                <p className="text-xs text-muted-foreground">
                  Demonstrate expertise with certified assessments
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Premium Access</h4>
                <p className="text-xs text-muted-foreground">
                  Unlock advanced features and higher-tier projects
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}