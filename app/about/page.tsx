"use client";
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/ui';
import { ValueShowcase } from '@/components/ui';
import { CTA } from '@/components/sections';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import styles from './about.module.css';

const STATS = [
    { num: '10K+', label: 'Global Companies' },
    { num: '3M+', label: 'Monthly Candidates' },
    { num: '52', label: 'Countries Served' },
    { num: '60%', label: 'Efficiency Gain' },
];

const VALUES = [
    { title: 'Data Integrity', desc: 'We prioritize bias-free data sets and verifiable accuracy over easy matches.', icon: '📊' },
    { title: 'Human Agency', desc: 'AI handles the manual labor so humans can focus on the final connection.', icon: '🤝' },
    { title: 'Radical Speed', desc: 'Built for high-velocity teams who need to scale without friction.', icon: '⚡' },
];

const LEADERSHIP = [
    { name: 'Arjun Mehta', role: 'CEO & Founder', initials: 'AM' },
    { name: 'Sofia Chen', role: 'CTO', initials: 'SC' },
    { name: 'James Okafor', role: 'Head of Product', initials: 'JO' },
    { name: 'Priya Nair', role: 'Head of Design', initials: 'PN' },
];

const TIMELINE = [
    { year: '2021', title: 'The Genesis', body: 'TalentMesh was founded to bridge the gap between AI research and global recruitment.' },
    { year: '2023', title: 'Global Scale', body: 'Reached 1,000 active enterprises and expanded into 30+ markets.' },
    { year: '2025', title: 'Autonomous Hiring', body: 'Launching the first ethical autopilot for end-to-end recruitment.' },
];

const INNOVATION_ITEMS = [
    'Bias-Free Neural Filtering',
    'Cross-Domain Skill Translation',
    'Real-time Market Liquidity Indexing',
    'Automated Technical Assessments',
];

import { SectionHeader } from '@/components/ui';

export default function AboutPage() {
    return (
        <main className={styles.page}>
            <PageHeader
                title="Reshaping the"
                highlight="architecture of hiring"
                description="We build high-performance matching infrastructure for the world's most ambitious engineering and creative teams."
                breadcrumb="Our Mission"
            />

            <AnimateOnScroll animation="scaleUp">
                <section className={styles.statsStrip}>
                    <div className={styles.statsGrid}>
                        {STATS.map((s, i) => (
                            <div key={i} className={styles.statItem}>
                                <span className={styles.statNum}>{s.num}</span>
                                <span className={styles.statLabel}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeUp">
                <section className={styles.storySection}>
                    <div className={styles.storyGrid}>
                        <div className={styles.missionVisual}>
                            <div className={`${styles.missionCard} ${styles.missionCardProblem}`}>
                                <h4 className={`${styles.missionCardTitle} ${styles.missionCardTitleProblem}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    The Legacy Problem
                                </h4>
                                <p className={styles.missionCardText}>Manual screening takes 20+ hours per hire, leading to burnout and missed opportunities.</p>
                            </div>
                            <div className={`${styles.missionCard} ${styles.missionCardSolution}`}>
                                <h4 className={`${styles.missionCardTitle} ${styles.missionCardTitleSolution}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    The TalentMesh Solution
                                </h4>
                                <p className={`${styles.missionCardText} ${styles.missionCardTextSolution}`}>Zero-friction matching. Our AI finds the top 1% without you lifting a finger.</p>
                            </div>
                            <div className={styles.missionImageWrapper}>
                                <Image
                                    src="/images/global-mission.jpg"
                                    alt="Global Recruitment Architecture"
                                    fill
                                    className={styles.missionImg}
                                />
                            </div>
                        </div>
                        <div>
                            <SectionHeader
                                tag="Our Mission"
                                title="Abolishing recruitment friction."
                                description={<>Recruitment hasn&apos;t changed in 30 years, but the speed of business has. We exist to close the gap between &quot;need&quot; and &quot;hired&quot; using a proprietary neural network.<br/><br/>We don&apos;t care about your past titles. We care about your future trajectory. TalentMesh is designed to find where you belong, not just where you fit.</>}
                            />
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeUp" delay={100}>
                <ValueShowcase />
            </AnimateOnScroll>

            <AnimateOnScroll animation="blurIn">
                <section className="premium-section" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #081428 100%)', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div className="premium-container">
                        <SectionHeader
                            light
                            centered
                            tag="Connectivity"
                            title="Global Talent Infrastructure"
                            description="Moving beyond local borders. We connect the world's best engineers with the world's most innovative companies."
                        />
                        <div className="premium-grid-4">
                            {[
                                { label: 'Active Regions', val: '52' },
                                { label: 'Timezones Supported', val: '24' },
                                { label: 'Local Compliance', val: '100%' },
                                { label: 'Remote First', val: 'Since Day 1' }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className={styles.globalStatValue}>{stat.val}</div>
                                    <div className={styles.globalStatLabel}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeRight">
                <section className={styles.storySection}>
                    <div className={styles.storyGrid}>
                        <div>
                            <SectionHeader
                                tag="Innovation"
                                title={<>Building the Future of <span className="text-gradient">Human Talent.</span></>}
                                description="TalentMesh was born from a simple realization: the traditional recruitment process is broken for both sides. We decided to fix it using data science and empathy."
                            />
                            <ul className={styles.innovationList}>
                                {INNOVATION_ITEMS.map((item, id) => (
                                    <li key={id} className={styles.innovationItem}>
                                        <div className={styles.innovationDot}></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.labsVisual}>
                            <div className={styles.labsIcon}>
                                <svg className={styles.labsIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 3h6v4l3 8H6l3-8V3z" />
                                    <path d="M6 15v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
                                    <path d="M10 3v4" />
                                    <path d="M14 3v4" />
                                </svg>
                                <span className={styles.labsIconLabel}>R&D Active</span>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeUp">
                <CTA />
            </AnimateOnScroll>
        </main>
    );
};