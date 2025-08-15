'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';

interface PortfolioStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function PortfolioStep({ onNext, isSubmitting }: PortfolioStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio & Experience</CardTitle>
          <CardDescription>
            Showcase your work and connect your professional profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Portfolio upload coming soon...</p>
          <Button onClick={onNext} disabled={isSubmitting} className="mt-4">
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}