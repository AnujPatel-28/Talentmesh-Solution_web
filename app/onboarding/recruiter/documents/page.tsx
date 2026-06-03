"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from '../../onboarding.module.css';
import { invokeFunction } from '@/lib/insforge';

export default function RecruiterDocuments() {
    const { user, refreshUser } = useAuth();
    const [logo, setLogo] = useState<File | null>(null);
    const [doc, setDoc] = useState<File | null>(null);
    const [website, setWebsite] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const logoRef = useRef<HTMLInputElement>(null);
    const docRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFinish = async () => {
        setIsLoading(true);
        try {
            await invokeFunction('recruiter-profile', { 
                method: 'POST',
                body: { action: 'complete_onboarding' }
            });
            
            // 🔄 Refresh user state to sync is_onboarded
            const updatedUser = await refreshUser();
            
            setIsLoading(false);
            const dashboardId = updatedUser?.public_id || user?.public_id || user?.role_id || 'recruiter';
            router.push(`/dashboard/recruiter/${dashboardId}`);
        } catch {
            setIsLoading(false);
            // Fallback for safety
            const dashboardId = user?.public_id || user?.role_id || user?.id || 'recruiter';
            router.push(`/dashboard/recruiter/${dashboardId}`);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.stepper}>
                <span className={`${styles.stepDot} ${styles.stepDotDone}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span className={`${styles.stepLine} ${styles.stepLineDone}`} />
                <span className={`${styles.stepDot} ${styles.stepDotDone}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span className={`${styles.stepLine} ${styles.stepLineActive}`} />
                <span className={`${styles.stepDot} ${styles.stepDotActive}`}>3</span>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>Company documents</h1>
                <p className={styles.subtitle}>Upload your company logo and verification docs</p>
            </div>

            <input type="file" ref={logoRef} onChange={e => e.target.files?.[0] && setLogo(e.target.files[0])} accept="image/*" hidden />
            <input type="file" ref={docRef} onChange={e => e.target.files?.[0] && setDoc(e.target.files[0])} accept=".pdf,.doc,.docx,.jpg,.png" hidden />

            {/* Company Logo */}
            <div
                className={`${styles.uploadArea} ${logo ? styles.uploadAreaActive : ''}`}
                onClick={() => logoRef.current?.click()}
                style={{ padding: '1.25rem' }}
            >
                {logo ? (
                    <>
                        <svg className={styles.uploadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        <span className={styles.uploadText}>{logo.name}</span>
                    </>
                ) : (
                    <>
                        <svg className={styles.uploadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        <span className={styles.uploadText}>Upload company logo</span>
                        <span className={styles.uploadHint}>PNG, JPG — recommended 200×200px</span>
                    </>
                )}
            </div>

            {/* Verification Doc */}
            <div
                className={`${styles.uploadArea} ${doc ? styles.uploadAreaActive : ''}`}
                onClick={() => docRef.current?.click()}
                style={{ padding: '1.25rem' }}
            >
                {doc ? (
                    <>
                        <svg className={styles.uploadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        <span className={styles.uploadText}>{doc.name}</span>
                    </>
                ) : (
                    <>
                        <svg className={styles.uploadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        <span className={styles.uploadText}>Upload verification document</span>
                        <span className={styles.uploadHint}>Business license, registration — PDF, DOC</span>
                    </>
                )}
            </div>

            <div className={styles.optionalField}>
                <label className={styles.optionalLabel}>Company website (optional)</label>
                <input
                    type="url"
                    className={styles.optionalInput}
                    placeholder="https://yourcompany.com"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                />
            </div>

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => router.push('/onboarding/recruiter/interests')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Back
                </button>
                <button className={styles.nextBtn} onClick={handleFinish} disabled={isLoading}>
                    {isLoading ? 'Setting up...' : 'Finish Setup'}
                    {!isLoading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>}
                </button>
            </div>

            <p className={styles.skipLink}>
                <button className={styles.skipBtn} onClick={async () => {
                    await invokeFunction('recruiter-profile', { 
                        method: 'POST',
                        body: { action: 'complete_onboarding' }
                    });
                    const updatedUser = await refreshUser();
                    router.push(`/dashboard/recruiter/${updatedUser?.public_id || user?.public_id || user?.role_id || 'recruiter'}`);
                }}>Skip for now</button>
            </p>
        </div>
    );
}
