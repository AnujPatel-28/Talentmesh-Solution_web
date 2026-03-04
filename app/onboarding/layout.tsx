"use client";
import React from 'react';
import styles from './onboarding.module.css';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.page}>
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />
            {children}
        </div>
    );
}
