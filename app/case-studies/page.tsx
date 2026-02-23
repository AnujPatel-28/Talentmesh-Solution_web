"use client";
import React from 'react';
import Link from 'next/link';
import styles from './case-studies.module.css';

// --- Premium Custom Icons ---
const IconArrowRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

const IconSparkle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" />
    </svg>
);

const CASE_STUDIES = [
    {
        title: "ScaleUp Tech's Global Nexus",
        description: "How a Series D fintech infrastructure reduced their specialized engineering time-to-hire from 45 days to 12 via Aura AI protocols.",
        category: "Fintech Infrastructure",
        outcome: "60% Efficiency Gain",
        link: "/case-studies/scaleup-tech",
        accent: "rgba(0, 123, 255, 0.1)"
    },
    {
        title: "Global Corp's Quantum Leap",
        description: "Executing a massive talent deployment across 5 global hubs for a quantum computing initiative in record-breaking time.",
        category: "Enterprise Systems",
        outcome: "400+ Specialists Deployed",
        link: "/case-studies/global-corp",
        accent: "rgba(16, 185, 129, 0.1)"
    },
    {
        title: "Nexus Labs Talent Architecture",
        description: "Re-engineering a multi-disciplinary team for a confidential deep-tech overhaul using stealth sourcing protocols.",
        category: "Stealth Tech",
        outcome: "100% Retained Hires",
        link: "/case-studies/nexus-labs",
        accent: "rgba(139, 92, 246, 0.1)"
    },
    {
        title: "Aether AI's Sourcing Protocol",
        description: "Identifying passive specialist talent in the distributed ledger space before they reached the open market.",
        category: "Distributed Systems",
        outcome: "92% Offer Acceptance",
        link: "/case-studies/aether-ai",
        accent: "rgba(236, 72, 153, 0.1)"
    }
];

export default function CaseStudiesPage() {
    return (
        <main style={{ background: '#fff' }}>
            {/* 1. Success Hero */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>
                            <IconSparkle /> Success Protocols • Verified Outcomes
                        </div>
                        <h1 className={styles.title}>
                            Diagnostic <br />
                            <span className={styles.highlight}>impact stories.</span>
                        </h1>
                        <p className={styles.description}>
                            Explore how the world's leading enterprise ecosystems utilize TalentMesh
                            to build their high-performance technical core.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. Impact Pulse */}
            <section className={styles.impactSection}>
                <div className="premium-container">
                    <div className={styles.impactGrid}>
                        <div className={styles.impactItem}>
                            <span className={styles.impactValue}>45%</span>
                            <span className={styles.impactLabel}>Avg. Hiring Cycle Reduction</span>
                        </div>
                        <div className={styles.impactItem}>
                            <span className={styles.impactValue}>98.4%</span>
                            <span className={styles.impactLabel}>Candidate Retention Rate</span>
                        </div>
                        <div className={styles.impactItem}>
                            <span className={styles.impactValue}>1.2M</span>
                            <span className={styles.impactLabel}>Specialists Analyzed</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Case Studies Grid */}
            <section className={styles.studySection}>
                <div className="premium-container">
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Success Protocols.</h2>
                        <p style={{ color: 'var(--medium-grey)', fontSize: '1.25rem' }}>Real-world data from our active deployment partners.</p>
                    </div>

                    <div className={styles.studyGrid}>
                        {CASE_STUDIES.map((study, i) => (
                            <div key={i} className={styles.studyCard}>
                                <div className={styles.cardHeader} style={{ background: study.accent }}>
                                    <span className={styles.categoryTag}>{study.category}</span>
                                    {/* Abstract Visual Placeholder */}
                                    <div style={{ padding: '4rem', opacity: 0.2 }}>
                                        <svg width="200" height="200" viewBox="0 0 200 200">
                                            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 20" />
                                            <path d="M40,100 L160,100 M100,40 L100,160" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                                        </svg>
                                    </div>
                                </div>
                                <div className={styles.cardBody}>
                                    <h3 className={styles.studyTitle}>{study.title}</h3>
                                    <p className={styles.studyDesc}>{study.description}</p>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.outcome}>
                                            <span style={{ color: 'var(--primary-blue)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '4px' }}>Outcome</span>
                                            {study.outcome}
                                        </div>
                                        <Link href={study.link} className={styles.readMore}>
                                            Case Profile <IconArrowRight />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Strategic CTA */}
            <section className={styles.ctaSection}>
                <div className="premium-container">
                    <div className={styles.ctaBox}>
                        <h2 className={styles.ctaTitle}>Start your protocol.</h2>
                        <p className={styles.ctaDesc}>
                            Join 200+ world-class organizations using TalentMesh to build their technical core with absolute certainty.
                        </p>
                        <Link href="/contact" className={styles.ctaBtn}>Schedule a Consult</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
