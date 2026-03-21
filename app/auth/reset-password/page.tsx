"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { insforge } from '@/lib/insforge';
import { resetPasswordSchema } from '@/lib/validation/auth';
import styles from './reset.module.css';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // 1. Validate with resetPasswordSchema
        const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
        if (!validation.success) {
            setError(validation.error.issues[0].message);
            setIsLoading(false);
            return;
        }

        try {
            // 2. Update password
            if (!token) {
                setError('Invalid or expired reset token. Please request a new one.');
                setIsLoading(false);
                return;
            }

            const { error: resetError } = await insforge.auth.resetPassword({
                newPassword: password,
                otp: token,
            });

            if (resetError) {
                setError(resetError.message);
                setIsLoading(false);
                return;
            }

            setSuccess(true);
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

                {!success ? (
                    <>
                        <div className={styles.header}>
                            <div className={styles.formIconCircle}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l2.5-2.5" />
                                </svg>
                            </div>
                            <h1 className={styles.title}>New password</h1>
                            <p className={styles.subtitle}>
                                Set a strong password for your account
                            </p>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            {error && <div style={{ color: '#ef4444', fontSize: '0.82rem', textAlign: 'center', marginBottom: '0.5rem', padding: '0.6rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>{error}</div>}

                            <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor="password">New Password</label>
                                <div className={styles.inputWrap}>
                                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        id="password"
                                        type="password"
                                        className={styles.input}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                                <div className={styles.inputWrap}>
                                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        className={styles.input}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
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
                                        Updating...
                                    </span>
                                ) : 'Reset Password'}
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
                        <h1 className={styles.title}>Password updated</h1>
                        <p className={styles.subtitle}>
                            Your password has been reset successfully. <br />
                            You can now sign in with your new password.
                        </p>
                    </div>
                )}

                <p className={styles.footer}>
                    {success ? (
                        <Link href="/login" className={styles.loginLink}>Back to sign in</Link>
                    ) : (
                        <>
                            Wait, I remember it!{' '}
                            <Link href="/login" className={styles.loginLink}>Sign in</Link>
                        </>
                    )}
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
