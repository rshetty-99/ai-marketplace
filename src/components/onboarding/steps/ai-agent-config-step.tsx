'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerOnboarding } from '@/lib/firebase/onboarding-schema';

interface AIAgentConfigStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function AIAgentConfigStep({ onNext, isSubmitting }: AIAgentConfigStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Agent Setup</CardTitle>
        <CardDescription>Configure custom AI tools (optional)</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">AI agent configuration coming soon...</p>
        <Button onClick={onNext} disabled={isSubmitting} className="mt-4">
          {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
        </Button>
      </CardContent>
    </Card>
  );
}