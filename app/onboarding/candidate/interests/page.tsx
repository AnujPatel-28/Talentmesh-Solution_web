"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../onboarding.module.css';

const CATEGORIES = [
    { id: 'engineering', label: 'Engineering', icon: '💻' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'sales', label: 'Sales', icon: '📈' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'operations', label: 'Operations', icon: '⚙️' },
    { id: 'hr', label: 'HR & People', icon: '🤝' },
    { id: 'data', label: 'Data Science', icon: '📊' },
    { id: 'product', label: 'Product', icon: '🚀' },
    { id: 'legal', label: 'Legal', icon: '⚖️' },
];

export default function CandidateInterests() {
    const [selected, setSelected] = useState<string[]>([]);
    const router = useRouter();

    const toggle = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className={styles.card}>
            {/* Stepper */}
            <div className={styles.stepper}>
                <span className={`${styles.stepDot} ${styles.stepDotActive}`}>1</span>
                <span className={styles.stepLine} />
                <span className={styles.stepDot}>2</span>
                <span className={styles.stepLine} />
                <span className={styles.stepDot}>3</span>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>What interests you?</h1>
                <p className={styles.subtitle}>Select the job categories you&apos;re interested in</p>
            </div>

            <div className={styles.chipGrid}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        className={`${styles.chip} ${selected.includes(cat.id) ? styles.chipSelected : ''}`}
                        onClick={() => toggle(cat.id)}
                    >
                        <span className={styles.chipIcon}>{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            <p className={styles.counter}>{selected.length} selected</p>

            <div className={styles.actions}>
                <button className={styles.nextBtn} onClick={() => router.push('/onboarding/candidate/skills')} disabled={selected.length === 0}>
                    Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
            </div>
        </div>
    );
}
