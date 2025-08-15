import { Metadata } from 'next';
import { Suspense } from 'react';
import { OnboardingClient } from './client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Onboarding | AI Marketplace',
  description: 'Complete your profile setup to start using the AI Marketplace platform',
  robots: 'noindex', // Don't index onboarding pages
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size={48} />
            <span className="ml-3 text-lg">Loading onboarding...</span>
          </div>
        }
      >
        <OnboardingClient />
      </Suspense>
    </div>
  );
}