import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { ValueShowcase } from '@/components/ui';
import { CTA } from '@/components/sections';
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

export default function AboutPage() {
    return (
        <main className={styles.page}>
            <PageHeader
                title="Reshaping the"
                highlight="architecture of hiring"
                description="We build high-performance matching infrastructure for the world's most ambitious engineering and creative teams."
                breadcrumb="Our Mission"
            />

            {/* ── Stats Strip ── */}
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

            {/* ── The Mission: Problem & Solution ── */}
            <section className={styles.storySection}>
                <div className={styles.storyGrid}>
                    <div style={{ background: 'var(--light-ice-blue)', padding: '3rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>The Legacy Problem</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>Manual screening takes 20+ hours per hire, leading to burnout and missed opportunities.</p>
                        </div>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: 'var(--border-premium)', boxShadow: 'var(--shadow-lg)' }}>
                            <h4 style={{ color: '#059669', marginBottom: '0.5rem' }}>The TalentMesh Solution</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--deep-navy)', fontWeight: 600 }}>Zero-friction matching. Our AI finds the top 1% without you lifting a finger.</p>
                        </div>
                    </div>
                    <div>
                        <span className={styles.storyTag}>Our Mission</span>
                        <h2 className={styles.storyTitle}>Abolishing recruitment friction.</h2>
                        <p className={styles.storyText}>
                            Recruitment hasn&apos;t changed in 30 years, but the speed of business has. We exist to close the gap between &quot;need&quot; and &quot;hired&quot; using a proprietary neural network.
                        </p>
                        <p className={styles.storyText}>
                            We don&apos;t care about your past titles. We care about your future trajectory. TalentMesh is designed to find where you belong, not just where you fit.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Value Showcase ── */}
            <ValueShowcase />

            {/* ── Global Footprint ── */}
            <section className="premium-section" style={{ background: 'var(--deep-navy)', color: '#fff', textAlign: 'center' }}>
                <div className="premium-container">
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-0.04em' }}>Global Talent Infrastructure</h2>
                    <p style={{ opacity: 0.7, fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 5rem' }}>
                        Moving beyond local borders. We connect the world&apos;s best engineers with the world&apos;s most innovative companies.
                    </p>
                    <div className="premium-grid-4">
                        {[
                            { label: 'Active Regions', val: '52' },
                            { label: 'Timezones Supported', val: '24' },
                            { label: 'Local Compliance', val: '100%' },
                            { label: 'Remote First', val: 'Since Day 1' }
                        ].map((stat, i) => (
                            <div key={i}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>{stat.val}</div>
                                <div style={{ fontWeight: 600, opacity: 0.6 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Innovation Labs ── */}
            <section className={styles.storySection}>
                <div className={styles.storyGrid}>
                    <div>
                        <span className={styles.storyTag}>Innovation Labs</span>
                        <h2 className={styles.storyTitle}>Always evolving.</h2>
                        <p className={styles.storyText}>
                            Our R&D team is constantly iterating on our neural matching engine. We are moving towards a future where bias is mathematically impossible.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem' }}>
                            {[
                                'Bias-Free Neural Filtering',
                                'Cross-Domain Skill Translation',
                                'Real-time Market Liquidity Indexing',
                                'Automated Technical Assessments'
                            ].map((item, id) => (
                                <li key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', fontWeight: 600, color: 'var(--deep-navy)' }}>
                                    <div style={{ width: '8px', height: '8px', background: 'var(--primary-blue)', borderRadius: '50%' }}></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div style={{ background: 'var(--light-ice-blue)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '300px' }}>
                        <div style={{ fontSize: '5rem' }}>🧪</div>
                    </div>
                </div>
            </section>

            <CTA />
        </main>
    );
}


