'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Trophy, 
  Target,
  Code,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Star,
  TrendingUp
} from 'lucide-react';
import { 
  SkillAssessment, 
  AssessmentType, 
  AssessmentStatus, 
  SkillLevel,
  SkillCategory,
  QuestionResponse,
  AI_ML_SKILLS,
  DATA_SCIENCE_SKILLS,
  SOFTWARE_DEV_SKILLS,
  ASSESSMENT_CONFIG
} from '@/lib/firebase/verification-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface SkillsAssessmentProps {
  userId: string;
  selectedSkills: string[];
  onAssessmentComplete: (results: AssessmentResult[]) => void;
  onProgress: (progress: AssessmentProgress) => void;
}

interface AssessmentResult {
  skillId: string;
  skillName: string;
  score: number;
  level: SkillLevel;
  status: AssessmentStatus;
  timeSpent: number;
  feedback?: string;
}

interface AssessmentProgress {
  currentSkill: number;
  totalSkills: number;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
}

interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'code' | 'essay' | 'file_upload';
  question: string;
  description?: string;
  options?: string[];
  correctAnswer?: any;
  points: number;
  timeLimit?: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  codeTemplate?: string;
  language?: string;
}

// Sample questions for different skills
const SAMPLE_QUESTIONS: Record<string, AssessmentQuestion[]> = {
  python_ml: [
    {
      id: 'py_ml_1',
      type: 'multiple_choice',
      question: 'Which library is primarily used for numerical computing in Python?',
      options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
      correctAnswer: 0,
      points: 5,
      difficulty: 'easy'
    },
    {
      id: 'py_ml_2',
      type: 'code',
      question: 'Write a function to normalize a NumPy array to have values between 0 and 1.',
      description: 'Implement min-max normalization: (x - min) / (max - min)',
      codeTemplate: `import numpy as np

def normalize_array(arr):
    """
    Normalize array values to range [0, 1]
    Args:
        arr: Input numpy array
    Returns:
        Normalized numpy array
    """
    # Your code here
    pass

# Test your function
test_array = np.array([1, 5, 10, 15, 20])
result = normalize_array(test_array)
print(result)`,
      language: 'python',
      points: 15,
      timeLimit: 10,
      difficulty: 'medium'
    },
    {
      id: 'py_ml_3',
      type: 'multiple_choice',
      question: 'What is the main difference between supervised and unsupervised learning?',
      options: [
        'Supervised learning uses labeled data, unsupervised learning uses unlabeled data',
        'Supervised learning is faster than unsupervised learning',
        'Supervised learning only works with numerical data',
        'There is no significant difference'
      ],
      correctAnswer: 0,
      points: 10,
      difficulty: 'medium'
    },
    {
      id: 'py_ml_4',
      type: 'essay',
      question: 'Explain the bias-variance tradeoff in machine learning and provide an example.',
      description: 'Discuss how bias and variance affect model performance and give a practical example.',
      points: 20,
      timeLimit: 15,
      difficulty: 'hard'
    }
  ],
  react_development: [
    {
      id: 'react_1',
      type: 'multiple_choice',
      question: 'What is the purpose of the useEffect hook in React?',
      options: [
        'To manage component state',
        'To handle side effects in functional components',
        'To create context providers',
        'To optimize component rendering'
      ],
      correctAnswer: 1,
      points: 5,
      difficulty: 'easy'
    },
    {
      id: 'react_2',
      type: 'code',
      question: 'Create a custom hook that manages a counter with increment and decrement functionality.',
      codeTemplate: `import { useState } from 'react';

export function useCounter(initialValue = 0) {
  // Your implementation here
}

// Usage example:
// const { count, increment, decrement, reset } = useCounter(0);`,
      language: 'javascript',
      points: 15,
      timeLimit: 8,
      difficulty: 'medium'
    }
  ]
};

