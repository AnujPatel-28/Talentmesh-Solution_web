"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { insforge } from '@/lib/insforge';
import { forgotPasswordSchema } from '@/lib/validation/auth';
import styles from './forgot.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // 1. Validate email
        const validation = forgotPasswordSchema.safeParse({ email });
        if (!validation.success) {
            setError(validation.error.issues[0].message);
            setIsLoading(false);
            return;
        }

        try {
            // 2. Request reset link
            const { error: resetError } = await insforge.auth.sendResetPasswordEmail({
                email,
            });

            if (resetError) {
                setError(resetError.message);
                setIsLoading(false);
                return;
            }

            setSent(true);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
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
                <Link href="/" className={styles.logoWrap}>
                    <Image
                        src="/TalentMesh_page-0002-removebg-preview.png"
                        alt="TalentMesh"
                        width={150}
                        height={42}
                        unoptimized
                        className={styles.logoImg}
                    />
                </Link>

                {!sent ? (
                    <>
                        <div className={styles.header}>
                            <div className={styles.iconCircle}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h1 className={styles.title}>Reset password</h1>
                            <p className={styles.subtitle}>
                                Enter your email and we&apos;ll send a reset link
                            </p>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            {error && <div style={{ color: '#ef4444', fontSize: '0.82rem', textAlign: 'center', marginBottom: '0.5rem', padding: '0.6rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>{error}</div>}
                            
                            <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor="reset-email">Email address</label>
                                <div className={styles.inputWrap}>
                                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <input
                                        id="reset-email"
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

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className={styles.spinnerWrap}>
                                        <span className={styles.spinner} />
                                        Sending link...
                                    </span>
                                ) : 'Send Reset Link'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h1 className={styles.title}>Check your email</h1>
                        <p className={styles.subtitle}>
                            We&apos;ve sent a reset link to <br/>
                            <strong style={{ color: 'var(--primary-blue)' }}>{email}</strong>
                        </p>
                    </div>
                )}

                <p className={styles.backLine}>
                    Remembered it?{' '}
                    <Link href="/login" className={styles.backLink}>
                        Sign in
                    </Link>
                </p>
            </div>

            {/* Bottom terms */}
            <p className={styles.terms}>
                By using our service, you agree to our{' '}
                <Link href="/terms" className={styles.termsLink}>Terms</Link>
                {' '}&{' '}
                <Link href="/privacy" className={styles.termsLink}>Privacy Policy</Link>
            </p>
        </div>
    );
}
