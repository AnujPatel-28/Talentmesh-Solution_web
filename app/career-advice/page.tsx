"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './career-advice.module.css';

// --- Premium Custom Icons ---
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

const IconShield = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconGlobe = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20" />
    </svg>
);

const IconSearch = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
);

const ARTICLES_DATA = [
    {
        title: "Optimizing Your LinkedIn Profile",
        description: "How to attract the attention of top recruiters with a high-impact profile structure and keyword optimization.",
        category: "Growth",
        date: "Feb 22, 2026",
        link: "/career-advice/linkedin-optimization",
        accent: "#007BFF"
    },
    {
        title: "Negotiating Your Tech Salary",
        description: "A data-backed approach to securing the compensation you deserve in a highly competitive market.",
        category: "Finance",
        date: "Feb 18, 2026",
        link: "/career-advice/salary-negotiation",
        accent: "#10b981"
    },
    {
        title: "The Roadmap to Senior PM",
        description: "A step-by-step strategic guide for engineers and designers looking to pivot into management roles.",
        category: "Strategy",
        date: "Feb 15, 2026",
        link: "/career-advice/pm-transition",
        accent: "#f59e0b"
    },
    {
        title: "Mastering System Design",
        description: "Architectural patterns and diagnostic questions you'll face in top-tier engineering interviews.",
        category: "Technical",
        date: "Feb 10, 2026",
        link: "/career-advice/system-design",
        accent: "#ef4444"
    },
    {
        title: "Building Personal Brand",
        description: "Why thought leadership is the new currency for developers in the open-source era.",
        category: "Growth",
        date: "Feb 05, 2026",
        link: "/career-advice/personal-brand",
        accent: "#8b5cf6"
    },
    {
        title: "Remote Work Excellence",
        description: "Strategies for staying visible and getting promoted while working from anywhere in the world.",
        category: "Culture",
        date: "Jan 28, 2026",
        link: "/career-advice/remote-work",
        accent: "#06b6d4"
    }
];

const CATEGORIES = ["All", "Growth", "Technical", "Finance", "Strategy", "Culture"];

export default function CareerAdvicePage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredArticles = React.useMemo(() => {
        return ARTICLES_DATA.filter(art => {
            const matchesCategory = activeCategory === "All" || art.category === activeCategory;
            const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                art.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    return (
        <main style={{ background: '#fff' }}>
            {/* 1. Hero Section */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>
                            <IconSparkle /> Updated Daily • 12.4k Readers
                        </div>
                        <h1 className={styles.title}>
                            Architect your <br />
                            <span className={styles.highlight}>elite career.</span>
                        </h1>
                        <p className={styles.description}>
                            Data-driven insights, diagnostic guides, and expert blueprints designed
                            for the next generation of digital leaders.
                        </p>

                        <div className={styles.searchBar}>
                            <div className={styles.searchField}>
                                <IconSearch />
                                <input
                                    type="text"
                                    placeholder="Search career blueprints..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className={styles.searchBtn}>Search</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Featured Articles */}
            <section className={styles.featuredSection}>
                <div className="premium-container">
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.mainSectionTitle}>Latest Blueprints</h2>
                        <div className={styles.categoryGrid}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`${styles.categoryChip} ${activeCategory === cat ? styles.categoryChipActive : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.articleGrid}>
                        {filteredArticles.map((article, i) => (
                            <div key={i} className={styles.articleCard}>
                                <div className={styles.cardImageWrapper}>
                                    <div className={styles.cardImagePlaceholder} style={{ background: `linear-gradient(135deg, var(--deep-navy), ${article.accent})` }} />
                                    <span className={styles.categoryBadge}>{article.category}</span>
                                </div>
                                <div className={styles.cardContent}>
                                    <div className={styles.cardDate}>{article.date}</div>
                                    <h3 className={styles.cardTitle}>{article.title}</h3>
                                    <p className={styles.cardDesc}>{article.description}</p>
                                    <Link href={article.link} className={styles.readMore}>
                                        Read Protocol <IconArrowRight />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Diagnostic Mentorship Section */}
            <section className={styles.mentorshipSection}>
                <div className="premium-container">
                    <div className={styles.mentorshipGrid}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,123,255,0.1)', padding: '8px 16px', borderRadius: '50px', marginBottom: '2rem' }}>
                                <IconSparkle />
                                <span style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Expert Guidance</span>
                            </div>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem', lineHeight: 1.1 }}>Mentorship <br /> at Scale.</h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', lineHeight: 1.7, marginBottom: '3rem' }}>
                                Stop guessing your next move. Connect with industry veterans who have successfully navigated the same paths you're on today.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>Resume Diagnostics</h4>
                                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Get hard-hitting feedback on your positioning and impact statements.</p>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>Negotiation Coaching</h4>
                                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Master the psychology of high-stakes compensation talks.</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.insightCard}>
                            <div className={styles.mentorHeadshot} />
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>"The strategy we built didn't just land me a job, it landed me a 40% salary increase."</div>
                            <div style={{ color: 'var(--primary-blue)', fontWeight: 800 }}>Sarah Chen • Senior Architect @ Meta</div>
                            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.6 }}>
                                    <IconShield /> Verified Outcome
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.6 }}>
                                    <IconGlobe /> Global Network
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Custom CTA */}
            <section className={styles.ctaSection}>
                <div className="premium-container">
                    <div className={styles.ctaCard}>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem' }}>Ready to optimize?</h2>
                        <p style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '4.5rem', maxWidth: '600px', margin: '0 auto 4.5rem' }}>
                            Join 50,000+ professionals receiving weekly growth blueprints in their inbox.
                        </p>
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/newsletter" style={{ background: 'white', color: 'var(--primary-blue)', padding: '1.25rem 3.5rem', borderRadius: '14px', fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>Subscribe Now</Link>
                            <Link href="/coaching" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '1.25rem 3.5rem', borderRadius: '14px', fontWeight: 900, fontSize: '1.1rem', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>Book a Coach</Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
