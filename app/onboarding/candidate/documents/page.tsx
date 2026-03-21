"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import { uploadResume } from '@/lib/api/storage';
import { calculateProfileStrength } from '@/lib/utils/profile-utils';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import styles from '../../onboarding.module.css';

export default function CandidateDocuments() {
    const { user } = useAuth();
    const [resume, setResume] = useState<File | null>(null);
    const [resumeUrl, setResumeUrl] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [headline, setHeadline] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            const { data, error } = await insforge.database
                .from('candidate_profiles')
                .select('resume_url, linkedin_url, github_url, portfolio_url, headline')
                .eq('id', user.id)
                .single();

            if (data) {
                setResumeUrl(data.resume_url || '');
                setLinkedin(data.linkedin_url || '');
                setGithub(data.github_url || '');
                setPortfolio(data.portfolio_url || '');
                setHeadline(data.headline || '');
            }
        };
        fetchInitialData();
    }, [user]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResume(e.target.files[0]);
        }
    };

    const handleFinish = async () => {
        if (!user) return;

        setIsLoading(true);
        setUploadProgress(10);
        try {
            let finalResumeUrl = resumeUrl;

            // 1. Upload resume if a new one is selected
            if (resume) {
                setUploadProgress(30);
                finalResumeUrl = await uploadResume(resume, user.id);
                setUploadProgress(70);
            }

            // 2. Save all document & social info
            const updatePayload = {
                id: user.id,
                resume_url: finalResumeUrl,
                linkedin_url: linkedin,
                github_url: github,
                portfolio_url: portfolio,
                headline: headline,
            };

            const { error: updateError } = await insforge.database
                .from('candidate_profiles')
                .upsert(updatePayload);

            if (updateError) throw updateError;
            setUploadProgress(85);

            // 3. Fetch full profile and candidate_profile for strength calculation
            const [{ data: profile }, { data: candProfile }] = await Promise.all([
                insforge.database.from('profiles').select('*').eq('id', user.id).single(),
                insforge.database.from('candidate_profiles').select('*').eq('id', user.id).single(),
            ]);

            const strength = calculateProfileStrength(profile, candProfile);

            // 4. Update profile strength
            await insforge.database
                .from('candidate_profiles')
                .update({ profile_strength: strength })
                .eq('id', user.id);

            setUploadProgress(100);
            router.push('/dashboard/candidate');
        } catch (err: any) {
            console.error('Error finishing onboarding:', err);
            alert(`Failed to complete onboarding: ${err.message}`);
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className={styles.card}>
            <OnboardingStepper currentStep={3} />

            <div className={styles.header}>
                <h1 className={styles.title}>Professional links</h1>
                <p className={styles.subtitle}>Upload your resume and add your professional profiles</p>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Resume</h3>
                <input type="file" ref={fileRef} onChange={handleFile} accept=".pdf" hidden />
                <div
                    className={`${styles.uploadArea} ${resume || resumeUrl ? styles.uploadAreaActive : ''}`}
                    onClick={() => fileRef.current?.click()}
                >
                    {(resume || resumeUrl) ? (
                        <>
                            <svg className={styles.uploadIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span className={styles.uploadText}>{resume ? resume.name : 'Resume uploaded'}</span>
                            <span className={styles.uploadHint}>Click to replace</span>
                        </>
                    ) : (
                        <>
                            <svg className={styles.uploadIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className={styles.uploadText}>Upload your resume (PDF only)</span>
                            <span className={styles.uploadHint}>Max 5MB</span>
                        </>
                    )}
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Online presence</h3>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Professional Headline / Bio</label>
                    <input
                        type="text"
                        className={styles.optionalInput}
                        placeholder="e.g. Senior Software Engineer with 5+ years experience"
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>LinkedIn URL</label>
                    <input
                        type="url"
                        className={styles.optionalInput}
                        placeholder="https://linkedin.com/in/username"
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>GitHub URL</label>
                    <input
                        type="url"
                        className={styles.optionalInput}
                        placeholder="https://github.com/username"
                        value={github}
                        onChange={e => setGithub(e.target.value)}
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Portfolio URL</label>
                    <input
                        type="url"
                        className={styles.optionalInput}
                        placeholder="https://yourportfolio.com"
                        value={portfolio}
                        onChange={e => setPortfolio(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => router.push('/onboarding/candidate/interests')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Back
                </button>
                <button className={styles.nextBtn} onClick={handleFinish} disabled={isLoading}>
                    {isLoading ? 'Completing...' : 'Finish Setup'}
                    {!isLoading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>}
                </button>
            </div>
        </div>
    );
}
