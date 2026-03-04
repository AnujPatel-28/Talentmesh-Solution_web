'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getJobById } from '../jobsData';
import styles from './jobDetail.module.css';

// ─── Icons ──────────────────────────────────────────────────────────────────────
const Ico = {
    Location: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
    Briefcase: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    Sparkle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915Z" /></svg>,
    Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    Share: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
    Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    ArrowR: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>,
    Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
    Salary: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    Globe: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    Building: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="15" y2="6" /><line x1="9" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="10" y2="14" /><line x1="14" y1="14" x2="15" y2="14" /><line x1="9" y1="18" x2="15" y2="18" /></svg>,
    Award: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
};

const BENEFIT_ICONS = ['💰', '🏖️', '📚', '💎', '🩺'];

export default function JobDetailPage() {
    const params = useParams();
    const jobId = Number(params.id);
    const job = getJobById(jobId);

    if (!job) {
        return (
            <main className={styles.page}>
                <div className="premium-container" style={{ padding: '120px 0', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0D47A1', marginBottom: 12 }}>Job Not Found</h1>
                    <p style={{ color: '#475569', marginBottom: 24 }}>The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    <Link href="/browse-jobs" style={{ color: '#007BFF', fontWeight: 600, textDecoration: 'underline' }}>← Browse all jobs</Link>
                </div>
            </main>
        );
    }

    const matchColor = job.match >= 90 ? '#059669' : job.match >= 80 ? '#1E88E5' : '#475569';

    return (
        <main className={styles.page}>

            {/* ── Hero ── */}
            <section className={styles.hero}>
                <div className="premium-container">
                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <span className={styles.breadcrumbSep}>›</span>
                        <Link href="/browse-jobs">Browse Jobs</Link>
                        <span className={styles.breadcrumbSep}>›</span>
                        <span>{job.title}</span>
                    </nav>

                    <div className={styles.heroInner}>
                        <div className={styles.companyLogo} style={{ background: job.color }}>
                            {job.logo}
                        </div>

                        <div className={styles.heroInfo}>
                            <h1 className={styles.heroTitle}>{job.title}</h1>
                            <div className={styles.heroMeta}>
                                <span className={styles.heroMetaItem}><Ico.Building /> {job.company}</span>
                                <span className={styles.heroMetaItem}><Ico.Location /> {job.location}</span>
                                <span className={styles.heroMetaItem}><Ico.Clock /> {job.posted}</span>
                            </div>
                            <div className={styles.heroBadges}>
                                <span className={`${styles.badge} ${styles.badgeType}`}>{job.type}</span>
                                <span className={`${styles.badge} ${styles.badgeSalary}`}><Ico.Salary /> {job.salary}</span>
                                <span className={`${styles.badge} ${styles.badgeCountry}`}>{job.country === 'India' ? '🇮🇳' : '🇺🇸'} {job.country}</span>
                                {job.match >= 70 && (
                                    <span className={`${styles.badge} ${styles.badgeMatch}`}><Ico.Sparkle /> {job.match}% Match</span>
                                )}
                            </div>
                        </div>

                        <div className={styles.heroActions}>
                            <Link href="/signup" className={styles.applyBtnHero}>
                                Apply Now <Ico.ArrowR />
                            </Link>
                            <button className={styles.saveBtn} aria-label="Save job"><Ico.Heart /></button>
                            <button className={styles.shareBtn} aria-label="Share"><Ico.Share /></button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Body ── */}
            <div className="premium-container">
                <div className={styles.body}>
                    {/* ── Main Content ── */}
                    <div>
                        {/* Description */}
                        <div className={styles.contentCard}>
                            <h2 className={styles.cardTitle}>
                                <Ico.Briefcase /> About this Role
                            </h2>
                            <p className={styles.description}>{job.description}</p>
                        </div>

                        {/* Responsibilities */}
                        <div className={styles.contentCard}>
                            <h2 className={styles.cardTitle}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                Key Responsibilities
                            </h2>
                            <ul className={styles.itemList}>
                                {job.responsibilities.map((r, i) => (
                                    <li key={i}>
                                        <span className={styles.bullet} />
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Requirements */}
                        <div className={styles.contentCard}>
                            <h2 className={styles.cardTitle}>
                                <Ico.Star /> Requirements
                            </h2>
                            <ul className={styles.itemList}>
                                {job.requirements.map((r, i) => (
                                    <li key={i}>
                                        <span className={styles.checkBullet}><Ico.Check /></span>
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Benefits */}
                        <div className={styles.contentCard}>
                            <h2 className={styles.cardTitle}>
                                <Ico.Award /> Benefits & Perks
                            </h2>
                            <div className={styles.benefitsGrid}>
                                {job.benefits.map((b, i) => (
                                    <div key={i} className={styles.benefitItem}>
                                        <span className={styles.benefitIcon}>{BENEFIT_ICONS[i % BENEFIT_ICONS.length]}</span>
                                        {b}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <aside className={styles.sidebar}>
                        {/* Job Overview */}
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>Job Overview</h3>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}><Ico.Briefcase /> Job Type</span>
                                <span className={styles.detailValue}>{job.type}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}><Ico.Location /> Location</span>
                                <span className={styles.detailValue}>{job.location}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}><Ico.Salary /> Salary</span>
                                <span className={styles.detailValue}>{job.salary}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}><Ico.Star /> Experience</span>
                                <span className={styles.detailValue}>{job.exp} Level</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}><Ico.Building /> Industry</span>
                                <span className={styles.detailValue}>{job.industry}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}><Ico.Globe /> Country</span>
                                <span className={styles.detailValue}>{job.country === 'India' ? '🇮🇳' : '🇺🇸'} {job.country}</span>
                            </div>

                            {/* Match Bar */}
                            {job.match >= 60 && (
                                <div className={styles.matchBar}>
                                    <div className={styles.matchBarLabel}>
                                        <span className={styles.matchBarLabelText}><Ico.Sparkle /> AI Match Score</span>
                                        <span className={styles.matchBarValue} style={{ color: matchColor }}>{job.match}%</span>
                                    </div>
                                    <div className={styles.matchBarTrack}>
                                        <div className={styles.matchBarFill} style={{ width: `${job.match}%` }} />
                                    </div>
                                </div>
                            )}

                            <span className={styles.postedAt}><Ico.Clock /> Posted {job.posted}</span>
                        </div>

                        {/* Company Info */}
                        <div className={`${styles.sidebarCard} ${styles.companyCard}`}>
                            <div className={styles.companyLogoSidebar} style={{ background: job.color }}>
                                {job.logo}
                            </div>
                            <div className={styles.companyName}>{job.company}</div>
                            <div className={styles.companyIndustry}>{job.industry} • {job.country}</div>
                            <p className={styles.companyAbout}>{job.about}</p>
                            <button className={styles.viewCompanyBtn}>
                                View Company Profile <Ico.ArrowR />
                            </button>
                        </div>

                        {/* Apply CTA */}
                        <div className={styles.ctaCard}>
                            <h3 className={styles.ctaTitle}>Interested in this role?</h3>
                            <p className={styles.ctaText}>
                                Create your free account to apply and get AI-matched to similar opportunities.
                            </p>
                            <Link href="/signup" className={styles.ctaBtn}>
                                Get Started <Ico.ArrowR />
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
