"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './forgot.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setSent(true);
        }, 1500);
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                {/* Blobs inside dark card */}
                <div className={styles.blob1} />
                <div className={styles.blob2} />

                <div className={styles.inner}>
                    <Link href="/" className={styles.logoLink}>
                        <Image
                            src="/TalentMesh_page-0002-removebg-preview.png"
                            alt="TalentMesh"
                            width={140}
                            height={39}
                            unoptimized
                            style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
                        />
                    </Link>

                    {!sent ? (
                        <>
                            <div className={styles.header}>
                                <div className={styles.iconCircle}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <h1 className={styles.title}>Reset your password</h1>
                                <p className={styles.subtitle}>
                                    Enter your email and we&apos;ll send a reset link right away.
                                </p>
                            </div>

                            <form className={styles.form} onSubmit={handleSubmit}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="reset-email">Email address</label>
                                    <div className={styles.inputWrap}>
                                        <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                            Sending...
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
                                We&apos;ve sent a reset link to{' '}
                                <strong style={{ color: '#60a5fa' }}>{email}</strong>
                            </p>
                        </div>
                    )}

                    <p className={styles.backLine}>
                        Remember your password?{' '}
                        <Link href="/login" className={styles.backLink}>
                            Back to sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
