'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';

interface PersonalityAssessmentStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function PersonalityAssessmentStep({ onNext, isSubmitting }: PersonalityAssessmentStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Style Assessment</CardTitle>
        <CardDescription>Personality and work preference analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Personality assessment coming soon...</p>
        <Button onClick={onNext} disabled={isSubmitting} className="mt-4">
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
}