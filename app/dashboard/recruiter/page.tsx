"use client";
import React, { useEffect, useState } from 'react';
import styles from './recruiter.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { insforge } from '@/lib/insforge';

/* ─── Icons ─── */
const IC = {
    clipboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>,
    users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    checkCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    trending: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    alertCircle: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    barChart: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
};

export default function RecruiterHome() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [interviews, setInterviews] = useState<any[]>([]);
    const [stats, setStats] = useState({ open: 0, applicants: 0, interviews: 0, hires: 15 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Jobs
                const { data: jobData } = await insforge.database
                    .from('job')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                const openJobs = jobData || [];
                setJobs(openJobs);

                // Fetch Candidates (mocking top matches)
                const { data: candData } = await insforge.database
                    .from('candidateprofile')
                    .select('*')
                    .order('ai_karma', { ascending: false })
                    .limit(3);
                setCandidates(candData || []);

                // Fetch Today's Interviews
                const { data: intData } = await insforge.database
                    .from('interview')
                    .select('*')
                    .limit(2);
                setInterviews(intData || []);

                // Calculate Stats
                const totalApplicants = openJobs.reduce((acc, j) => acc + (j.applicants || 0), 0);
                setStats({
                    open: openJobs.length,
                    applicants: totalApplicants,
                    interviews: 6, // Hardcoded for now
                    hires: 15
                });

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <div className={styles.dash}><p style={{ color: 'white', padding: '2rem' }}>Loading Dashboard...</p></div>;

    return (
        <div className={styles.dash}>
            <div className={styles.greet}>
                <h1 className={styles.greetTitle}>Welcome back, Harper!</h1>
                <p className={styles.greetSub}>Here&apos;s your hiring pipeline overview.</p>
            </div>

            <AnimateOnScroll animation="fadeUp" delay={100}>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Open Positions</span>
                            <span className={styles.statBox} style={{ background: '#eff6ff', color: 'var(--primary-blue)' }}>{IC.clipboard}</span>
                        </div>
                        <span className={styles.statVal}>{stats.open}</span>
                        <span className={styles.statHint}>3 urgent roles</span>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Total Applicants</span>
                            <span className={styles.statBox} style={{ background: '#f0fdf4', color: '#10b981' }}>{IC.users}</span>
                        </div>
                        <span className={styles.statVal}>{stats.applicants}</span>
                        <span className={styles.statChange}>{IC.trending} +18 this week</span>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Interviews This Week</span>
                            <span className={styles.statBox} style={{ background: '#fef3c7', color: '#f59e0b' }}>{IC.calendar}</span>
                        </div>
                        <span className={styles.statVal}>{stats.interviews}</span>
                        <span className={styles.statHint}>Next: Today, 3:00 PM</span>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Hires This Quarter</span>
                            <span className={styles.statBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}>{IC.checkCircle}</span>
                        </div>
                        <span className={styles.statVal}>{stats.hires}</span>
                        <span className={styles.statHint}>Target: 20</span>
                    </div>
                </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeUp" delay={200}>

                <div className={styles.mainGrid}>
                    <div className={styles.leftCol}>
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitle}>Active Positions</h2>
                                <button className={styles.viewAll}>View all</button>
                            </div>
                            {jobs.map((j, i) => (
                                <div key={i} className={styles.posCard}>
                                    <div className={styles.posBody}>
                                        <div className={styles.posRow}>
                                            <span className={styles.posTitle}>{j.title}</span>
                                            {j.applicants > 50 && <span className={styles.urgentTag}>{IC.alertCircle} Hot</span>}
                                        </div>
                                        <span className={styles.posMeta}>{j.applicants} applicants · {j.new_applicants} new</span>
                                    </div>
                                    <span className={styles.posStatus}>{j.status}</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Hiring Pipeline</h2>
                            <div className={styles.pipelineBar}>
                                {[
                                    { label: 'Screening', count: 48, width: '35%', color: '#3b82f6' },
                                    { label: 'Interview', count: 22, width: '25%', color: '#7c3aed' },
                                    { label: 'Assessment', count: 14, width: '20%', color: '#f59e0b' },
                                    { label: 'Offer', count: 8, width: '20%', color: '#10b981' },
                                ].map((s, i) => (
                                    <div key={i} className={styles.pipeSegment}>
                                        <div className={styles.pipeBar} style={{ width: s.width, background: s.color }} />
                                        <div className={styles.pipeMeta}>
                                            <span className={styles.pipeLabel}>{s.label}</span>
                                            <span className={styles.pipeCount}>{s.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.rightCol}>
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitle}>Top Candidates</h2>
                                <button className={styles.viewAll}>View all</button>
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className={styles.candCard}>
                                    <div className={styles.candAvatar}>{c.name.split(' ').map((n: string) => n[0]).join('')}</div>
                                    <div className={styles.candBody}>
                                        <span className={styles.candName}>{c.name}</span>
                                        <span className={styles.candMeta}>{c.role} · {c.skills?.slice(0, 2).join(', ')}</span>
                                    </div>
                                    <span className={styles.candMatch}>{Math.min(100, (c.ai_karma / 5) || 90).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Today&apos;s Interviews</h2>
                            {interviews.length > 0 ? interviews.map((intr, i) => (
                                <div key={i} className={styles.intCard}>
                                    <div className={styles.intTime}>{intr.time}</div>
                                    <div className={styles.intBody}>
                                        <span className={styles.intName}>{intr.role}</span>
                                        <span className={styles.intType}>{intr.type} Round</span>
                                    </div>
                                    <button className={styles.intBtn}>Join</button>
                                </div>
                            )) : (
                                <p className={styles.emptyText}>No interviews scheduled for today.</p>
                            )}
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Quick Actions</h2>
                            <button className={styles.primaryAction}>{IC.plus} Post a New Job</button>
                            <button className={styles.secondaryAction}>{IC.barChart} View Reports</button>
                            <button className={styles.secondaryAction}>{IC.users} Browse Candidates</button>
                        </div>
                    </div>
                </div>
            </AnimateOnScroll>
        </div>
    );
}