export function SkillsAssessment({ 
  userId, 
  selectedSkills, 
  onAssessmentComplete, 
  onProgress 
}: SkillsAssessmentProps) {
  const { trackEvent } = useAnalytics();
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentPaused, setAssessmentPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [skillResults, setSkillResults] = useState<Record<string, AssessmentResult>>({});
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, any>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Get all available skills
  const allSkills = [...AI_ML_SKILLS, ...DATA_SCIENCE_SKILLS, ...SOFTWARE_DEV_SKILLS];
  const assessmentSkills = allSkills.filter(skill => selectedSkills.includes(skill.id));
  const currentSkill = assessmentSkills[currentSkillIndex];
  const currentQuestions = SAMPLE_QUESTIONS[currentSkill?.id] || [];
  const currentQuestion = currentQuestions[currentQuestionIndex];

  // Calculate progress
  const progress: AssessmentProgress = {
    currentSkill: currentSkillIndex + 1,
    totalSkills: assessmentSkills.length,
    currentQuestion: currentQuestionIndex + 1,
    totalQuestions: currentQuestions.length,
    timeRemaining
  };

  // Timer effect
  useEffect(() => {
    if (!assessmentStarted || assessmentPaused || !currentQuestion?.timeLimit) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up for this question
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessmentStarted, assessmentPaused, currentQuestion, currentQuestionIndex]);

  // Update progress
  useEffect(() => {
    onProgress(progress);
  }, [currentSkillIndex, currentQuestionIndex, timeRemaining, onProgress]);

  const startAssessment = () => {
    setAssessmentStarted(true);
    setStartTime(new Date());
    
    // Set initial time limit
    if (currentQuestion?.timeLimit) {
      setTimeRemaining(currentQuestion.timeLimit * 60); // Convert to seconds
    }

    trackEvent('skills_assessment_started', {
      userId,
      skillIds: selectedSkills,
      totalSkills: assessmentSkills.length
    });
  };

  const pauseAssessment = () => {
    setAssessmentPaused(!assessmentPaused);
    
    trackEvent('skills_assessment_paused', {
      userId,
      currentSkill: currentSkill?.id,
      paused: !assessmentPaused
    });
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const calculateQuestionScore = (question: AssessmentQuestion, userAnswer: any): number => {
    if (!userAnswer) return 0;

    switch (question.type) {
      case 'multiple_choice':
        return userAnswer === question.correctAnswer ? question.points : 0;
      
      case 'code':
        // In a real implementation, this would run the code and check correctness
        // For demo purposes, we'll simulate scoring
        return Math.floor(Math.random() * question.points);
      
      case 'essay':
        // This would require manual review or AI scoring
        // For demo, return partial credit
        return Math.floor(question.points * 0.7);
      
      default:
        return 0;
    }
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;

    // Record answer and score
    const userAnswer = currentAnswers[currentQuestion.id];
    const score = calculateQuestionScore(currentQuestion, userAnswer);
    
    trackEvent('assessment_question_answered', {
      userId,
      skillId: currentSkill.id,
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      score,
      maxScore: currentQuestion.points,
      timeSpent: currentQuestion.timeLimit ? (currentQuestion.timeLimit * 60 - timeRemaining) : 0
    });

    // Move to next question or skill
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      
      // Set timer for next question
      const nextQuestion = currentQuestions[currentQuestionIndex + 1];
      if (nextQuestion?.timeLimit) {
        setTimeRemaining(nextQuestion.timeLimit * 60);
      }
    } else {
      // Finish current skill assessment
      finishSkillAssessment();
    }
  };

  const finishSkillAssessment = () => {
    if (!currentSkill) return;

    // Calculate total score for this skill
    let totalScore = 0;
    let maxScore = 0;

    currentQuestions.forEach(question => {
      const userAnswer = currentAnswers[question.id];
      totalScore += calculateQuestionScore(question, userAnswer);
      maxScore += question.points;
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const level = getSkillLevel(percentage);
    const status = percentage >= ASSESSMENT_CONFIG.passingScore ? AssessmentStatus.PASSED : AssessmentStatus.FAILED;

    const result: AssessmentResult = {
      skillId: currentSkill.id,
      skillName: currentSkill.name,
      score: percentage,
      level,
      status,
      timeSpent: startTime ? Math.round((Date.now() - startTime.getTime()) / 1000 / 60) : 0,
      feedback: generateFeedback(percentage, level)
    };

    setSkillResults(prev => ({
      ...prev,
      [currentSkill.id]: result
    }));

    trackEvent('skill_assessment_completed', {
      userId,
      skillId: currentSkill.id,
      score: percentage,
      level,
      status,
      timeSpent: result.timeSpent
    });

    // Move to next skill or finish assessment
    if (currentSkillIndex < assessmentSkills.length - 1) {
      setCurrentSkillIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setCurrentAnswers({});
      setStartTime(new Date());
      
      // Set timer for first question of next skill
      const nextSkillQuestions = SAMPLE_QUESTIONS[assessmentSkills[currentSkillIndex + 1]?.id];
      if (nextSkillQuestions?.[0]?.timeLimit) {
        setTimeRemaining(nextSkillQuestions[0].timeLimit * 60);
      }
    } else {
      // All assessments complete
      const allResults = Object.values({ ...skillResults, [currentSkill.id]: result });
      onAssessmentComplete(allResults);
      
      trackEvent('skills_assessment_completed', {
        userId,
        totalSkills: assessmentSkills.length,
        averageScore: allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length,
        passedSkills: allResults.filter(r => r.status === AssessmentStatus.PASSED).length
      });
    }
  };

  const getSkillLevel = (score: number): SkillLevel => {
    if (score >= ASSESSMENT_CONFIG.skillLevelThresholds[SkillLevel.EXPERT]) return SkillLevel.EXPERT;
    if (score >= ASSESSMENT_CONFIG.skillLevelThresholds[SkillLevel.ADVANCED]) return SkillLevel.ADVANCED;
    if (score >= ASSESSMENT_CONFIG.skillLevelThresholds[SkillLevel.INTERMEDIATE]) return SkillLevel.INTERMEDIATE;
    return SkillLevel.BEGINNER;
  };

  const generateFeedback = (score: number, level: SkillLevel): string => {
    if (score >= 90) return "Excellent performance! You demonstrate expert-level knowledge in this skill.";
    if (score >= 80) return "Great job! You have advanced knowledge with room for minor improvements.";
    if (score >= 70) return "Good work! You have solid intermediate skills. Consider practicing advanced concepts.";
    if (score >= 60) return "You have basic knowledge. Focus on strengthening fundamentals and practicing more.";
    return "Consider additional study and practice before retaking this assessment.";
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSkillLevelColor = (level: SkillLevel) => {
    switch (level) {
      case SkillLevel.EXPERT: return 'text-purple-600 bg-purple-100';
      case SkillLevel.ADVANCED: return 'text-blue-600 bg-blue-100';
      case SkillLevel.INTERMEDIATE: return 'text-green-600 bg-green-100';
      case SkillLevel.BEGINNER: return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Pre-assessment view
  if (!assessmentStarted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Skills Assessment
            </CardTitle>
            <CardDescription>
              Complete assessments for {assessmentSkills.length} selected skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessmentSkills.map((skill, index) => (
                <div key={skill.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {skill.category.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className={getSkillLevelColor(skill.requiredLevel)}>
                      {skill.requiredLevel}
                    </Badge>
                  </div>
                  <h4 className="font-medium">{skill.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Est. {SAMPLE_QUESTIONS[skill.id]?.length * 5 || 15} minutes
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Assessment Guidelines:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Each skill has multiple questions with time limits</li>
                  <li>• You need {ASSESSMENT_CONFIG.passingScore}% to pass each skill</li>
                  <li>• You can pause the assessment if needed</li>
                  <li>• Maximum {ASSESSMENT_CONFIG.maxAttempts} attempts per skill</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button onClick={startAssessment} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment in progress
  if (!currentSkill || !currentQuestion) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Assessment Complete!</h3>
        <p className="text-muted-foreground">Processing your results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">{currentSkill.name}</h3>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {currentQuestions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {currentQuestion.timeLimit && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className={`font-mono ${timeRemaining < 30 ? 'text-red-600' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={pauseAssessment}
              >
                {assessmentPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{currentSkillIndex + 1} of {assessmentSkills.length} skills</span>
            </div>
            <Progress 
              value={((currentSkillIndex * currentQuestions.length + currentQuestionIndex) / 
                     (assessmentSkills.length * currentQuestions.length)) * 100} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      {!assessmentPaused && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {currentQuestion.difficulty.toUpperCase()} • {currentQuestion.points} points
              </Badge>
              <Badge variant="secondary">
                {currentQuestion.type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{currentQuestion.question}</h4>
              {currentQuestion.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {currentQuestion.description}
                </p>
              )}
            </div>

            {/* Multiple Choice Question */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <RadioGroup
                value={currentAnswers[currentQuestion.id]?.toString()}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Code Question */}
            {currentQuestion.type === 'code' && (
              <div className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{currentQuestion.codeTemplate}</pre>
                </div>
                <Textarea
                  placeholder="Write your solution here..."
                  value={currentAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={10}
                  className="font-mono"
                />
              </div>
            )}

            {/* Essay Question */}
            {currentQuestion.type === 'essay' && (
              <Textarea
                placeholder="Type your answer here..."
                value={currentAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={8}
              />
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(prev => prev - 1);
                  }
                }}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex === currentQuestions.length - 1 ? 'Finish Skill' : 'Next Question'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paused State */}
      {assessmentPaused && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Pause className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Assessment Paused</h3>
              <p className="text-muted-foreground mb-6">
                Take your time. Click resume when you're ready to continue.
              </p>
              <Button onClick={pauseAssessment}>
                <Play className="w-4 h-4 mr-2" />
                Resume Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}