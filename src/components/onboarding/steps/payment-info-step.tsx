'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';

interface PaymentInfoStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function PaymentInfoStep({ onNext, isSubmitting }: PaymentInfoStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
        <CardDescription>Banking and payment method setup</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Payment setup coming soon...</p>
        <Button onClick={onNext} disabled={isSubmitting} className="mt-4">
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
}