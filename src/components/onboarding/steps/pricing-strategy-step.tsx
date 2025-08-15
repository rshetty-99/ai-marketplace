'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';

interface PricingStrategyStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function PricingStrategyStep({ onNext, isSubmitting }: PricingStrategyStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Strategy</CardTitle>
        <CardDescription>Set your rates with AI recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Pricing setup coming soon...</p>
        <Button onClick={onNext} disabled={isSubmitting} className="mt-4">
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
}