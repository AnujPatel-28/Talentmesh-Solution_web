"use client";
import React from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui';
import styles from './job-seekers.module.css';

// SVG Icons
const IconSparkle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
    </svg>
);

const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

const IconNode = () => (
    <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <circle cx="5" cy="5" r="3" />
        <circle cx="19" cy="5" r="3" />
        <circle cx="5" cy="19" r="3" />
        <circle cx="19" cy="19" r="3" />
        <line x1="7.1" y1="7.1" x2="9.9" y2="9.9" />
        <line x1="16.9" y1="7.1" x2="14.1" y2="9.9" />
        <line x1="7.1" y1="16.9" x2="9.9" y2="14.1" />
        <line x1="16.9" y1="16.9" x2="14.1" y2="14.1" />
    </svg>
);

const IconCheckCircle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const IconTrendingUp = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const IconSearch = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const IconMoney = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
    </svg>
);

const IconFile = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const IconMic = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
);


export default function JobSeekersPage() {
    return (
        <main className={styles.page}>
            {/* 1. Hero */}
            <section className={styles.hero}>
                <div className={styles.heroLayout}>
                    <div className={styles.heroContent}>
                        <div className={styles.aiBadge}>
                            <IconSparkle /> AI-Powered Career Growth
                        </div>
                        <h1 className={styles.heroTitle}>Unlock Your Career Potential with AI</h1>
                        <p className={styles.heroDesc}>
                            Navigate the modern job market with precision. TalentMesh leverages advanced artificial intelligence to match your unique skills with ideal roles, optimize your presentation, and prepare you for success.
                        </p>
                        <Link href="/signup" className={styles.primaryCta}>
                            Create Your Profile <IconArrowRight />
                        </Link>
                    </div>
                    
                    <div className={styles.heroGraphic}>
                        <div className={styles.graphicCenter}>
                            <IconNode />
                        </div>
                        
                        <div className={`${styles.floatBadge} ${styles.floatBadgeTop}`}>
                            <div className={`${styles.badgeIcon} ${styles.badgeIconGreen}`}>
                                <IconCheckCircle />
                            </div>
                            <div className={styles.badgeText}>
                                <span className={styles.badgeLabel}>Match Score</span>
                                <span className={styles.badgeValue}>98% Fit</span>
                            </div>
                        </div>

                        <div className={`${styles.floatBadge} ${styles.floatBadgeBottom}`}>
                            <div className={`${styles.badgeIcon} ${styles.badgeIconBlue}`}>
                                <IconTrendingUp />
                            </div>
                            <div className={styles.badgeText}>
                                <span className={styles.badgeLabel}>Market Value</span>
                                <span className={styles.badgeValue}>$120k - $140k</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Intelligent Tools Grid */}
            <section className={styles.featuresSection}>
                <div className={styles.featuresHeader}>
                    <SectionHeader 
                        centered 
                        title="Intelligent Tools for Your Journey" 
                        description="Our suite of AI-driven tools provides actionable insights at every stage of your job search, giving you a competitive edge." 
                    />
                </div>

                <div className={styles.featuresGrid}>
                    {/* Card 1 */}
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><IconSearch /></div>
                        <h3 className={styles.featureTitle}>Smart Matching</h3>
                        <p className={styles.featureDesc}>
                            Move beyond keyword matching. Our AI analyzes your actual skills, project history, and career trajectory to connect you with roles where you&apos;ll thrive, often uncovering opportunities you might not have considered.
                        </p>
                        <div className={styles.cardFooter}>
                            <div className={styles.pillGroup}>
                                <span className={styles.featurePill}>Skill Mapping</span>
                                <span className={styles.featurePill}>Culture Fit Analysis</span>
                                <span className={styles.featurePill}>Hidden Role Discovery</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><IconMoney /></div>
                        <h3 className={styles.featureTitle}>Salary Insights</h3>
                        <p className={styles.featureDesc}>
                            Negotiate with confidence using real-time market data tailored to your specific experience level and location.
                        </p>
                        <div className={styles.cardFooter}>
                            <div className={styles.sliderGraphic}>
                                <div className={styles.sliderHeader}>
                                    <span>Your Expected Range</span>
                                    <span className={styles.sliderTop}>Top 15%</span>
                                </div>
                                <div className={styles.sliderBar}>
                                    <div className={styles.sliderFill}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><IconFile /></div>
                        <h3 className={styles.featureTitle}>Resume Optimization</h3>
                        <p className={styles.featureDesc}>
                            Upload your current CV and receive instant, actionable feedback. Our AI identifies missing keywords, suggests stronger action verbs, and ensures your profile aligns with ATS standards.
                        </p>
                        <div className={styles.cardFooter}>
                            <div className={styles.pillGroup}>
                                <span className={`${styles.featurePill} ${styles.featurePillBlue}`}>REAL-TIME FEEDBACK</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><IconMic /></div>
                        <h3 className={styles.featureTitle}>AI Interview Prep</h3>
                        <p className={styles.featureDesc}>
                            Practice with our AI-driven screening tool. Experience simulated interviews tailored to your target role, complete with behavioral questions and immediate feedback on your responses.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Bottom CTA */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaCard}>
                    <h2 className={styles.ctaTitle}>Ready to Elevate Your Career?</h2>
                    <p className={styles.ctaDesc}>
                        Join thousands of professionals who have accelerated their career growth with TalentMesh. Setup takes less than 5 minutes.
                    </p>
                    <Link href="/signup" className={styles.ctaBtn}>
                        Create Your Profile
                    </Link>
                </div>
            </section>
        </main>
    );
}
