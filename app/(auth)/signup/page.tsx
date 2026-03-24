"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/types/auth';
import { insforge } from '@/lib/insforge';
import { signupSchema } from '@/lib/validation/auth';
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
        confirmPassword: '',
        company: '',
        agree: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showNotice, setShowNotice] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const { signUp, login } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setFieldErrors({});

        // 1. Password confirmation check
        if (formData.password !== formData.confirmPassword) {
            setFieldErrors({ confirmPassword: 'Passwords do not match' });
            setIsLoading(false);
            return;
        }

        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        const userRole: UserRole = role === 'job_seeker' ? 'candidate' : 'recruiter';

        // 2. Validate with signupSchema
        const validation = signupSchema.safeParse({
            name: fullName,
            email: formData.email,
            password: formData.password,
            role: userRole,
        });

        if (!validation.success) {
            const errors: Record<string, string> = {};
            validation.error.issues.forEach(issue => {
                const path = issue.path[0]?.toString();
                if (path === 'name') {
                    errors.firstName = issue.message;
                } else if (path) {
                    errors[path] = issue.message;
                }
            });
            setFieldErrors(errors);
            setIsLoading(false);
            return;
        }

        try {
            // 3. Call signUp from AuthContext
            const result = await signUp(
                formData.email,
                formData.password,
                userRole,
                fullName
            );

            if (result.error) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            if (result.requireEmailVerification) {
                setStep(3);
                setIsLoading(false);
                return;
            }

            // 5. Success! Redirection
            if (userRole === 'candidate') {
                router.push('/onboarding/candidate');
            } else {
                router.push('/onboarding/recruiter/setup');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data, error: verifyError } = await insforge.auth.verifyEmail({
                email: formData.email,
                otp,
            });

            if (verifyError) throw new Error(verifyError.message);
            if (!data?.user) throw new Error('Verification failed. Please try again.');

            const userId = data.user.id;
            const userRole = role === 'job_seeker' ? 'candidate' : 'recruiter';

            // Generate role-specific ID
            const prefix = userRole === 'recruiter' ? 'recr' : 'cand';
            const roleId = `${prefix}_${Math.random().toString(36).substring(2, 10)}`;

            // Create profile
            const { error: profileError } = await insforge.database
                .from('profiles')
                .insert([{
                    id: userId,
                    email: formData.email,
                    role: userRole,
                    role_id: roleId,
                    name: `${formData.firstName} ${formData.lastName}`
                }]);

            if (profileError) throw new Error(profileError.message);

            // Log activity
            await insforge.database.from('activity').insert([{
                user_id: userId,
                description: `Joined Talentmesh as ${userRole}`,
                type: 'signup'
            }]);

            const actualToken = data.accessToken || (data as any).session?.access_token || (data as any).access_token || '';
            console.log('Verify successful! data:', data);

            login(actualToken, {
                id: userId,
                email: formData.email,
                name: `${formData.firstName} ${formData.lastName}`,
                role: userRole as any,
                avatar_url: null
            });

            // Redirect based on role
            if (userRole === 'candidate') {
                router.push('/onboarding/candidate');
            } else {
                router.push('/onboarding/recruiter/setup');
            }

        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        if (!role) return;
        try {
            setError('');
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
            const { error: authError } = await insforge.auth.signInWithOAuth({
                provider: 'google',
                redirectTo: `${siteUrl}/auth/callback?role=${role}`,
            });
            if (authError) throw authError;
        } catch (err: any) {
            setError('Failed to initiate Google signup. Please try again.');
        }
    };

    const handleLinkedInSignup = async () => {
        if (!role) return;
        try {
            setError('');
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
            const { error: authError } = await insforge.auth.signInWithOAuth({
                provider: 'linkedin',
                redirectTo: `${siteUrl}/auth/callback?role=${role}`,
            });
            if (authError) throw authError;
        } catch (err: any) {
            setError('Failed to initiate LinkedIn signup. Please verify it is enabled in your dashboard.');
        }
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
                        width={140}
                        height={40}
                        unoptimized
                        className={styles.logoImg}
                    />
                </Link>

                {/* Progress stepper */}
                <div className={styles.progressSteps}>
                    <div className={`${styles.progressStep} ${step >= 1 ? styles.progressActive : ''}`}>
                        <span className={styles.progressDot}>
                            {step > 1 ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : '1'}
                        </span>
                        <span className={styles.progressLabel}>Role</span>
                    </div>
                    <div className={`${styles.progressLine} ${step >= 2 ? styles.progressLineActive : ''}`} />
                    <div className={`${styles.progressStep} ${step >= 2 ? styles.progressActive : ''}`}>
                        <span className={styles.progressDot}>2</span>
                        <span className={styles.progressLabel}>Details</span>
                    </div>
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {step === 1 ? 'Get started free' : 'Almost there'}
                    </h1>
                    <p className={styles.subtitle}>
                        {step === 1 ? (
                            <>Join thousands of professionals. Already a member? <Link href="/login" className={styles.switchLink}>Sign in</Link></>
                        ) : (
                            <>Fill in your details to create your account</>
                        )}
                    </p>
                </div>

                {/* STEP 1 — Role Selection */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <div className={styles.roleCards}>
                            <button
                                type="button"
                                className={`${styles.roleCard} ${role === 'job_seeker' ? styles.roleCardActive : ''}`}
                                onClick={() => setRole('job_seeker')}
                                id="role-job-seeker"
                            >
                                <div className={styles.roleIconWrap}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div className={styles.roleContent}>
                                    <span className={styles.roleTitle}>Job Seeker</span>
                                    <span className={styles.roleDesc}>Discover your dream career with AI-matched opportunities</span>
                                </div>
                                <div className={styles.roleCheck}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                            </button>

                            <button
                                type="button"
                                className={`${styles.roleCard} ${role === 'employer' ? styles.roleCardActive : ''}`}
                                onClick={() => setRole('employer')}
                                id="role-employer"
                            >
                                <div className={styles.roleIconWrap}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                    </svg>
                                </div>
                                <div className={styles.roleContent}>
                                    <span className={styles.roleTitle}>Employer / Recruiter</span>
                                    <span className={styles.roleDesc}>Hire top talent with AI-powered sourcing & matching</span>
                                </div>
                                <div className={styles.roleCheck}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className={styles.divider}>
                            <span className={styles.dividerLine} />
                            <span className={styles.dividerText}>or sign up with</span>
                            <span className={styles.dividerLine} />
                        </div>

                        {/* Social */}
                        <div className={styles.socialRow}>
                            <button className={styles.socialBtn} type="button" onClick={handleGoogleSignup} disabled={!role}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                            <button className={styles.socialBtn} type="button" onClick={handleLinkedInSignup} disabled={!role}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                                LinkedIn
                            </button>
                        </div>

                        <button
                            className={styles.nextBtn}
                            onClick={() => { if (role) setStep(2); }}
                            disabled={!role}
                            type="button"
                        >
                            Continue
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* STEP 2 — Details Form */}
                {step === 2 && (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '8px' }}>{error}</div>}
                        <div className={styles.nameRow}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor="firstName">First name</label>
                                <input
                                    id="firstName" name="firstName" type="text"
                                    className={`${styles.input} ${fieldErrors.firstName ? styles.inputError : ''}`} 
                                    placeholder="John"
                                    value={formData.firstName} onChange={handleChange}
                                    required autoComplete="given-name"
                                />
                                {fieldErrors.firstName && <span className={styles.errorText}>{fieldErrors.firstName}</span>}
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor="lastName">Last name</label>
                                <input
                                    id="lastName" name="lastName" type="text"
                                    className={`${styles.input} ${fieldErrors.lastName ? styles.inputError : ''}`} 
                                    placeholder="Doe"
                                    value={formData.lastName} onChange={handleChange}
                                    required autoComplete="family-name"
                                />
                                {fieldErrors.lastName && <span className={styles.errorText}>{fieldErrors.lastName}</span>}
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label} htmlFor="signup-email">
                                {role === 'employer' ? 'Work email' : 'Email address'}
                            </label>
                            <div className={styles.inputWrap}>
                                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <input
                                    id="signup-email" name="email" type="email"
                                    className={`${styles.input} ${styles.inputWithIcon} ${fieldErrors.email ? styles.inputError : ''}`}
                                    placeholder={role === 'employer' ? 'you@company.com' : 'you@email.com'}
                                    value={formData.email} onChange={handleChange}
                                    required autoComplete="email"
                                />
                            </div>
                            {fieldErrors.email && <span className={styles.errorText}>{fieldErrors.email}</span>}
                        </div>

                        {role === 'employer' && (
                            <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor="company">Company name</label>
                                <div className={styles.inputWrap}>
                                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                    </svg>
                                    <input
                                        id="company" name="company" type="text"
                                        className={`${styles.input} ${styles.inputWithIcon}`} placeholder="Your company"
                                        value={formData.company} onChange={handleChange}
                                        autoComplete="organization"
                                    />
                                </div>
                            </div>
                        )}

                        <div className={styles.fieldGroup}>
                            <label className={styles.label} htmlFor="signup-password">Password</label>
                            <div className={styles.inputWrap}>
                                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="signup-password" name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`${styles.input} ${styles.inputWithIcon} ${fieldErrors.password ? styles.inputError : ''}`} 
                                    placeholder="Min. 8 characters"
                                    value={formData.password} onChange={handleChange}
                                    required autoComplete="new-password"
                                />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && <span className={styles.errorText}>{fieldErrors.password}</span>}
                            
                            {formData.password && (
                                <div className={styles.strengthBar}>
                                    <div className={styles.strengthSegments}>
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={styles.strengthSegment}
                                                style={{ background: i <= strength ? strengthColor : '#e5e7eb' }}
                                            />
                                        ))}
                                    </div>
                                    <span className={styles.strengthLabel} style={{ color: strengthColor }}>
                                        {strengthLabel}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label} htmlFor="confirm-password">Confirm Password</label>
                            <div className={styles.inputWrap}>
                                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="confirm-password" name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`${styles.input} ${styles.inputWithIcon} ${fieldErrors.confirmPassword ? styles.inputError : ''}`} 
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword} onChange={handleChange}
                                    required autoComplete="new-password"
                                />
                            </div>
                            {fieldErrors.confirmPassword && <span className={styles.errorText}>{fieldErrors.confirmPassword}</span>}
                        </div>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox" name="agree"
                                className={styles.checkbox}
                                checked={formData.agree}
                                onChange={handleChange}
                                required
                            />
                            <span className={styles.checkboxCustom}>
                                <svg viewBox="0 0 12 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="1.5 5 4.5 8 10.5 2" />
                                </svg>
                            </span>
                            <span className={styles.checkboxText}>
                                I agree to the{' '}
                                <Link href="/terms" className={styles.inlineLink}>Terms</Link>
                                {' '}&{' '}
                                <Link href="/privacy" className={styles.inlineLink}>Privacy Policy</Link>
                            </span>
                        </label>

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
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3 — OTP Verification */}
                {step === 3 && (
                    <form className={styles.form} onSubmit={handleVerify}>
                        {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '8px' }}>{error}</div>}

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Check your email</h2>
                            <p style={{ color: '#4b5563', lineHeight: 1.5 }}>
                                We sent a 6-digit verification code to<br /><strong>{formData.email}</strong>
                            </p>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label} htmlFor="otp-code">Verification Code</label>
                            <input
                                id="otp-code" type="text"
                                className={styles.input} placeholder="123456"
                                value={otp} onChange={(e) => setOtp(e.target.value)}
                                required maxLength={6}
                                style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 600 }}
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isLoading || otp.length < 6}
                        >
                            {isLoading ? (
                                <span className={styles.spinnerWrap}>
                                    <span className={styles.spinner} />
                                    Verifying...
                                </span>
                            ) : (
                                'Verify & Continue'
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* Bottom terms */}
            <p className={styles.terms}>
                Protected by TalentMesh ·{' '}
                <Link href="/terms" className={styles.termsLink}>Terms</Link>
                {' '}&{' '}
                <Link href="/privacy" className={styles.termsLink}>Privacy</Link>
            </p>
        </div>
    );
}
