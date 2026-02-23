"use client";
import React from 'react';
import Link from 'next/link';
import styles from './job-seekers.module.css';

// --- Premium Custom Icon Components (SVG) ---
const IconSearch = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
);

const IconLocation = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

const IconSparkle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" />
    </svg>
);

const IconBriefcase = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const IconArrowRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

const IconShield = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconGlobe = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20" />
    </svg>
);

const IconTrending = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" />
    </svg>
);

const IconStar = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const FEATURED_JOBS = [
    {
        id: 1,
        title: "Senior AI Researcher",
        company: "Quantum Leap",
        location: "Palo Alto, CA",
        salary: "$190k - $260k",
        type: "Full-time",
        logo: "QL"
    },
    {
        id: 2,
        title: "Product Designer",
        company: "VividOps",
        location: "Remote",
        salary: "$130k - $170k",
        type: "Full-time",
        logo: "VO"
    },
    {
        id: 3,
        title: "Blockchain Architect",
        company: "DefiCore",
        location: "Singapore",
        salary: "$150k - $210k",
        type: "Contract",
        logo: "DC"
    }
];

export default function JobSeekersPage() {
    return (
        <main style={{ background: '#fff' }}>
            {/* 1. Hero Section */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>
                            <IconSparkle /> High-Priority Matching Enabled
                        </div>
                        <h1 className={styles.title}>
                            Your career, <br />
                            <span className={styles.highlight}>reimagined.</span>
                        </h1>
                        <p className={styles.description}>
                            Skip the line. Our AI matching engine identifies roles that align
                            perfectly with your skills and career trajectory.
                        </p>

                        <div className={styles.searchWidget}>
                            <div className={styles.searchField}>
                                <IconSearch />
                                <input type="text" placeholder="Design, Engineering, AI..." className={styles.input} />
                            </div>
                            <div className={styles.searchField}>
                                <IconLocation />
                                <input type="text" placeholder="Remote or City" className={styles.input} />
                            </div>
                            <button className={styles.searchBtn}>Search Jobs</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Job Feed */}
            <section className={styles.discoverySection}>
                <div className="premium-container">
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Curated for You</h2>
                        <p style={{ color: 'var(--medium-grey)', fontSize: '1.1rem' }}>Elite opportunities from our premium partner network.</p>
                    </div>

                    <div className={styles.jobGrid}>
                        {FEATURED_JOBS.map((job) => (
                            <div key={job.id} className={styles.jobCard}>
                                <div className={styles.companyLogo} style={{ background: 'var(--primary-blue)' }}>
                                    {job.logo}
                                </div>
                                <h3 className={styles.jobTitle}>{job.title}</h3>
                                <span className={styles.companyName}>{job.company}</span>

                                <div className={styles.jobMeta}>
                                    <div className={styles.metaItem}><IconLocation /> {job.location}</div>
                                    <div className={styles.metaItem}><IconBriefcase /> {job.type}</div>
                                    <div className={styles.metaItem}><div style={{ color: 'var(--primary-blue)', fontWeight: 800 }}>{job.salary}</div></div>
                                </div>

                                <Link href={`/jobs/${job.id}`} className={styles.applyLink}>
                                    View Details <IconArrowRight />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Aura Advantage */}
            <section className={styles.auraSection}>
                <div className="premium-container">
                    <div className={styles.auraGrid}>
                        <div className={styles.auraVisual}>
                            <div className={styles.orb}></div>
                            <div className={styles.scanner}></div>

                            <div className={`${styles.matchCard} ${styles.matchCardTop}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div className={styles.avatar}>QL</div>
                                    <div className={styles.matchScore}>98%</div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>AI Research Lead</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.25rem' }}>Quantum Leap • Palo Alto</div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: '98%' }}></div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>PyTorch</span>
                                    <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>NLP</span>
                                </div>
                            </div>

                            <div className={`${styles.matchCard} ${styles.matchCardBottom}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div className={styles.avatar} style={{ background: 'var(--dodger-blue)' }}>VO</div>
                                    <div className={styles.matchScore} style={{ borderTopColor: 'var(--dodger-blue)' }}>94%</div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Senior Designer</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.25rem' }}>VividOps • Remote</div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: '94%', background: 'var(--dodger-blue)', boxShadow: '0 0 10px var(--dodger-blue)' }}></div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Figma</span>
                                    <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Product</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,123,255,0.1)', padding: '8px 16px', borderRadius: '50px', marginBottom: '2rem' }}>
                                <IconSparkle />
                                <span style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Aura Matching Engine</span>
                            </div>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0 0 2rem', color: '#fff', lineHeight: 1.1 }}>Stop searching. <br />Start being found.</h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', lineHeight: 1.7, marginBottom: '3rem' }}>
                                Our proprietary AI goes beyond keywords. It understands your career narrative, mapping your unique skills to roles where you'll have the biggest impact.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>Precision Match</h4>
                                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Identifying nuances in your experience that traditional search misses.</p>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>Direct Placement</h4>
                                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Get fast-tracked into final-round interviews through automated discovery.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Benefits */}
            <section className={styles.benefitsSection}>
                <div className="premium-container">
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>The Seeker Protocol</h2>
                        <p style={{ color: 'var(--medium-grey)', fontSize: '1.1rem' }}>We don't just find jobs; we build career paths with purpose.</p>
                    </div>

                    <div className={styles.benefitsGrid}>
                        <div className={styles.benefitCard}>
                            <div className={styles.iconWrapper}><IconGlobe /></div>
                            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Global Access</h3>
                            <p style={{ color: 'var(--medium-grey)', fontSize: '0.95rem', marginTop: '1rem', lineHeight: 1.6 }}>Connect with elite tech companies across 45+ international hubs.</p>
                        </div>
                        <div className={styles.benefitCard}>
                            <div className={styles.iconWrapper}><IconShield /></div>
                            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Full Privacy</h3>
                            <p style={{ color: 'var(--medium-grey)', fontSize: '0.95rem', marginTop: '1rem', lineHeight: 1.6 }}>Your search is invisible to current colleagues and employers.</p>
                        </div>
                        <div className={styles.benefitCard}>
                            <div className={styles.iconWrapper}><IconTrending /></div>
                            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Market Insights</h3>
                            <p style={{ color: 'var(--medium-grey)', fontSize: '0.95rem', marginTop: '1rem', lineHeight: 1.6 }}>Receive real-time data on your compensation potential.</p>
                        </div>
                        <div className={styles.benefitCard}>
                            <div className={styles.iconWrapper}><IconStar /></div>
                            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Elite Coaching</h3>
                            <p style={{ color: 'var(--medium-grey)', fontSize: '0.95rem', marginTop: '1rem', lineHeight: 1.6 }}>Interview preparation from vetted industry veterans.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Final CTA */}
            <section className={styles.ctaWrapper}>
                <div className="premium-container">
                    <div className={styles.ctaCard}>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem' }}>Ready for your next move?</h2>
                        <p style={{ fontSize: '1.35rem', opacity: 0.9, marginBottom: '4rem', maxWidth: '650px', margin: '0 auto 4rem' }}>
                            Join 50,000+ top-tier professionals letting AI find their dream roles.
                        </p>
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/register" style={{
                                background: 'white',
                                color: 'var(--primary-blue)',
                                padding: '1.25rem 3.5rem',
                                borderRadius: '14px',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                            }}>
                                Create Free Profile
                            </Link>
                            <Link href="/how-it-works" style={{
                                background: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                padding: '1.25rem 3.5rem',
                                borderRadius: '14px',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                border: '1px solid rgba(255,255,255,0.3)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                Explore Engine
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}



