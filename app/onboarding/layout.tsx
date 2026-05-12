"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './onboarding.module.css';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        // Global Guard: Admins/Super Admins should NEVER be in onboarding
        if (user.role === 'admin' || user.role === 'super_admin') {
            router.replace('/dashboard/admin');
            return;
        }

        // Prevent cross-onboarding access
        if (user.role === 'recruiter' && pathname.startsWith('/onboarding/candidate')) {
            router.replace('/onboarding/recruiter/setup');
            return;
        }
        if (user.role === 'candidate' && pathname.startsWith('/onboarding/recruiter')) {
            router.replace('/onboarding/candidate');
            return;
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className={styles.page}>
                <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />
            {children}
        </div>
    );
}

