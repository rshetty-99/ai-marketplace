'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { UserTypeSelection } from '@/components/onboarding/user-type-selection';
import { UserType } from '@/lib/firebase/onboarding-schema';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAnalytics } from '@/components/providers/analytics-provider';

export function OnboardingClient() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in?redirect_url=/onboarding');
      return;
    }

    checkExistingOnboarding();
  }, [user, isLoaded, router]);

  const checkExistingOnboarding = async () => {
    try {
      // Check if this is a test account that should skip onboarding
      const email = user?.primaryEmailAddress?.emailAddress || '';
      const testAccounts = [
        'rshetty99@hotmail.com',
        'rshetty99@gmail.com', 
        'rshetty@techsamur.ai',
        'alsmith141520@gmail.com'
      ];
      
      if (testAccounts.includes(email)) {
        console.log('Test account detected, redirecting to dashboard:', email);
        router.push('/dashboard');
        return;
      }
      
      // Check if user has already completed onboarding
      // For now, check localStorage - replace with Firestore query
      const savedType = localStorage.getItem(`userType-${user?.id}`);
      if (savedType && Object.values(UserType).includes(savedType as UserType)) {
        setSelectedUserType(savedType as UserType);
      }
      
      // Check if already completed
      const onboardingData = localStorage.getItem(`onboarding-${user?.id}`);
      if (onboardingData) {
        const parsed = JSON.parse(onboardingData);
        if (parsed.status === 'completed') {
          router.push('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to check existing onboarding:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleUserTypeSelected = (userType: UserType) => {
    setSelectedUserType(userType);
    localStorage.setItem(`userType-${user?.id}`, userType);
    
    trackEvent('onboarding_user_type_selected', {
      userType,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
  };

  const handleOnboardingComplete = () => {
    trackEvent('onboarding_flow_completed', {
      userType: selectedUserType,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
    
    // Redirect to dashboard
    router.push('/dashboard');
  };

  if (!isLoaded || isLoadingUserData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
        <span className="ml-3 text-lg">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to sign-in
  }

  if (!selectedUserType) {
    return (
      <UserTypeSelection
        onUserTypeSelected={handleUserTypeSelected}
      />
    );
  }

  return (
    <OnboardingWizard
      userType={selectedUserType}
      onComplete={handleOnboardingComplete}
    />
  );
}