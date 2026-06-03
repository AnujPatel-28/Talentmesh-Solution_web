'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import CenteredLoader from '@/components/ui/CenteredLoader';

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
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

    // Always allow access to onboarding and pending-approval pages
    if (pathname.includes('/onboarding') || pathname.includes('/pending-approval') || pathname.includes('/profile')) {
      setChecking(false);
      return;
    }

    const checkRecruiterStatus = async () => {
      try {
        const { data: recProfile } = await insforge.database
          .from('recruiter_profiles')
          .select('company_id, is_approved')
          .eq('id', user.id)
          .single();

        const hasCompany = !!(recProfile?.company_id || user.company_id);
        const isApproved = recProfile?.is_approved === true;

        if (!hasCompany || !user.onboarding_completed) {
          router.push(`/dashboard/recruiter/onboarding?return=${encodeURIComponent(pathname)}`);
        } else if (!isApproved) {
          router.push(`/dashboard/recruiter/pending-approval`);
        } else {
          setChecking(false);
        }
      } catch (err) {
        console.error('Failed to verify recruiter status:', err);
        setChecking(false); // allow access or handle error
      }
    };

    checkRecruiterStatus();
  }, [user, isLoading, isInitialized, pathname, router]);

  if (checking || isLoading || !isInitialized) {
    return <CenteredLoader label="Verifying onboarding status..." />;
  }

  return <>{children}</>;
}
