import Link from 'next/link';
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
            {/* ── Hero ── */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <span className={styles.heroBadge}>Our Mission</span>
                    <h1 className={styles.heroTitle}>
                        Reshaping the <span>architecture</span> of hiring.
                    </h1>
                    <p className={styles.heroDesc}>
                        We build high-performance matching infrastructure for the world&apos;s most ambitious engineering and creative teams.
                    </p>
                </div>
            </section>

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

            {/* ── Story ── */}
            <section className={styles.storySection}>
                <div className={styles.storyGrid}>
                    <div className={styles.storyImageWrap}>
                        {/* Image Placeholder colored to brand navy */}
                        <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontStyle: 'italic', opacity: 0.8 }}>
                            Architecting the future.
                        </div>
                    </div>
                    <div>
                        <span className={styles.storyTag}>Our Story</span>
                        <h2 className={styles.storyTitle}>A new standard for talent acquisition.</h2>
                        <p className={styles.storyText}>
                            Hiring hasn&apos;t changed in decades, but the technology used to find talent has stalled. Most companies are still using outdated keyword matching that misses the nuance of real-world experience.
                        </p>
                        <p className={styles.storyText}>
                            At TalentMesh, we moved beyond keywords. We built a deep learning engine that understands context, trajectory, and culture — the three pillars of a successful hire.
                        </p>
                        <Link href="/contact" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
                            Join our team &rarr;
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Values ── */}
            <section className={styles.valuesSection}>
                <div className={styles.valuesHeader}>
                    <span className={styles.storyTag}>Foundational Values</span>
                    <h2 className={styles.storyTitle}>Built on core principles.</h2>
                </div>
                <div className={styles.valuesGrid}>
                    {VALUES.map((v, i) => (
                        <div key={i} className={styles.valueCard}>
                            <div className={styles.valueIcon}>{v.icon}</div>
                            <h3 className={styles.valueTitle}>{v.title}</h3>
                            <p className={styles.valueDesc}>{v.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Leadership ── */}
            <section className={styles.teamSection}>
                <div className={styles.valuesHeader}>
                    <span className={styles.storyTag}>Leadership</span>
                    <h2 className={styles.storyTitle}>Guided by experience.</h2>
                </div>
                <div className={styles.teamGrid}>
                    {LEADERSHIP.map((m, i) => (
                        <div key={i} className={styles.memberCard}>
                            <div className={styles.memberAvatar}>{m.initials}</div>
                            <h3 className={styles.memberName}>{m.name}</h3>
                            <p className={styles.memberRole}>{m.role}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Timeline ── */}
            <section className={styles.timelineSection}>
                <div className={styles.valuesHeader}>
                    <span className={styles.storyTag}>Timeline</span>
                    <h2 className={styles.storyTitle}>Our journey.</h2>
                </div>
                <div className={styles.timelineGrid}>
                    {TIMELINE.map((t, i) => (
                        <div key={i} className={styles.timelineItem}>
                            <div className={styles.timelineYear}>{t.year}</div>
                            <div className={styles.timelineContent}>
                                <h3 className={styles.timelineHeadline}>{t.title}</h3>
                                <p className={styles.timelineBody}>{t.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ padding: '8rem 2rem', background: '#ffffff', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Ready to scale?</h2>
                <Link href="/signup" style={{ background: '#0f172a', color: '#fff', padding: '1rem 3rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                    Get Started Now
                </Link>
            </section>
        </main>
    );
}
