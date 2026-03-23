"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import styles from './login.module.css';

// Admin email list from .env — updateable via NEXT_PUBLIC_ADMIN_EMAILS
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);

    // Detect admin email as the user types
    const isAdminEmail = ADMIN_EMAILS.includes(email.trim().toLowerCase());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Basic Validation
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        setError('');
        setIsEmailUnconfirmed(false);

        try {
            // 2. Attempt sign in
            const result = await signIn(email, password);

            if (result.error) {
                if (result.error.toLowerCase().includes('confirm your email') || result.error.includes('email_not_confirmed')) {
                    setIsEmailUnconfirmed(true);
                    setError('Please confirm your email address before logging in.');
                } else {
                    setError(result.error);
                }
                setIsLoading(false);
                return;
            }

            // 3. Success — let middleware redirect to the right dashboard based on role.
            // router.refresh() re-requests the current page (/login); the middleware
            // sees the authenticated user and redirects to /dashboard/{role}.
            const resolvedRole = result.user?.role;
            const destination = isAdminEmail || resolvedRole === 'admin' || resolvedRole === 'super_admin'
                ? '/dashboard/admin'
                : resolvedRole === 'recruiter'
                    ? '/dashboard/recruiter'
                    : '/dashboard/candidate';

            window.location.assign(destination);
            
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'linkedin') => {
        try {
            setError('');
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
            const { error: authError } = await insforge.auth.signInWithOAuth({
                provider,
                redirectTo: `${siteUrl}/auth/callback`,
            });
            if (authError) throw authError;
        } catch (err: any) {
            setError(`Failed to initiate ${provider} login. Please try again.`);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />

            <div className={styles.card}>
                <Link href="/" className={styles.logoWrap}>
                    <Image
                        src="/TalentMesh_page-0002-removebg-preview.png"
                        alt="TalentMesh"
                        width={180}
                        height={50}
                        unoptimized
                        priority
                        className={styles.logoImg}
                    />
                </Link>

                <div className={styles.header}>
                    <h1 className={styles.title}>Sign in to your account</h1>
                </div>

                <div className={styles.socialRow}>
                    <button className={styles.socialBtn} type="button" onClick={() => handleOAuthLogin('google')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button className={styles.socialBtn} type="button" onClick={() => handleOAuthLogin('linkedin')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        LinkedIn
                    </button>
                </div>

                <div className={styles.divider}>
                    <span className={styles.dividerLine} />
                    <span className={styles.dividerText}>or</span>
                    <span className={styles.dividerLine} />
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                        {isEmailUnconfirmed && (
                            <Link href="/auth/resend-verification" className={styles.resendLink}>
                                Resend email?
                            </Link>
                        )}
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                        <div className={styles.labelRow}>
                            <label className={styles.label} htmlFor="email">Email address</label>
                            {/* Show admin badge when admin email is detected */}
                            {isAdminEmail && (
                                <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: '#6366f1',
                                    background: 'rgba(99,102,241,0.08)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: '100px',
                                    padding: '2px 8px',
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                }}>
                                    Admin Account
                                </span>
                            )}
                        </div>
                        <div className={styles.inputWrap}>
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                placeholder="name@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <div className={styles.labelRow}>
                            <label className={styles.label} htmlFor="password">Password</label>
<<<<<<< HEAD
                            <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
=======
                            {/* Dynamically route admin emails to the admin forgot-password page */}
                            <Link
                                href={isAdminEmail ? '/admin/forgot-password' : '/auth/forgot-password'}
                                className={styles.forgotLink}
                            >
                                Forgot password?
                            </Link>
>>>>>>> 04ac0dec89ba27ffdf447ffa504124b6e2c58b6c
                        </div>
                        <div className={styles.inputWrap}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className={styles.footerLink}>Sign up</Link>
                    </p>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                        <Link href="/admin/login" className={styles.footerLink} style={{ opacity: 0.7 }}>
                            Admin Portal Access
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
