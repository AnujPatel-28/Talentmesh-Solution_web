"use client";
import React from 'react';
import Link from 'next/link';
import styles from './employers.module.css';

// --- Premium Custom Icons ---
const IconTarget = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
);

const IconShield = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconZap = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const IconChart = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
);

const PARTNERS = [
    "Neural Networks",
    "Quantum Systems",
    "Fintech Infrastructure",
    "Distributed Ledger",
    "Autonomous Robotics",
    "Cloud Native",
    "Edge Computing",
    "Cyber Defense"
];

export default function EmployersPage() {
    return (
        <main style={{ background: '#fff' }}>
            {/* 1. Command Hero */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <div className={styles.enterpriseBadge}>
                            Enterprise Acquisition Suite 2.0
                        </div>
                        <h1 className={styles.heroTitle}>
                            Command your <br />
                            <span className={styles.titleGlow}>talent pipeline.</span>
                        </h1>
                        <p className={styles.heroDesc}>
                            The world's most advanced AI-driven sourcing engine.
                            Automate discovery, vetting, and matching for your elite technical roles.
                        </p>

                        <div className={styles.dashboardMockup}>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>1.2M+</div>
                                <div className={styles.statLabel}>Vetted Specialists</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>98.4%</div>
                                <div className={styles.statLabel}>Match Precision</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>8.2d</div>
                                <div className={styles.statLabel}>Avg. Deployment Time</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Partner Marquee */}
            <div className={styles.marqueeContainer}>
                <div className={styles.marqueeTrack}>
                    {[...PARTNERS, ...PARTNERS].map((name, i) => (
                        <span key={i} className={styles.partnerName}>
                            {name}
                        </span>
                    ))}
                </div>
            </div>

            {/* 3. Command Center Section */}
            <section className={styles.commandSection}>
                <div className="premium-container">
                    <div className={styles.commandGrid}>
                        <div className={styles.commandContent}>
                            <span className={styles.featureTag}>The Aura Engine</span>
                            <h2 className={styles.commandTitle}>Recruitment on <br /> Autopilot.</h2>
                            <p className={styles.commandText}>
                                Our machine learning model doesn't just scan keywords. It understands
                                engineering depth, project impact, and cultural trajectory to find
                                exactly who you're looking for before they even hit the market.
                            </p>

                            <div className={styles.featureList}>
                                <div className={styles.featureItem}>
                                    <div className={styles.featureIcon}><IconTarget /></div>
                                    <div className={styles.featureBox}>
                                        <h4>Passive Talent Sourcing</h4>
                                        <p>Reach the 85% of elite engineers who aren't active on job boards.</p>
                                    </div>
                                </div>
                                <div className={styles.featureItem}>
                                    <div className={styles.featureIcon}><IconShield /></div>
                                    <div className={styles.featureBox}>
                                        <h4>Biometric Skill Vetting</h4>
                                        <p>Every candidate's technical profile is verified via automated AI screening.</p>
                                    </div>
                                </div>
                                <div className={styles.featureItem}>
                                    <div className={styles.featureIcon}><IconChart /></div>
                                    <div className={styles.featureBox}>
                                        <h4>Compensation IQ</h4>
                                        <p>Real-time salary benchmarking for every role and location worldwide.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.visualPanel}>
                            <div className={styles.scanLine}></div>
                            <div style={{ padding: '4rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', height: '100%', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-blue)', marginBottom: '1rem' }}>Sourcing Active...</div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Analyzing 4.2 Million Developer Profiles</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Strategic Solutions */}
            <section className={styles.solutionsSection}>
                <div className="premium-container">
                    <div className={styles.sectionHeader}>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--deep-navy)', marginBottom: '1.5rem' }}>Bespoke Solutions.</h2>
                        <p style={{ color: 'var(--medium-grey)', fontSize: '1.25rem' }}>Tailored acquisition strategies for every stage of growth.</p>
                    </div>

                    <div className={styles.solutionGrid}>
                        <div className={styles.solutionCard}>
                            <h3 className={styles.solutionTitle}>Precision Hire</h3>
                            <p className={styles.solutionDesc}>
                                High-touch sourcing for critical leadership or high-specialization individual contributors.
                            </p>
                            <Link href="/employers/sourcing" className={styles.actionLink}>
                                Explore Solution <IconZap />
                            </Link>
                        </div>
                        <div className={styles.solutionCard}>
                            <h3 className={styles.solutionTitle}>Volume Core</h3>
                            <p className={styles.solutionDesc}>
                                Scale your engineering teams rapidly with our automated technical vetting pipeline.
                            </p>
                            <Link href="/employers/products" className={styles.actionLink}>
                                View Platform <IconZap />
                            </Link>
                        </div>
                        <div className={styles.solutionCard}>
                            <h3 className={styles.solutionTitle}>Stealth Sourcing</h3>
                            <p className={styles.solutionDesc}>
                                Discrete talent acquisition for confidential projects or competitive market moves.
                            </p>
                            <Link href="/contact" className={styles.actionLink}>
                                Speak to Expert <IconZap />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Enterprise CTA */}
            <section className={styles.ctaSection}>
                <div className="premium-container">
                    <div className={styles.ctaBox}>
                        <h2 className={styles.ctaTitle}>Scale with certainty.</h2>
                        <p style={{ fontSize: '1.25rem', opacity: 0.7, marginBottom: '5rem', maxWidth: '700px', margin: '0 auto 5rem' }}>
                            Join 200+ world-class Enterprise Ecosystems using TalentMesh to build their technical core.
                        </p>
                        <Link href="/contact" className={styles.ctaBtn}>Schedule a Consult</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
