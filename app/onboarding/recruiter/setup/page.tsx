"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { invokeFunction } from '@/lib/insforge';

import styles from '../../onboarding.module.css';

export default function RecruiterSetup() {
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        jobTitle: '',
        department: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const { user, isLoading: authLoading } = useAuth();

    React.useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace('/login?redirect=/onboarding/recruiter/setup');
            return;
        }
        if (user.role === 'admin' || user.role === 'super_admin') {
            router.replace('/dashboard/admin');
            return;
        }
        if (user.role === 'candidate') {
            router.replace('/dashboard/candidate');
            return;
        }
    }, [user, authLoading, router]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await invokeFunction('recruiter-profile', { method: 'POST', body: formData });
            router.push('/onboarding/recruiter/interests');
        } catch (err: any) {
            setError(err.message || 'Failed to save profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.stepper}>
                <span className={`${styles.stepDot} ${styles.stepDotActive}`}>0</span>
                <span className={styles.stepLine} />
                <span className={styles.stepDot}>1</span>
                <span className={styles.stepLine} />
                <span className={styles.stepDot}>2</span>
                <span className={styles.stepLine} />
                <span className={styles.stepDot}>3</span>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>Welcome, Recruiter!</h1>
                <p className={styles.subtitle}>Let's set up your professional profile</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem', background: '#fef2f2', borderRadius: '8px' }}>{error}</div>}
                
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Full name</label>
                    <div className={styles.inputWrap}>
                        <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <input
                            name="name"
                            type="text"
                            className={styles.input}
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>
                
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Company name</label>
                    <div className={styles.inputWrap}>
                        <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                        <input
                            name="companyName"
                            type="text"
                            className={styles.input}
                            placeholder="e.g. Acme Corp"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Your job title</label>
                    <div className={styles.inputWrap}>
                        <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <input
                            name="jobTitle"
                            type="text"
                            className={styles.input}
                            placeholder="e.g. Senior Technical Recruiter"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Department</label>
                    <select
                        name="department"
                        className={styles.input}
                        value={formData.department}
                        onChange={handleChange as any}
                        required
                        style={{ appearance: 'none' }}
                    >
                        <option value="">Select Department</option>
                        <option value="hr">Human Resources</option>
                        <option value="engineering">Engineering</option>
                        <option value="operations">Operations</option>
                        <option value="executive">Executive</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className={styles.actions} style={{ marginTop: '1rem' }}>
                    <button className={styles.nextBtn} disabled={isLoading} style={{ width: '100%', justifyContent: 'center' }}>
                        {isLoading ? 'Saving...' : 'Continue to Onboarding'}
                        {!isLoading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>}
                    </button>
                </div>
            </form>
        </div>
    );
}
