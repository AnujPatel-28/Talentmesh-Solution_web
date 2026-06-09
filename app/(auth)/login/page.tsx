"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge, directInsforge } from '@/lib/insforge';
import { getMyProfile } from '@/lib/api/profile';
import styles from './login.module.css';


function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, signOut } = useAuth();

    const reason = searchParams.get('reason');
    const errorParam = searchParams.get('error');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (errorParam) {
            if (errorParam === 'session_fetch_failed') {
                setError('Session retrieval failed after OAuth callback.');
            } else if (errorParam === 'callback_error') {
                setError('An error occurred during authentication callback.');
            } else {
                setError(errorParam.replace(/_/g, ' '));
            }
        }
    }, [errorParam]);
    const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(120);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // 2-minute OTP expiration timer
    useEffect(() => {
        if (!otpSentAt) return;
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
            const remaining = Math.max(0, 120 - elapsed);
            setTimeLeft(remaining);
            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [otpSentAt]);

    const handleResendCode = useCallback(async () => {
        if (resendCooldown > 0 || !email) return;
        try {
            await insforge.auth.resendVerificationEmail({ email });
            setResendCooldown(60);
            setOtpSentAt(Date.now());
            setTimeLeft(120);
            setShowVerification(true);
            setError('');
        } catch {
            setError('Failed to resend verification code. Please try again.');
        }
    }, [email, resendCooldown]);

    const handleVerifyFromLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (timeLeft <= 0) {
            setError('Verification code has expired. Please resend code to get a new one.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const { data, error: verifyError } = await insforge.auth.verifyEmail({
                email,
                otp,
            });

            if (verifyError) {
                setError(verifyError.message || 'Invalid verification code.');
                setIsLoading(false);
                return;
            }

            if (!data?.user) {
                setError('Verification failed. Please try again.');
                setIsLoading(false);
                return;
            }

            // Email verified! Now sign in automatically
            setIsEmailUnconfirmed(false);
            setShowVerification(false);
            setOtp('');

            // Auto-login after verification
            const result = await signIn(email, password);
            if (result.error) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            // Redirect based on profile
            let profile;
            try {
                profile = await getMyProfile(result.accessToken);
            } catch (err) {
                console.error('Failed to fetch profile during auto-login:', err);
            }
            
            if (!profile) {
                router.push('/onboarding/candidate');
                return;
            }

            const role = profile.role || 'candidate';
            const isAdminRole = role === 'admin' || role === 'super_admin';
            const isOnboarded = 
                profile.onboarding_complete === true || 
                profile.is_onboarded === true || 
                profile.onboarding_completed === true || 
                profile.completed_onboarding === true;

            if (isAdminRole) {
                router.push('/admin/dashboard');
            } else if (role === 'recruiter') {
                let hasRecruiterData = false;
                try {
                    const { createClient } = await import('@insforge/sdk');
                    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/remote` : (process.env.NEXT_PUBLIC_INSFORGE_URL || '');
                    const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;
                    const authedClient = createClient({ baseUrl, anonKey, edgeFunctionToken: result.accessToken, isServerMode: false });
                    const { data: recProfile } = await authedClient.database
                        .from('recruiter_profiles')
                        .select('company_id, job_title')
                        .eq('id', profile.id)
                        .single();
                    if (recProfile && recProfile.company_id && recProfile.job_title) {
                        hasRecruiterData = true;
                    }
                } catch (err) {
                    console.error('Failed to check recruiter profile data during login verification:', err);
                }

                router.push((isOnboarded && hasRecruiterData) ? '/recruiter/dashboard' : '/onboarding/recruiter/setup');
            } else {
                // Candidate
                router.push(isOnboarded ? '/candidate/dashboard' : '/onboarding/candidate');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed.');
            setIsLoading(false);
        }
    };


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

            // sees the authenticated user and redirects to /dashboard/{role}.
            // 🔥 STEP 1 — Use user from signIn result first, fallback to getMyProfile
            const userFromAuth = result.user;
            let profile: any = userFromAuth;
            
            try {

                const fetchedProfile = await getMyProfile(result.accessToken);
                if (fetchedProfile) {
                    profile = fetchedProfile;
                }
            } catch (err) {
                console.error('Failed to fetch detailed profile during login:', err);
                // We still have userFromAuth, so we can continue
            }

            const role = profile?.role || 'candidate';
            const isAdminRole = role === 'admin' || role === 'super_admin';

            console.log(`Login successful. User role: ${role}. Redirecting...`);

            // 🔥 STEP 2 — Redirect logic with safety delay for cookie persistence
            const getSubdomainUrl = (subdomain: string, path: string) => {
                if (typeof window === 'undefined') return path;
                const host = window.location.host;
                const proto = window.location.protocol;
                const cleanHost = host.replace(/^(jobs|app|admin)\./, '');
                let url = `${proto}//${subdomain}.${cleanHost}${path}`;
                if (result.accessToken) {
                    const separator = url.includes('?') ? '&' : '?';
                    url = `${url}${separator}token=${result.accessToken}`;
                }
                return url;
            };

            let destination = '';
            
            const isOnboarded = 
                (profile as any)?.onboarding_complete === true ||
                (profile as any)?.is_onboarded === true || 
                (profile as any)?.onboarding_completed === true || 
                (profile as any)?.completed_onboarding === true;
            
            if (isAdminRole) {
                destination = getSubdomainUrl('admin', '/admin/dashboard');
            } else if (role === 'recruiter') {
                let hasRecruiterData = false;
                try {
                    const { createClient } = await import('@insforge/sdk');
                    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/remote` : (process.env.NEXT_PUBLIC_INSFORGE_URL || '');
                    const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;
                    const authedClient = createClient({ baseUrl, anonKey, edgeFunctionToken: result.accessToken, isServerMode: false });
                    const { data: recProfile } = await authedClient.database
                        .from('recruiter_profiles')
                        .select('company_id, job_title')
                        .eq('id', profile.id)
                        .single();
                    if (recProfile && recProfile.company_id && recProfile.job_title) {
                        hasRecruiterData = true;
                    }
                } catch (err) {
                    console.error('Failed to check recruiter profile data during login:', err);
                }

                destination = (isOnboarded && hasRecruiterData) 
                    ? getSubdomainUrl('app', '/recruiter/dashboard') 
                    : getSubdomainUrl('app', '/onboarding/recruiter/setup');
            } else {
                // Candidate
                destination = isOnboarded 
                    ? getSubdomainUrl('jobs', '/') 
                    : getSubdomainUrl('jobs', '/onboarding/candidate');
            }

            setTimeout(() => {
                window.location.href = destination;
            }, 150);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'linkedin') => {
        try {
            setError('');
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
            const { data, error: authError } = await directInsforge.auth.signInWithOAuth({
                provider,
                redirectTo: `${siteUrl}/auth/callback`,
                skipBrowserRedirect: true,
            });
            if (authError) throw authError;
            if (data?.url) {
                let finalUrl = data.url;
                if (provider === 'google') {
                    const urlObj = new URL(finalUrl);
                    urlObj.searchParams.set('prompt', 'select_account');
                    finalUrl = urlObj.toString();
                }
                window.location.href = finalUrl;
            }
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
                        style={{ height: 'auto' }}
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

                {reason === 'session_expired' && (
                    <div className={styles.sessionExpiredBanner}>
                        Your session expired. Please log in again.
                    </div>
                )}

                {error && (
                    <div className={styles.errorMessage} data-testid="login-error" role="alert">
                        {error}
                        {isEmailUnconfirmed && !showVerification && (
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={resendCooldown > 0}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: resendCooldown > 0 ? '#9ca3af' : '#6366f1',
                                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                                    marginLeft: '6px',
                                    padding: 0,
                                }}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification code'}
                            </button>
                        )}
                    </div>
                )}

                {/* Inline OTP verification for unverified users */}
                {showVerification && (
                    <form onSubmit={handleVerifyFromLogin} style={{ marginBottom: '1rem' }}>
                        <div style={{
                            background: 'rgba(99,102,241,0.06)',
                            border: '1px solid rgba(99,102,241,0.15)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <p style={{ fontSize: '0.82rem', color: '#4b5563', marginBottom: '0.75rem', textAlign: 'center' }}>
                                Enter the 6-digit code sent to <strong>{email}</strong>
                            </p>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                disabled={isLoading}
                                style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}
                                autoFocus
                            />
                            <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                                {timeLeft > 0 ? (
                                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                        Code expires in <span style={{ fontWeight: 600, color: '#6366f1' }}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                    </p>
                                ) : (
                                    <p style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                                        Code has expired. Please resend code.
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={isLoading || otp.length < 6 || timeLeft <= 0}
                                style={{ width: '100%', marginBottom: '0.5rem' }}
                            >
                                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                            </button>
                            <div style={{ textAlign: 'center' }}>
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={resendCooldown > 0}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: resendCooldown > 0 ? '#9ca3af' : '#6366f1',
                                        cursor: resendCooldown > 0 ? 'default' : 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 500,
                                        textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                                    }}
                                >
                                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                        <div className={styles.labelRow}>
                            <label className={styles.label} htmlFor="email">Email address</label>
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
                            {/* Dynamically route admin emails to the admin forgot-password page */}
                            <Link
                                href="/forgot-password"
                                className={styles.forgotLink}
                            >
                                Forgot password?
                            </Link>
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
                    <p style={{ marginTop: '0.75rem' }}>
                        Need to verify your account?{' '}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!email) {
                                    setError('Please enter your email address above first to verify your account.');
                                    document.getElementById('email')?.focus();
                                    return;
                                }
                                setError('');
                                setIsEmailUnconfirmed(true);
                                if (resendCooldown <= 0) {
                                    handleResendCode();
                                } else {
                                    setShowVerification(true);
                                }
                            }}
                            className={styles.footerLink}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                        >
                            Verify email
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className={styles.page}>
                <div className={styles.bgGlow1} />
                <div className={styles.bgGlow2} />
                <div className={styles.gridOverlay} />
                <div className={styles.card}>
                    <p style={{ color: '#6b6b8a', textAlign: 'center' }}>Loading...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
