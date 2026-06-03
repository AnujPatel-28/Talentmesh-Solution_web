"use client";
import React from 'react';
import Link from 'next/link';
import styles from './job-seekers.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';

import { SectionHeader } from '@/components/ui';

const IconSparkle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" />
    </svg>
);

const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

const IconCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const STATS = [
    { val: '3M+', label: 'Monthly Candidates' },
    { val: '1.2M', label: 'Vetted Profiles' },
    { val: '8.2 Days', label: 'Avg. Time to Offer' },
    { val: '92%', label: 'Offer Acceptance Rate' },
];

const STEPS = [
    {
        num: '01',
        title: 'Build Your Profile',
        desc: 'Create a rich, AI-optimised profile that goes beyond a résumé — capturing your trajectory, not just your titles.',
        color: '#007BFF',
    },
    {
        num: '02',
        title: 'Aura AI Matches You',
        desc: "Our neural engine analyses your skills, ambitions, and culture fit to surface roles you haven't even found yet.",
        color: '#10b981',
    },
    {
        num: '03',
        title: 'Get Hired',
        desc: "Interview with pre-vetted, high-growth companies who already know you're a strong match — no cold applications.",
        color: '#8b5cf6',
    },
];

const BENEFITS = [
    { icon: '🎯', title: 'AI-Matched Roles', desc: 'No spam. Only opportunities that precisely fit your skills, seniority, and salary expectations.' },
    { icon: '📊', title: 'Salary Benchmarking', desc: 'Know your market worth. Real-time compensation data for every role and every region.' },
    { icon: '📝', title: 'Resume Diagnostics', desc: 'Get AI-powered feedback on your positioning, impact statements, and keyword optimisation.' },
    { icon: '🎓', title: 'Coaching Network', desc: 'Access 500+ industry mentors for mock interviews, salary negotiation, and career strategy sessions.' },
    { icon: '🔒', title: 'Private Listings', desc: 'Access exclusive roles that are never posted publicly — sourced directly from our enterprise partners.' },
    { icon: '✅', title: 'Zero Cost to Candidates', desc: 'TalentMesh is completely free for job seekers. Employers pay — you keep 100% of your offer.' },
];

const TESTIMONIALS = [
    {
        quote: '"TalentMesh matched me with a role I never would have found on my own. 40% salary increase from my previous job."',
        name: 'Priya Sharma',
        role: 'Senior ML Engineer @ OpenAI',
        outcome: '+40% Salary',
        color: '#007BFF',
    },
    {
        quote: '"Two weeks after creating my profile I had 3 offers from companies I actually wanted to work at. No applications sent."',
        name: 'Marcus Webb',
        role: 'Product Lead @ Stripe',
        outcome: '3 Offers in 2 Weeks',
        color: '#10b981',
    },
    {
        quote: '"The coaching sessions helped me negotiate my comp by $35k. The ROI on signing up is insane."',
        name: 'Ananya Rao',
        role: 'Staff Engineer @ Figma',
        outcome: '+$35k Negotiated',
        color: '#8b5cf6',
    },
];

export default function JobSeekersPage() {
    return (
        <main className={styles.page}>
            {/* 1. Hero */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <SectionHeader
                            light
                            centered
                            tag="Free for Candidates"
                            title={<>Your career, <span className={styles.heroHighlight}>supercharged.</span></>}
                            description="Stop applying. Start being found. TalentMesh's AI surfaces the right role at the right company — before it even hits the market."
                        />
                        <div className={styles.heroCtas}>
                            <Link href="/browse-jobs" className={styles.primaryCta}>
                                Browse Jobs <IconArrowRight />
                            </Link>
                            <Link href="/signup" className={styles.secondaryCta}>
                                Create Free Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Stats Strip */}
            <AnimateOnScroll animation="scaleUp">
                <section className={styles.statsStrip}>
                    <div className="premium-container">
                        <div className={styles.statsGrid}>
                            {STATS.map((s, i) => (
                                <div key={i} className={styles.statItem}>
                                    <span className={styles.statVal}>{s.val}</span>
                                    <span className={styles.statLabel}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 3. How It Works */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.howSection}>
                    <div className="premium-container">
                        <SectionHeader
                            centered
                            tag="The Process"
                            title="Three steps to your next role."
                            description="No cover letters. No rejection emails. Just precision matching."
                        />
                        <div className={styles.stepsGrid}>
                            {STEPS.map((step, i) => (
                                <div key={i} className={styles.stepCard}>
                                    <div className={styles.stepNum} style={{ color: step.color }}>{step.num}</div>
                                    <h3 className={styles.stepTitle}>{step.title}</h3>
                                    <p className={styles.stepDesc}>{step.desc}</p>
                                    <div className={styles.stepLine} style={{ background: step.color }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 4. Benefits Grid */}
            <AnimateOnScroll animation="fadeUp" delay={100}>
                <section className={styles.benefitsSection}>
                    <div className="premium-container">
                        <SectionHeader
                            centered
                            tag="What You Get"
                            title="Everything you need to land the role."
                        />
                        <div className={styles.benefitsGrid}>
                            {BENEFITS.map((b, i) => (
                                <div key={i} className={styles.benefitCard}>
                                    <div className={styles.benefitIcon}>{b.icon}</div>
                                    <h3 className={styles.benefitTitle}>{b.title}</h3>
                                    <p className={styles.benefitDesc}>{b.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 5. Testimonials */}
            <AnimateOnScroll animation="blurIn">
                <section className={styles.testimonialsSection}>
                    <div className="premium-container">
                        <SectionHeader
                            light
                            centered
                            tag="Success Stories"
                            title="Real outcomes. Real people."
                        />
                        <div className={styles.testimonialsGrid}>
                            {TESTIMONIALS.map((t, i) => (
                                <div key={i} className={styles.testimonialCard}>
                                    <div className={styles.outcomeBadge} style={{ background: t.color }}>
                                        <IconCheck /> {t.outcome}
                                    </div>
                                    <p className={styles.testimonialQuote}>{t.quote}</p>
                                    <div className={styles.testimonialMeta}>
                                        <div className={styles.avatar} style={{ background: t.color }}>
                                            {t.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className={styles.testimonialName}>{t.name}</div>
                                            <div className={styles.testimonialRole}>{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 6. CTA */}
            <AnimateOnScroll animation="scaleUp">
                <section className={styles.ctaSection}>
                    <div className="premium-container">
                        <div className={styles.ctaCard}>
                            <h2 className={styles.ctaTitle}>Join 300K+ job seekers.</h2>
                            <p className={styles.ctaDesc}>
                                Get matched to your next high-impact role today — completely free.
                            </p>
                            <div className={styles.ctaBtns}>
                                <Link href="/signup" className={styles.ctaPrimary}>Get Matched Today</Link>
                                <Link href="/browse-jobs" className={styles.ctaSecondary}>Browse All Jobs</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>
        </main>
    );
}
