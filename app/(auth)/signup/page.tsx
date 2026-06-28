"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './signup.module.css';
import RoleSelection from '@/components/auth/RoleSelection';

export default function SignupPage() {
    const router = useRouter();

    const handleRoleSelect = (selectedRole: 'candidate' | 'recruiter', variant?: 'call' | 'application') => {
        if (selectedRole === 'candidate') {
            router.push('/signup/candidate');
        } else if (selectedRole === 'recruiter') {
            const query = variant ? `?variant=${variant}` : '';
            router.push(`/signup/recruiter${query}`);
        }
    };

    return (
        <div className={styles.page}>
            {/* Background decorations */}
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />

            <RoleSelection onSelect={handleRoleSelect} />

            {/* Bottom terms */}
            <p className={styles.terms}>
                Protected by TalentMesh ·{' '}
                <a href="/terms" className={styles.termsLink}>Terms</a>
                {' '}&{' '}
                <a href="/privacy" className={styles.termsLink}>Privacy</a>
            </p>
        </div>
    );
}
