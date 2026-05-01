"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/types/auth';
import { insforge } from '@/lib/insforge';
import { signupSchema } from '@/lib/validation/auth';
import styles from '../signup.module.css';
import { Github, Linkedin, Mail } from 'lucide-react';

export default function CandidateSignupPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agree: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setFieldErrors({});

        if (formData.password !== formData.confirmPassword) {
            setFieldErrors({ confirmPassword: 'Passwords do not match' });
            setIsLoading(false);
            return;
        }

        const fullName = `${formData.firstName} ${formData.lastName}`.trim();

        const validation = signupSchema.safeParse({
            name: fullName,
            email: formData.email,
            password: formData.password,
            role: 'candidate',
        });

        if (!validation.success) {
            const errors: Record<string, string> = {};
            validation.error.issues.forEach(issue => {
                const path = issue.path[0]?.toString();
                if (path === 'name') errors.firstName = issue.message;
                else if (path) errors[path] = issue.message;
            });
            setFieldErrors(errors);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: 'candidate',
                    name: fullName
                })
            });

            const result = await response.json();

            if (result.error || !response.ok) {
                setError(result.error || 'Failed to sign up');
                setIsLoading(false);
                return;
            }

            if (result.requireEmailVerification) {
                router.push(`/signup/verify?email=${encodeURIComponent(formData.email)}&role=candidate&name=${encodeURIComponent(fullName)}`);
                return;
            }

            window.location.assign('/onboarding/candidate');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const handleSocialSignup = async (provider: 'google' | 'linkedin') => {
        try {
            setError('');
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
            const { error: authError } = await insforge.auth.signInWithOAuth({
                provider,
                redirectTo: `${siteUrl}/auth/callback?role=candidate`,
            });
            if (authError) throw authError;
        } catch (err: any) {
            setError(`Failed to initiate ${provider} signup. Please try again.`);
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
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />

            <div className={styles.card}>
                <Link href="/signup" className={styles.backBtn} style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.4rem 0.6rem', border: 'none', background: 'transparent' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                </Link>

                <Link href="/" className={styles.logoWrap}>
                    <Image src="/TalentMesh_page-0002-removebg-preview.png" alt="TalentMesh" width={120} height={35} unoptimized className={styles.logoImg} />
                </Link>

                <div className={styles.header}>
                    <h1 className={styles.title}>Join as Candidate</h1>
                    <p className={styles.subtitle}>Create your account to start your journey</p>
                </div>

                <div className={styles.socialAuth} style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <button onClick={() => handleSocialSignup('google')} className={styles.socialBtn}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Google</span>
                    </button>
                    <button onClick={() => handleSocialSignup('linkedin')} className={styles.socialBtn}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#0077b5">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        <span>LinkedIn</span>
                    </button>
                </div>

                <div className={styles.divider}>
                    <div className={styles.dividerLine} />
                    <span className={styles.dividerText}>or continue with email</span>
                    <div className={styles.dividerLine} />
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded-lg text-center mb-2">{error}</div>}
                    
                    <div className={styles.nameRow}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>First Name</label>
                            <input name="firstName" type="text" className={styles.input} placeholder="John" value={formData.firstName} onChange={handleChange} required />
                            {fieldErrors.firstName && <span className="text-[10px] text-red-500">{fieldErrors.firstName}</span>}
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input name="lastName" type="text" className={styles.input} placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input name="email" type="email" className={styles.input} placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                        {fieldErrors.email && <span className="text-[10px] text-red-500">{fieldErrors.email}</span>}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrap}>
                            <input
                                name="password" type={showPassword ? 'text' : 'password'}
                                className={styles.input} placeholder="Min. 8 characters"
                                value={formData.password} onChange={handleChange} required
                            />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {formData.password && (
                            <div className={styles.strengthBar}>
                                <div className={styles.strengthSegments}>
                                    {[1, 2, 3, 4].map(i => <div key={i} className={styles.strengthSegment} style={{ background: i <= strength ? strengthColor : '#e5e7eb' }} />)}
                                </div>
                                <span className={styles.strengthLabel} style={{ color: strengthColor }}>{strengthLabel}</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Confirm Password</label>
                        <input name="confirmPassword" type={showPassword ? 'text' : 'password'} className={styles.input} placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} required />
                        {fieldErrors.confirmPassword && <span className="text-[10px] text-red-500">{fieldErrors.confirmPassword}</span>}
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
            </div>
        </div>
    );
}
