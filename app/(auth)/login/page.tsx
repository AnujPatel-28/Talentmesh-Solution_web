
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './login.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1500);
    };

    return (
        <div className={styles.page}>

            {/* ── LEFT PANEL: Branding on white ── */}
            <div className={styles.leftPanel}>
                <div className={styles.leftContent}>

                    <Link href="/" className={styles.logoWrap}>
                        <Image
                            src="/TalentMesh_page-0002-removebg-preview.png"
                            alt="TalentMesh"
                            width={160}
                            height={44}
                            unoptimized
                            className={styles.logoImg}
                        />
                    </Link>

                    <div className={styles.brandingText}>
                        <h1 className={styles.brandTitle}>
                            Welcome back to the{' '}
                            <span>future of hiring</span>
                        </h1>
                        <p className={styles.brandDesc}>
                            Log in to access your AI-powered recruitment dashboard, manage pipelines, and connect with top talent.
                        </p>
                    </div>

                    <div className={styles.statsGroup}>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>50K+</span>
                            <span className={styles.statLabel}>Companies</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>2M+</span>
                            <span className={styles.statLabel}>Candidates</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>98%</span>
                            <span className={styles.statLabel}>Match Rate</span>
                        </div>
                    </div>

                    <div className={styles.testimonialCard}>
                        <span className={styles.testimonialQuote}>&ldquo;</span>
                        <p className={styles.testimonialText}>
                            TalentMesh cut our time-to-hire by 65%. The AI matching is genuinely remarkable — we&apos;ve never hired better.
                        </p>
                        <div className={styles.testimonialAuthor}>
                            <div className={styles.testimonialAvatar}>SR</div>
                            <div>
                                <div className={styles.testimonialName}>Sarah R.</div>
                                <div className={styles.testimonialRole}>Head of Talent, Stripe</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── RIGHT PANEL: Dark form card ── */}
            <div className={styles.rightPanel}>
                <div className={styles.formCard}>
                    {/* Animated blobs inside card */}
                    <div className={styles.bgBlob1} />
                    <div className={styles.bgBlob2} />
                    <div className={styles.bgBlob3} />

                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>Sign in</h2>
                        <p className={styles.formSubtitle}>
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className={styles.switchLink}>Create one free</Link>
                        </p>
                    </div>

                    {/* Social Login */}
                    <div className={styles.socialButtons}>
                        <button className={styles.socialBtn} type="button">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                        <button className={styles.socialBtn} type="button">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            Continue with LinkedIn
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <span className={styles.dividerLine} />
                        <span className={styles.dividerText}>or sign in with email</span>
                        <span className={styles.dividerLine} />
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label} htmlFor="email">Email address</label>
                            <div className={styles.inputWrap}>
                                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <input
                                    id="email"
                                    type="email"
                                    className={styles.input}
                                    placeholder="you@company.com"
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
                                <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
                            </div>
                            <div className={styles.inputWrap}>
                                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={styles.input}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className={styles.eyeBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={styles.checkboxRow}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                />
                                <span className={styles.checkboxCustom} />
                                <span className={styles.checkboxText}>Remember me for 30 days</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className={styles.spinnerWrap}>
                                    <span className={styles.spinner} />
                                    Signing in...
                                </span>
                            ) : (
                                <>
                                    Sign In
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <p className={styles.terms}>
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className={styles.termsLink}>Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className={styles.termsLink}>Privacy Policy</Link>
                    </p>

                </div>
            </div>

        </div>
    );
}
