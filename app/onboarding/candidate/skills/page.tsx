"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../onboarding.module.css';

const SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
    'Java', 'C++', 'Go', 'Rust', 'SQL', 'MongoDB',
    'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST APIs', 'Git',
    'Figma', 'Adobe XD', 'UI/UX', 'HTML/CSS', 'Tailwind',
    'Machine Learning', 'Data Analysis', 'Excel', 'Tableau', 'Power BI',
    'SEO', 'Content Writing', 'Social Media', 'Google Ads', 'Salesforce',
    'Project Management', 'Agile', 'Scrum', 'Communication', 'Leadership',
];

export default function CandidateSkills() {
    const [selected, setSelected] = useState<string[]>([]);
    const router = useRouter();

    const toggle = (skill: string) => {
        setSelected(prev =>
            prev.includes(skill) ? prev.filter(x => x !== skill) : [...prev, skill]
        );
    };

    return (
        <div className={styles.card}>
            <div className={styles.stepper}>
                <span className={`${styles.stepDot} ${styles.stepDotDone}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span className={`${styles.stepLine} ${styles.stepLineDone}`} />
                <span className={`${styles.stepDot} ${styles.stepDotActive}`}>2</span>
                <span className={styles.stepLine} />
                <span className={styles.stepDot}>3</span>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>Your skills</h1>
                <p className={styles.subtitle}>Select skills that match your expertise</p>
            </div>

            <div className={styles.tagWrap}>
                {SKILLS.map(skill => (
                    <button
                        key={skill}
                        type="button"
                        className={`${styles.tag} ${selected.includes(skill) ? styles.tagSelected : ''}`}
                        onClick={() => toggle(skill)}
                    >
                        {skill}
                    </button>
                ))}
            </div>

            <p className={styles.counter}>{selected.length} skills selected</p>

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => router.push('/onboarding/candidate/interests')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Back
                </button>
                <button className={styles.nextBtn} onClick={() => router.push('/onboarding/candidate/documents')} disabled={selected.length === 0}>
                    Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
            </div>
        </div>
    );
}
