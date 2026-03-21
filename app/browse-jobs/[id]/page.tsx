'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './jobDetail.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { BlogFeed } from '@/components/sections';
import AnimateOnScroll from '@/components/AnimateOnScroll';

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
    const jobId = params.id as string;
    const { user } = useAuth();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        async function fetchJob() {
            try {
                const { data } = await insforge.database
                    .from('jobs')
                    .select('*, company_profiles(*)')
                    .eq('id', jobId)
                    .single();
                setJob(data);

                if (user) {
                    const { data: app } = await insforge.database
                        .from('applications')
                        .select('id')
                        .eq('job_id', jobId)
                        .eq('candidate_id', user.id)
                        .single();
                    if (app) setApplied(true);
                }
            } catch (err) {
                console.error('Error fetching job:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchJob();
    }, [jobId, user]);

    const handleApply = async () => {
        if (!user) return;
        setIsApplying(true);
        try {
            const { error: appError } = await insforge.database
                .from('applications')
                .insert([{
                    job_id: jobId,
                    candidate_id: user.id,
                    status: 'applied'
                }]);
            
            if (appError) throw appError;

            // Log activity
            await insforge.database.from('activity').insert([{
                user_id: user.id,
                description: `Applied to ${job.title} at ${job.company_profiles?.company_name}`,
                type: 'application'
            }]);

            setApplied(true);
            alert('Application sent successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to apply. Please try again.');
        } finally {
            setIsApplying(false);
        }
    };

    if (loading) return <div className={styles.page}><p style={{ color: 'white', padding: '5rem', textAlign: 'center' }}>Loading Job Details...</p></div>;

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

    const matchColor = job.ai_match_rate >= 90 ? '#059669' : job.ai_match_rate >= 80 ? '#1E88E5' : '#475569';

    return (
        <main className={styles.page}>

            {/* ── Hero ── */}
            <AnimateOnScroll animation="fadeUp">
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
                            <div className={styles.companyLogo} style={{ background: job.color || '#0D47A1' }}>
                                {job.logo || job.company_profiles?.company_name?.[0]}
                            </div>

                            <div className={styles.heroInfo}>
                                <h1 className={styles.heroTitle}>{job.title}</h1>
                                <div className={styles.heroMeta}>
                                    <span className={styles.heroMetaItem}><Ico.Building /> {job.company_profiles?.company_name}</span>
                                    <span className={styles.heroMetaItem}><Ico.Location /> {job.location}</span>
                                    <span className={styles.heroMetaItem}><Ico.Clock /> {job.posted_days || 0} days ago</span>
                                </div>
                                <div className={styles.heroBadges}>
                                    <span className={`${styles.badge} ${styles.badgeType}`}>{job.type}</span>
                                    <span className={`${styles.badge} ${styles.badgeSalary}`}><Ico.Salary /> {job.salary}</span>
                                    {job.ai_match_rate >= 70 && (
                                        <span className={`${styles.badge} ${styles.badgeMatch}`}><Ico.Sparkle /> {job.ai_match_rate}% Match</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.heroActions}>
                                {user?.role === 'candidate' ? (
                                    <button 
                                        className={`${styles.applyBtnHero} ${applied ? styles.appliedBtn : ''}`}
                                        onClick={handleApply}
                                        disabled={applied || isApplying}
                                    >
                                        {isApplying ? 'Applying...' : applied ? 'Applied' : 'Quick Apply'} <Ico.ArrowR />
                                    </button>
                                ) : !user ? (
                                    <Link href="/login" className={styles.applyBtnHero}>
                                        Login to Apply <Ico.ArrowR />
                                    </Link>
                                ) : (
                                    <span className={styles.badge}>Recruiter View</span>
                                )}
                                <button className={styles.saveBtn} aria-label="Save job"><Ico.Heart /></button>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* ── Body ── */}
            <div className="premium-container">
                <div className={styles.body}>
                    <div className={styles.leftCol}>
                        <AnimateOnScroll animation="fadeUp" delay={100}>
                            <div className={styles.contentCard}>
                                <h2 className={styles.cardTitle}>
                                    <Ico.Briefcase /> About this Role
                                </h2>
                                <p className={styles.description}>{job.description}</p>
                            </div>
                        </AnimateOnScroll>

                        {job.responsibilities && (
                            <AnimateOnScroll animation="fadeUp" delay={200}>
                                <div className={styles.contentCard}>
                                    <h2 className={styles.cardTitle}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                        Key Responsibilities
                                    </h2>
                                    <ul className={styles.itemList}>
                                        {(Array.isArray(job.responsibilities) ? job.responsibilities : []).map((r: string, i: number) => (
                                            <li key={i}><span className={styles.bullet} />{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            </AnimateOnScroll>
                        )}

                        {job.requirements && (
                            <AnimateOnScroll animation="fadeUp" delay={300}>
                                <div className={styles.contentCard}>
                                    <h2 className={styles.cardTitle}>
                                        <Ico.Star /> Requirements
                                    </h2>
                                    <ul className={styles.itemList}>
                                        {(Array.isArray(job.requirements) ? job.requirements : []).map((r: string, i: number) => (
                                            <li key={i}><span className={styles.checkBullet}><Ico.Check /></span>{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            </AnimateOnScroll>
                        )}
                    </div>

                    <aside className={styles.sidebar}>
                        <AnimateOnScroll animation="fadeUp" delay={400}>
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
                                    <span className={styles.detailLabel}><Ico.Salary /> Salary Range</span>
                                    <span className={styles.detailValue}>{job.salary}</span>
                                </div>

                                {job.ai_match_rate >= 60 && (
                                    <div className={styles.matchBar}>
                                        <div className={styles.matchBarLabel}>
                                            <span className={styles.matchBarLabelText}><Ico.Sparkle /> AI Match Score</span>
                                            <span className={styles.matchBarValue} style={{ color: matchColor }}>{job.ai_match_rate}%</span>
                                        </div>
                                        <div className={styles.matchBarTrack}>
                                            <div className={styles.matchBarFill} style={{ width: `${job.ai_match_rate}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AnimateOnScroll>

                        <AnimateOnScroll animation="fadeUp" delay={500}>
                            <div className={styles.sidebarCard}>
                                <h3 className={styles.sidebarTitle}>Company</h3>
                                <div className={styles.companyNameS}>{job.company_profiles?.company_name}</div>
                                <p className={styles.companyAboutS}>{job.company_profiles?.about || 'Leading innovators.'}</p>
                            </div>
                        </AnimateOnScroll>
                    </aside>
                </div>
            </div>
            <BlogFeed />
        </main>
    );
}
