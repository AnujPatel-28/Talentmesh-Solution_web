"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from '../forgot-password/forgot.module.css';

/**
 * Recruiter Pending Approval / Under Review Screen.
 * Blocked recruiters are redirected here by middleware/proxy.ts if status is 'pending'.
 */
export default function PendingApprovalPage() {
    const router = useRouter();
    const { logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
            router.push('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Background decorations */}
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />

            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logoWrap}>
                    <Image
                        src="/TalentMesh_page-0002-removebg-preview.png"
                        alt="TalentMesh"
                        width={150}
                        height={42}
                        unoptimized
                        className={styles.logoImg}
                    />
                </div>

                <div className={styles.successState}>
                    <div className={styles.successIcon} style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pulse 2s infinite' }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>

                    <h1 className={styles.title}>Account Under Review</h1>
                    <p className={styles.subtitle} style={{ fontSize: '0.88rem', lineHeight: '1.45rem', marginTop: '0.5rem', color: '#64748b' }}>
                        Thank you for registering! Your recruiter application is currently being vetted by our administration team.
                        <br /><br />
                        We will review your company details, credentials, and verification documents. You will receive an email notification as soon as your account is activated.
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className={styles.submitBtn}
                    style={{ background: '#1e293b', boxShadow: '0 4px 12px rgba(30, 41, 59, 0.2)' }}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className={styles.spinnerWrap}>
                            <span className={styles.spinner} />
                            Logging out...
                        </span>
                    ) : 'Back to Login'}
                </button>
            </div>

            {/* Bottom terms */}
            <p className={styles.terms}>
                Need immediate assistance?{' '}
                <a href="mailto:support@talentmesh.app" className={styles.termsLink}>Contact Support</a>
            </p>
        </div>
    );
}
