"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './signup.module.css';

type Role = 'job_seeker' | 'employer' | '';

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<Role>('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        company: '',
        agree: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1500);
    };

    const passwordStrength = () => {
        const p = formData.password;
        if (!p) return 0;
        let score = 0;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        return score;
    };

    const strength = passwordStrength();
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#10b981'][strength];

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
                            Join thousands{' '}
                            <span>building great teams</span>
                        </h1>
                        <p className={styles.brandDesc}>
                            TalentMesh uses cutting-edge AI to connect the right people with the right opportunities — start free today.
                        </p>
                    </div>

                    <ul className={styles.featureList}>
                        {[
                            { icon: '⚡', text: 'AI-powered candidate matching in seconds' },
                            { icon: '📊', text: 'Real-time hiring analytics & insights' },
                            { icon: '🔒', text: 'Enterprise-grade security & compliance' },
                            { icon: '🤝', text: '10,000+ successful placements monthly' },
                        ].map((f, i) => (
                            <li key={i} className={styles.featureItem}>
                                <span className={styles.featureIcon}>{f.icon}</span>
                                <span className={styles.featureText}>{f.text}</span>
                            </li>
                        ))}
                    </ul>

                    <div className={styles.trustBadges}>
                        <div className={styles.trustBadge}>
                            <span className={styles.trustStars}>★★★★★</span>
                            <span className={styles.trustText}>4.9/5 on G2</span>
                        </div>
                        <div className={styles.trustBadge}>
                            <span className={styles.trustStars}>★★★★★</span>
                            <span className={styles.trustText}>4.8/5 Capterra</span>
                        </div>
                        <div className={styles.trustBadge}>
                            <span className={styles.trustBadgeIcon}>🏆</span>
                            <span className={styles.trustText}>#1 AI Recruiting</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── RIGHT PANEL: Dark form card ── */}
            <div className={styles.rightPanel}>
                <div className={styles.formCard}>
                    {/* Animated blobs inside dark card */}
                    <div className={styles.bgBlob1} />
                    <div className={styles.bgBlob2} />
                    <div className={styles.bgBlob3} />

                    {/* Progress */}
                    <div className={styles.progress}>
                        <div className={styles.progressSteps}>
                            <div className={`${styles.progressStep} ${step >= 1 ? styles.progressActive : ''}`}>
                                <span className={styles.progressDot}>1</span>
                                <span className={styles.progressStepLabel}>Role</span>
                            </div>
                            <div className={`${styles.progressLine} ${step >= 2 ? styles.progressLineActive : ''}`} />
                            <div className={`${styles.progressStep} ${step >= 2 ? styles.progressActive : ''}`}>
                                <span className={styles.progressDot}>2</span>
                                <span className={styles.progressStepLabel}>Details</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>
                            {step === 1 ? 'Create your account' : 'Tell us about yourself'}
                        </h2>
                        <p className={styles.formSubtitle}>
                            Already have an account?{' '}
                            <Link href="/login" className={styles.switchLink}>Sign in</Link>
                        </p>
                    </div>

                    {/* STEP 1: Role selection */}
                    {step === 1 && (
                        <div className={styles.stepContent}>
                            <p className={styles.stepLabel}>I&apos;m joining as a:</p>

                            <div className={styles.roleCards}>
                                <button
                                    type="button"
                                    className={`${styles.roleCard} ${role === 'job_seeker' ? styles.roleCardActive : ''}`}
                                    onClick={() => setRole('job_seeker')}
                                    id="role-job-seeker"
                                >
                                    <div className={styles.roleCardIcon}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                    <div className={styles.roleCardContent}>
                                        <span className={styles.roleCardTitle}>Job Seeker</span>
                                        <span className={styles.roleCardDesc}>Find your dream job with AI matching</span>
                                    </div>
                                    <div className={styles.roleCardCheck}>
                                        {role === 'job_seeker' && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.roleCard} ${role === 'employer' ? styles.roleCardActive : ''}`}
                                    onClick={() => setRole('employer')}
                                    id="role-employer"
                                >
                                    <div className={styles.roleCardIcon}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                        </svg>
                                    </div>
                                    <div className={styles.roleCardContent}>
                                        <span className={styles.roleCardTitle}>Employer / Recruiter</span>
                                        <span className={styles.roleCardDesc}>Hire top talent with AI-powered sourcing</span>
                                    </div>
                                    <div className={styles.roleCardCheck}>
                                        {role === 'employer' && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            </div>

                            <div className={styles.socialButtons}>
                                <button className={styles.socialBtn} type="button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Sign up with Google
                                </button>
                                <button className={styles.socialBtn} type="button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    Sign up with LinkedIn
                                </button>
                            </div>

                            <button
                                className={`${styles.nextBtn} ${!role ? styles.nextBtnDisabled : ''}`}
                                onClick={() => { if (role) setStep(2); }}
                                disabled={!role}
                                type="button"
                            >
                                Continue
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Details */}
                    {step === 2 && (
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.nameRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="firstName">First name</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            id="firstName" name="firstName" type="text"
                                            className={styles.input} placeholder="John"
                                            value={formData.firstName} onChange={handleChange}
                                            required autoComplete="given-name"
                                        />
                                    </div>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="lastName">Last name</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            id="lastName" name="lastName" type="text"
                                            className={styles.input} placeholder="Doe"
                                            value={formData.lastName} onChange={handleChange}
                                            required autoComplete="family-name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor="signup-email">Work email</label>
                                <div className={styles.inputWrap}>
                                    <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <input
                                        id="signup-email" name="email" type="email"
                                        className={styles.input} placeholder="you@company.com"
                                        value={formData.email} onChange={handleChange}
                                        required autoComplete="email"
                                    />
                                </div>
                            </div>

                            {role === 'employer' && (
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label} htmlFor="company">Company name</label>
                                    <div className={styles.inputWrap}>
                                        <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                        </svg>
                                        <input
                                            id="company" name="company" type="text"
                                            className={styles.input} placeholder="Your company"
                                            value={formData.company} onChange={handleChange}
                                            autoComplete="organization"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor="signup-password">Create password</label>
                                <div className={styles.inputWrap}>
                                    <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        id="signup-password" name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className={styles.input} placeholder="Create a strong password"
                                        value={formData.password} onChange={handleChange}
                                        required autoComplete="new-password"
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                                        {showPassword ? (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {formData.password && (
                                    <div className={styles.strengthBar}>
                                        <div className={styles.strengthSegments}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div
                                                    key={i}
                                                    className={styles.strengthSegment}
                                                    style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)' }}
                                                />
                                            ))}
                                        </div>
                                        <span className={styles.strengthLabel} style={{ color: strengthColor }}>
                                            {strengthLabel}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.checkboxRow}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox" name="agree"
                                        className={styles.checkbox}
                                        checked={formData.agree}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className={styles.checkboxCustom} />
                                    <span className={styles.checkboxText}>
                                        I agree to the{' '}
                                        <Link href="/terms" className={styles.inlineLink}>Terms of Service</Link>
                                        {' '}and{' '}
                                        <Link href="/privacy" className={styles.inlineLink}>Privacy Policy</Link>
                                    </span>
                                </label>
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="19" y1="12" x2="5" y2="12" />
                                        <polyline points="12 19 5 12 12 5" />
                                    </svg>
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={isLoading || !formData.agree}
                                >
                                    {isLoading ? (
                                        <span className={styles.spinnerWrap}>
                                            <span className={styles.spinner} />
                                            Creating...
                                        </span>
                                    ) : (
                                        <>
                                            Create Account
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>

        </div>
    );
}
