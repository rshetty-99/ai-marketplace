'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';

interface BackgroundCheckStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function BackgroundCheckStep({ onNext, isSubmitting }: BackgroundCheckStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Background Check</CardTitle>
        <CardDescription>Consent and verification process</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Background check coming soon...</p>
        <Button onClick={onNext} disabled={isSubmitting} className="mt-4">
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
}