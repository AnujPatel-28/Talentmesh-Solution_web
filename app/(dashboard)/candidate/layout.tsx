'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import CenteredLoader from '@/components/ui/CenteredLoader';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Always allow access to onboarding
    if (pathname.startsWith('/candidate/onboarding') || pathname.startsWith('/dashboard/candidate/onboarding')) {
      setChecking(false);
      return;
    }

    // Always allow profile edit (let them complete profile naturally)
    if (pathname.includes('/profile')) {
      setChecking(false);
      return;
    }

    // Check if onboarding is complete
    const onboardingDone = user.onboarding_completed === true;

    if (!onboardingDone) {
      // Redirect to onboarding with current page as return URL
      router.push(`/onboarding/candidate?return=${encodeURIComponent(pathname)}`);
    } else {
      setChecking(false);
    }
  }, [user, isLoading, isInitialized, pathname, router]);

  if (checking || isLoading || !isInitialized) {
    return <CenteredLoader label="Verifying onboarding status..." />;
  }

  return <>{children}</>;
}
