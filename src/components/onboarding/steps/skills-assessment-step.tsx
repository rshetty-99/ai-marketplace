'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Play, AlertCircle } from 'lucide-react';
import { FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';

interface SkillsAssessmentStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function SkillsAssessmentStep({ data, onUpdate, onNext, isSubmitting }: SkillsAssessmentStepProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    data.skillsAssessment?.primarySkills || []
  );
  const [currentAssessment, setCurrentAssessment] = useState<string | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState(0);

  const availableSkills = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 
    'Python', 'Java', 'C++', 'PHP', 'Ruby',
    'UI/UX Design', 'Figma', 'Adobe Creative Suite',
    'Digital Marketing', 'SEO', 'Content Writing',
    'Data Science', 'Machine Learning', 'AI Development'
  ];

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const startAssessment = (skill: string) => {
    setCurrentAssessment(skill);
    setAssessmentProgress(0);
    
    // Simulate assessment progress
    const interval = setInterval(() => {
      setAssessmentProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeAssessment(skill);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const completeAssessment = (skill: string) => {
    const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100
    
    const newResult = {
      skill,
      level: mockScore > 90 ? 'expert' as const : 
             mockScore > 80 ? 'advanced' as const :
             mockScore > 70 ? 'intermediate' as const : 'beginner' as const,
      score: mockScore,
      testType: 'multiple_choice' as const,
      completedAt: new Date(),
    };

    const updatedResults = [
      ...(data.skillsAssessment?.assessmentResults || []),
      newResult
    ];

    onUpdate({
      skillsAssessment: {
        ...data.skillsAssessment,
        primarySkills: selectedSkills,
        assessmentResults: updatedResults,
      },
    });

    setCurrentAssessment(null);
    setAssessmentProgress(0);
  };

  const handleContinue = () => {
    onUpdate({
      skillsAssessment: {
        ...data.skillsAssessment,
        primarySkills: selectedSkills,
      },
    });
    onNext();
  };

  const getSkillStatus = (skill: string) => {
    const result = data.skillsAssessment?.assessmentResults?.find(r => r.skill === skill);
    if (result) return 'completed';
    if (currentAssessment === skill) return 'in-progress';
    if (selectedSkills.includes(skill)) return 'selected';
    return 'available';
  };

  const completedAssessments = data.skillsAssessment?.assessmentResults || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Skills Assessment</h3>
        <p className="text-muted-foreground">
          Complete AI-proctored assessments to verify your expertise
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {completedAssessments.length} completed
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-500" />
            ≈ 5-10 min per assessment
          </span>
        </div>
      </div>

      {/* Current Assessment in Progress */}
      {currentAssessment && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
              Assessment in Progress: {currentAssessment}
            </CardTitle>
            <CardDescription>
              AI proctor is monitoring your session for integrity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={assessmentProgress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {Math.floor(assessmentProgress / 10) + 1} of 10</span>
                <span>{assessmentProgress}% complete</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <AlertCircle className="w-4 h-4" />
                <span>AI proctor active - Please maintain focus on the assessment</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Skills</CardTitle>
          <CardDescription>
            Choose the skills you want to be assessed on (select 3-8 skills)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableSkills.map((skill) => {
              const status = getSkillStatus(skill);
              const result = completedAssessments.find(r => r.skill === skill);
              
              return (
                <div key={skill} className="space-y-2">
                  <Button
                    type="button"
                    variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleSkillToggle(skill)}
                    disabled={currentAssessment !== null}
                  >
                    {status === 'completed' && (
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    )}
                    {status === 'in-progress' && (
                      <div className="w-4 h-4 mr-2 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
                    )}
                    {skill}
                  </Button>
                  
                  {result && (
                    <div className="flex justify-between items-center text-xs">
                      <Badge 
                        variant={
                          result.level === 'expert' ? 'default' :
                          result.level === 'advanced' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {result.level}
                      </Badge>
                      <span className="text-muted-foreground">{result.score}%</span>
                    </div>
                  )}
                  
                  {selectedSkills.includes(skill) && status === 'selected' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => startAssessment(skill)}
                      disabled={currentAssessment !== null}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start Assessment
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Selected skills: {selectedSkills.length} 
            {selectedSkills.length < 3 && ' (minimum 3 required)'}
            {selectedSkills.length > 8 && ' (maximum 8 recommended)'}
          </div>
        </CardContent>
      </Card>

      {/* Assessment Results */}
      {completedAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Results</CardTitle>
            <CardDescription>
              Your skill verification scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedAssessments.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium">{result.skill}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.testType.replace('_', ' ')} • {result.level}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{result.score}%</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={selectedSkills.length < 3 || currentAssessment !== null || isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}