"use client";
import React, { useEffect, useState } from 'react';
import styles from './candidate.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

/* ─── Inline SVG icons ─── */
const IC = {
    send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
    target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    cal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    star: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    clock: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    monitor: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    file: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    sliders: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /></svg>,
    award: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
    chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>,
    arrowRight: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
    trending: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    moreH: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
};

export default function CandidateHome({ params }: { params: { role_id: string } }) {
    const { role_id } = React.use(params as any) as any || {}; // Handle async params
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Profile
                const { data: profileData } = await insforge.database
                    .from('candidate_profiles')
                    .select('*')
                    .limit(1)
                    .single();
                setProfile(profileData);

                // Fetch Jobs with Company details (lowercase relation name because postgrest-js might handle it)
                // Actually in @insforge/sdk, it's just raw PostgREST.
                const { data: jobData } = await insforge.database
                    .from('jobs')
                    .select('*, company_profiles(*)')
                    .limit(3);
                setJobs(jobData || []);

                // Fetch Activity
                const { data: actData } = await insforge.database
                    .from('activity')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);
                setActivity(actData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <div className={styles.dash}><p style={{ color: 'white', padding: '2rem' }}>Loading Dashboard...</p></div>;

    const userName = authUser?.name || profile?.name || authUser?.email?.split('@')[0] || 'User';

    return (
        <div className={styles.dash}>
            {/* Greeting */}
            <div className={styles.greet}>
                <h1 className={styles.greetTitle}>Welcome back, {userName}!</h1>
                <p className={styles.greetSub}>Here&apos;s what&apos;s happening with your job search today.</p>
            </div>

            {/* Stat Cards */}
            <AnimateOnScroll animation="fadeUp" delay={100}>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Active Applications</span>
                            <span className={styles.statIconBox} style={{ background: '#eff6ff', color: 'var(--primary-blue)' }}>{IC.send}</span>
                        </div>
                        <span className={styles.statVal}>12</span>
                        <span className={styles.statChange}>{IC.trending} +2 this week</span>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Profile Strength</span>
                            <span className={styles.statIconBox} style={{ background: '#f0fdf4', color: '#10b981' }}>{IC.target}</span>
                        </div>
                        <span className={styles.statVal}>{profile?.profile_strength || 85}%</span>
                        <span className={styles.statHint}>Add {Math.max(0, 90 - (profile?.profile_strength || 85))}% more to reach 90%</span>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Upcoming Interviews</span>
                            <span className={styles.statIconBox} style={{ background: '#fef3c7', color: '#f59e0b' }}>{IC.cal}</span>
                        </div>
                        <span className={styles.statVal}>2</span>
                        <span className={styles.statHint}>Next: Today, 2:00 PM</span>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* Main Grid */}
            <AnimateOnScroll animation="fadeUp" delay={200}>
                <div className={styles.mainGrid}>
                    <div className={styles.leftCol}>
                        {/* Top AI Matches */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitle}>{IC.star} Top AI Matches</h2>
                                <button className={styles.viewAll}>View all matches</button>
                            </div>
                            {jobs.map((job, i) => (
                                <div key={i} className={styles.jobCard}>
                                    <div className={styles.jobIcon}>{job.company_profiles?.company_name?.[0] || 'J'}</div>
                                    <div className={styles.jobBody}>
                                        <div className={styles.jobRow}>
                                            <span className={styles.jobTitle}>{job.title}</span>
                                            <span className={styles.matchBadge}>{IC.check} {job.ai_match_rate}% Match</span>
                                        </div>
                                        <span className={styles.jobMeta}>{job.company_profiles?.company_name} · {job.location}</span>
                                        <div className={styles.jobTags}>
                                            {(job.tags || ['Design', 'Full-time']).map((t: string) => <span key={t} className={styles.tag}>{t}</span>)}
                                        </div>
                                        <div className={styles.jobFoot}>
                                            <span className={styles.jobTime}>Posted {job.posted_days} days ago</span>
                                            <button className={styles.viewJobBtn}>View Job</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Recent Activity</h2>
                            {activity.map((act, i) => (
                                <div key={i} className={styles.actItem}>
                                    <span className={styles.actIcon}>{IC.eye}</span>
                                    <div className={styles.actContent}>
                                        <span className={styles.actText}>{act.description}</span>
                                        <span className={styles.actTime}>{act.time_ago}</span>
                                    </div>
                                    {act.meta && <button className={styles.actAction}>View</button>}
                                </div>
                            ))}
                            <button className={styles.viewAllFooter}>View All Activity</button>
                        </div>
                    </div>

                    <div className={styles.rightCol}>
                        {/* Schedule */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitle}>Schedule</h2>
                                <button className={styles.moreBtn}>{IC.moreH}</button>
                            </div>
                            <div className={styles.scheduleItem}>
                                <div className={styles.schedBadge}>TODAY</div>
                                <span className={styles.schedTitle}>Technical Interview</span>
                                <span className={styles.schedMeta}>with Amazon Web Services</span>
                                <div className={styles.schedDetails}>
                                    <span>{IC.clock} 2:00 PM</span>
                                    <span>{IC.monitor} Google Meet</span>
                                </div>
                                <button className={styles.joinBtn}>Join Meeting</button>
                            </div>
                            <div className={styles.scheduleItem} style={{ borderLeftColor: '#94a3b8' }}>
                                <div className={styles.schedDateBlock}>
                                    <span className={styles.schedDay}>FRI</span>
                                    <span className={styles.schedNum}>24</span>
                                </div>
                                <span className={styles.schedTitle}>Cultural Fit Chat</span>
                                <span className={styles.schedMeta}>Netflix · 10:30 AM</span>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Quick Actions</h2>
                            {[
                                { icon: IC.file, label: 'Update Resume' },
                                { icon: IC.sliders, label: 'Edit Preferences' },
                                { icon: IC.award, label: 'Add Certifications' },
                            ].map((qa, i) => (
                                <button key={i} className={styles.quickAction}>
                                    <span className={styles.qaIcon}>{qa.icon}</span>
                                    <span className={styles.qaLabel}>{qa.label}</span>
                                    {IC.chevron}
                                </button>
                            ))}
                        </div>

                        {/* Featured Company */}
                        <div className={styles.featuredCard}>
                            <span className={styles.featuredLabel}>FEATURED COMPANY</span>
                            <span className={styles.featuredName}>Join the team at Airbnb</span>
                            <button className={styles.featuredLink}>View 15 open roles {IC.arrowRight}</button>
                        </div>
                    </div>
                </div>
            </AnimateOnScroll>
        </div>
    );
}
