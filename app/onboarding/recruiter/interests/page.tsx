"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from '../../onboarding.module.css';

const HIRING_CATEGORIES = [
    { id: 'engineering', label: 'Engineering', icon: '💻' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'sales', label: 'Sales', icon: '📈' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'customer_support', label: 'Support', icon: '🎧' },
    { id: 'operations', label: 'Operations', icon: '⚙️' },
    { id: 'hr', label: 'HR & People', icon: '🤝' },
    { id: 'data', label: 'Data & AI', icon: '📊' },
    { id: 'product', label: 'Product', icon: '🚀' },
    { id: 'legal', label: 'Legal', icon: '⚖️' },
];

export default function RecruiterInterests() {
    const [selected, setSelected] = useState<string[]>([]);
    const router = useRouter();

    const toggle = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <motion.div 
            className={styles.card}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <div className={styles.stepper}>
                <span className={`${styles.stepDot} ${styles.stepDotActive}`}>1</span>
                <span className={styles.stepLine} />
                <span className={styles.stepDot}>2</span>
                <span className={styles.stepLine} />
                <span className={styles.stepDot}>3</span>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>Who are you hiring?</h1>
                <p className={styles.subtitle}>Select the roles your company is hiring for</p>
            </div>

            <div className={styles.chipGrid}>
                {HIRING_CATEGORIES.map(cat => (
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
                <button className={styles.nextBtn} onClick={() => router.push('/onboarding/recruiter/documents')} disabled={selected.length === 0}>
                    Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
            </div>
        </motion.div>
    );
}
