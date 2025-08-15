'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';

interface TaxInfoStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function TaxInfoStep({ onNext, isSubmitting }: TaxInfoStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Information</CardTitle>
        <CardDescription>Tax forms and business structure</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Tax information setup coming soon...</p>
        <Button onClick={onNext} disabled={isSubmitting} className="mt-4">
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
}