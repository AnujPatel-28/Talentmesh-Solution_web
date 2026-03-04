"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../onboarding.module.css';

export default function CandidateDocuments() {
    const [resume, setResume] = useState<File | null>(null);
    const [portfolio, setPortfolio] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResume(e.target.files[0]);
        }
    };

    const handleFinish = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            router.push('/dashboard/candidate');
        }, 1500);
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
                <h1 className={styles.title}>Upload your resume</h1>
                <p className={styles.subtitle}>Help employers find you faster</p>
            </div>

            <input type="file" ref={fileRef} onChange={handleFile} accept=".pdf,.doc,.docx" hidden />

            <div
                className={`${styles.uploadArea} ${resume ? styles.uploadAreaActive : ''}`}
                onClick={() => fileRef.current?.click()}
            >
                {resume ? (
                    <>
                        <svg className={styles.uploadIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span className={styles.uploadText}>{resume.name}</span>
                        <span className={styles.uploadHint}>Click to replace</span>
                    </>
                ) : (
                    <>
                        <svg className={styles.uploadIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span className={styles.uploadText}>Drop your resume here or click to browse</span>
                        <span className={styles.uploadHint}>PDF, DOC, DOCX — max 10MB</span>
                    </>
                )}
            </div>

            <div className={styles.optionalField}>
                <label className={styles.optionalLabel}>Portfolio URL (optional)</label>
                <input
                    type="url"
                    className={styles.optionalInput}
                    placeholder="https://yourportfolio.com"
                    value={portfolio}
                    onChange={e => setPortfolio(e.target.value)}
                />
            </div>

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => router.push('/onboarding/candidate/skills')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Back
                </button>
                <button className={styles.nextBtn} onClick={handleFinish} disabled={isLoading}>
                    {isLoading ? 'Setting up...' : 'Finish Setup'}
                    {!isLoading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>}
                </button>
            </div>

            <p className={styles.skipLink}>
                <button className={styles.skipBtn} onClick={() => router.push('/dashboard/candidate')}>Skip for now</button>
            </p>
        </div>
    );
}
