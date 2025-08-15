'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Shield, 
  FileText, 
  Brain,
  User,
  Calendar,
  ExternalLink,
  RefreshCw,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';
import { 
  VerificationStatus as Status,
  IdentityVerification,
  SkillAssessment,
  BackgroundCheck,
  AssessmentStatus,
  SkillLevel,
  VERIFICATION_REQUIREMENTS
} from '@/lib/firebase/verification-schema';
import { useAuth } from '@/hooks/useAuth';

interface VerificationStatusProps {
  userId: string;
  userType: 'freelancer' | 'vendor' | 'customer';
  onStartVerification: (type: 'identity' | 'skills' | 'background') => void;
  onRetryVerification: (type: 'identity' | 'skills' | 'background', id: string) => void;
}

interface VerificationSummary {
  identity?: IdentityVerification;
  skills: SkillAssessment[];
  backgroundCheck?: BackgroundCheck;
  overallStatus: 'complete' | 'in_progress' | 'incomplete' | 'failed';
  completionPercentage: number;
}

// Mock data - replace with actual API calls
const MOCK_VERIFICATION_DATA: VerificationSummary = {
  identity: {
    id: 'identity_123',
    userId: 'user_123',
    status: Status.APPROVED,
    verificationMethod: 'document',
    documentType: 'passport',
    documentUrl: 'https://example.com/passport.jpg',
    verifiedAt: new Date('2024-01-15'),
    verifiedBy: 'admin_456',
    metadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      location: {
        country: 'United States',
        region: 'California',
        city: 'San Francisco'
      }
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  skills: [
    {
      id: 'skill_123',
      userId: 'user_123',
      skillId: 'python_ml',
      skillName: 'Python for Machine Learning',
      skillCategory: 'ai_ml' as any,
      assessmentType: 'coding_challenge' as any,
      status: AssessmentStatus.PASSED,
      score: 85,
      level: SkillLevel.ADVANCED,
      certificateUrl: 'https://example.com/cert.pdf',
      assessmentData: { questions: [] },
      attemptCount: 1,
      maxAttempts: 3,
      timeSpentMinutes: 45,
      passedAt: new Date('2024-01-20'),
      feedback: 'Excellent understanding of ML concepts and Python implementation.',
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 'skill_124',
      userId: 'user_123',
      skillId: 'react_development',
      skillName: 'React Development',
      skillCategory: 'software_development' as any,
      assessmentType: 'project_submission' as any,
      status: AssessmentStatus.FAILED,
      score: 65,
      level: SkillLevel.INTERMEDIATE,
      assessmentData: { questions: [] },
      attemptCount: 1,
      maxAttempts: 3,
      timeSpentMinutes: 120,
      feedback: 'Good foundation but needs improvement in advanced React patterns.',
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-24')
    }
  ],
  backgroundCheck: {
    id: 'bg_123',
    userId: 'user_123',
    provider: 'checkr',
    status: Status.IN_REVIEW,
    checkTypes: ['criminal_history', 'employment_verification'],
    results: {
      criminalHistory: { status: 'clear', completedAt: new Date() },
      employmentVerification: { status: 'pending' }
    },
    cost: 29.99,
    currency: 'USD',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-26')
  },
  overallStatus: 'in_progress',
  completionPercentage: 75
};

export function VerificationStatus({ 
  userId, 
  userType, 
  onStartVerification, 
  onRetryVerification 
}: VerificationStatusProps) {
  const { userType: currentUserType } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationSummary>(MOCK_VERIFICATION_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const requirements = VERIFICATION_REQUIREMENTS[userType];

  useEffect(() => {
    loadVerificationStatus();
  }, [userId]);

  const loadVerificationStatus = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, fetch from API
      // const data = await fetchVerificationStatus(userId);
      // setVerificationData(data);
      
      // For demo, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerificationData(MOCK_VERIFICATION_DATA);
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.APPROVED: return <CheckCircle className="w-5 h-5 text-green-600" />;
      case Status.PENDING: 
      case Status.IN_REVIEW: return <Clock className="w-5 h-5 text-yellow-600" />;
      case Status.REJECTED: return <XCircle className="w-5 h-5 text-red-600" />;
      case Status.REQUIRES_RESUBMISSION: return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.APPROVED: return 'text-green-600 bg-green-100';
      case Status.PENDING: 
      case Status.IN_REVIEW: return 'text-yellow-600 bg-yellow-100';
      case Status.REJECTED: return 'text-red-600 bg-red-100';
      case Status.REQUIRES_RESUBMISSION: return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSkillLevelIcon = (level: SkillLevel) => {
    switch (level) {
      case SkillLevel.EXPERT: return <Award className="w-4 h-4 text-purple-600" />;
      case SkillLevel.ADVANCED: return <Star className="w-4 h-4 text-blue-600" />;
      case SkillLevel.INTERMEDIATE: return <TrendingUp className="w-4 h-4 text-green-600" />;
      case SkillLevel.BEGINNER: return <User className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'incomplete': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verification Status
              </CardTitle>
              <CardDescription>
                Complete verification to unlock full platform access
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadVerificationStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge className={getOverallStatusColor(verificationData.overallStatus)}>
              {verificationData.overallStatus.replace('_', ' ').toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {verificationData.completionPercentage}% Complete
            </span>
          </div>
          <Progress value={verificationData.completionPercentage} className="mb-4" />
          
          {verificationData.overallStatus === 'complete' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                🎉 Congratulations! Your verification is complete. You now have full access to the platform.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="identity" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Identity
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="background" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Background
          </TabsTrigger>
        </TabsList>

        {/* Identity Verification Tab */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Identity Verification
                {requirements.identity && <Badge variant="destructive" className="text-xs">Required</Badge>}
              </CardTitle>
              <CardDescription>
                Verify your identity with government-issued documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationData.identity ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(verificationData.identity.status)}
                      <div>
                        <div className="font-medium">
                          {verificationData.identity.documentType?.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {verificationData.identity.verificationMethod} verification
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(verificationData.identity.status)}>
                        {verificationData.identity.status.replace('_', ' ')}
                      </Badge>
                      {verificationData.identity.verifiedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Verified {verificationData.identity.verifiedAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {verificationData.identity.status === Status.REJECTED && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Verification Rejected:</strong> Please review the feedback and resubmit your documents.
                      </AlertDescription>
                    </Alert>
                  )}

                  {verificationData.identity.status === Status.REQUIRES_RESUBMISSION && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => onRetryVerification('identity', verificationData.identity!.id)}
                      >
                        Resubmit Documents
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Identity Verification Not Started</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload government-issued ID to verify your identity
                  </p>
                  <Button onClick={() => onStartVerification('identity')}>
                    Start Identity Verification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Assessment Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Skills Assessment
                {requirements.skillAssessment && <Badge variant="destructive" className="text-xs">Required</Badge>}
              </CardTitle>
              <CardDescription>
                Demonstrate your expertise through skills assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationData.skills.length > 0 ? (
                <div className="space-y-4">
                  {verificationData.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSkillLevelIcon(skill.level)}
                        <div>
                          <div className="font-medium">{skill.skillName}</div>
                          <div className="text-sm text-muted-foreground">
                            {skill.skillCategory.replace('_', ' ')} • {skill.timeSpentMinutes} minutes
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={skill.status === AssessmentStatus.PASSED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {skill.status}
                          </Badge>
                          <span className="font-mono text-sm">{skill.score}%</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {skill.level.toUpperCase()}
                        </Badge>
                        {skill.certificateUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto mt-1"
                            onClick={() => window.open(skill.certificateUrl, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {verificationData.skills.filter(s => s.status === AssessmentStatus.PASSED).length} of {verificationData.skills.length} skills passed
                      </span>
                    </div>
                    <Button variant="outline" onClick={() => onStartVerification('skills')}>
                      Take More Assessments
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Skills Assessed</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete skills assessments to showcase your expertise
                  </p>
                  <Button onClick={() => onStartVerification('skills')}>
                    Start Skills Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Background Check Tab */}
        <TabsContent value="background">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Background Check
                {requirements.backgroundCheck && <Badge variant="destructive" className="text-xs">Required</Badge>}
              </CardTitle>
              <CardDescription>
                Professional background verification for enhanced trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationData.backgroundCheck ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(verificationData.backgroundCheck.status)}
                      <div>
                        <div className="font-medium">Background Check</div>
                        <div className="text-sm text-muted-foreground">
                          Provider: {verificationData.backgroundCheck.provider}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(verificationData.backgroundCheck.status)}>
                        {verificationData.backgroundCheck.status.replace('_', ' ')}
                      </Badge>
                      {verificationData.backgroundCheck.cost && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ${verificationData.backgroundCheck.cost}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Check Results:</h4>
                    {Object.entries(verificationData.backgroundCheck.results).map(([checkType, result]) => (
                      result && (
                        <div key={checkType} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{checkType.replace('_', ' ')}</span>
                          <Badge 
                            variant="outline" 
                            className={
                              result.status === 'clear' ? 'text-green-600' :
                              result.status === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }
                          >
                            {result.status}
                          </Badge>
                        </div>
                      )
                    ))}
                  </div>

                  {verificationData.backgroundCheck.reportUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(verificationData.backgroundCheck!.reportUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Report
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Background Check Not Started</h3>
                  <p className="text-muted-foreground mb-4">
                    Professional background verification builds client trust
                  </p>
                  <Button onClick={() => onStartVerification('background')}>
                    Start Background Check
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      {verificationData.overallStatus !== 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!verificationData.identity && requirements.identity && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Complete identity verification to unlock basic platform features</span>
                </div>
              )}
              
              {verificationData.skills.length < (requirements.minimumSkills || 1) && requirements.skillAssessment && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Pass at least {requirements.minimumSkills || 1} skills assessment(s) to demonstrate expertise</span>
                </div>
              )}
              
              {!verificationData.backgroundCheck && requirements.backgroundCheck && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Complete background check for premium marketplace access</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}