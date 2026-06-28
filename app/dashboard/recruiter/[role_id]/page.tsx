"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../../shared-dashboard.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
import { invokeFunction, insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatTime, formatShortDate } from '@/lib/utils/date-utils';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function ProgressRing({ value, size = 42, strokeWidth = 4.5, color = '#7c3aed' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className={styles.progressRingContainer} style={{ width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="rgba(15, 23, 42, 0.06)"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    strokeLinecap="round"
                />
            </svg>
            <span className={styles.progressRingText} style={{ color, fontSize: '0.68rem' }}>{value}%</span>
        </div>
    );
}

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
    arrowRight: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
};

export default function RecruiterHome({ params }: { params: Promise<{ role_id: string }> }) {
    const { role_id } = React.use(params) || {};
    const { user: authUser, isLoading: authLoading } = useAuth();
    const fetching = useRef(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [interviews, setInterviews] = useState<any[]>([]);
    const [stats, setStats] = useState({ open: 0, applicants: 0, interviews: 0, hires: 15 });
    const [pipeline, setPipeline] = useState<any[]>([]);
    const [recommendationsDisabled, setRecommendationsDisabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!authUser) return;

        async function fetchData() {
            if (!authUser?.id) return;
            if (fetching.current) return;
            fetching.current = true;
            try {
                const [dashRes, interviewsRes] = await Promise.all([
                    invokeFunction('recruiter-dashboard'),
                    insforge.database
                        .from('interviews')
                        .select('*, job:jobs(id, title), candidate:profiles!candidate_id(id, full_name:name, email, avatar_url)')
                        .eq('recruiter_id', authUser.id)
                        .eq('status', 'scheduled')
                        .order('scheduled_at', { ascending: true })
                ]);
                
                if (dashRes.error) {
                    console.error('Dashboard fetch error:', dashRes.error.message);
                }

                const dash = dashRes.data;
                if (dash) {
                    setJobs(dash.recentJobs || []);
                    setCandidates(dash.topCandidates || []);
                    setRecommendationsDisabled(dash.recommendations_disabled || false);
                    setStats({
                        open: dash.stats.openJobs || 0,
                        applicants: dash.stats.totalApplicants || 0,
                        interviews: dash.stats.interviewsThisWeek || 0,
                        hires: dash.stats.hires || 0
                    });
                    setPipeline(dash.pipeline || []);
                }

                if (!interviewsRes.error && interviewsRes.data) {
                    const mappedInterviews = (interviewsRes.data as any[]).map(iv => ({
                        id: iv.id,
                        scheduledAt: iv.scheduled_at,
                        role: `${iv.candidate?.full_name || 'Candidate'} — ${iv.job?.title || 'Position'}`,
                        type: iv.type.charAt(0).toUpperCase() + iv.type.slice(1),
                        meetingLink: iv.meeting_link
                    }));
                    setInterviews(mappedInterviews);

                    const now = new Date();
                    const startWeek = new Date(now); startWeek.setDate(now.getDate() - now.getDay());
                    const endWeek = new Date(startWeek); endWeek.setDate(startWeek.getDate() + 7);
                    const weekCount = (interviewsRes.data as any[]).filter(iv => {
                        const d = new Date(iv.scheduled_at);
                        return d >= startWeek && d < endWeek;
                    }).length;

                    setStats(prev => ({
                        ...prev,
                        interviews: weekCount
                    }));
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
                fetching.current = false;
            }
        }
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [authLoading, authUser?.id]);

    if (authLoading || loading) {
        return <HomeSkeleton />;
    }

    const pipelineData = pipeline.length > 0 ? pipeline : [
        { label: 'Applied', count: 0, color: '#3b82f6' },
        { label: 'Reviewing', count: 0, color: '#6366f1' },
        { label: 'Shortlisted', count: 0, color: '#7c3aed' },
        { label: 'Interviewing', count: 0, color: '#f59e0b' },
        { label: 'Offered', count: 0, color: '#10b981' },
    ];

    const maxPipeCount = Math.max(...pipelineData.map((s: any) => s.count), 1);

    const hiresPercent = Math.min(Math.round((stats.hires / 20) * 100), 100);

    return (
        <div className={cn(styles.dash, styles.dashPremium)}>
            {/* ── Welcome Banner ── */}
            <div className={styles.greet}>
                <h1 className={styles.greetTitle}>Welcome back, {authUser?.name || 'Recruiter'}!</h1>
                <p className={styles.greetSub}>Here&apos;s your hiring pipeline overview for today.</p>
            </div>

            {/* ── Stat Cards ── */}
            <AnimateOnScroll animation="fadeIn">
                <div className={styles.stats}>
                    <motion.div 
                        className={`${styles.statPremium} ${styles.glowBluePremium}`}
                        whileHover={{ y: -6 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className={styles.statTopPremium}>
                            <span className={styles.statLabelPremium}>Open Positions</span>
                            <span className={styles.statIconBoxPremium} style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary-blue)' }}>{IC.clipboard}</span>
                        </div>
                        <div>
                            <div className={styles.statValPremium}>{stats.open}</div>
                            <span className={styles.statHintPremium}>
                                {stats.open > 3 ? `${Math.min(stats.open, 3)} urgent roles` : 'All roles on track'}
                            </span>
                        </div>
                    </motion.div>

                    <motion.div 
                        className={`${styles.statPremium} ${styles.glowGreenPremium}`}
                        whileHover={{ y: -6 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08 }}
                    >
                        <div className={styles.statTopPremium}>
                            <span className={styles.statLabelPremium}>Total Applicants</span>
                            <span className={styles.statIconBoxPremium} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{IC.users}</span>
                        </div>
                        <div>
                            <div className={styles.statValPremium}>{stats.applicants}</div>
                            <span className={styles.statHintPremium}>{IC.trending} +18 this week</span>
                        </div>
                    </motion.div>

                    <motion.div 
                        className={`${styles.statPremium} ${styles.glowOrangePremium}`}
                        whileHover={{ y: -6 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.16 }}
                    >
                        <div className={styles.statTopPremium}>
                            <span className={styles.statLabelPremium}>Interviews This Week</span>
                            <span className={styles.statIconBoxPremium} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{IC.calendar}</span>
                        </div>
                        <div>
                            <div className={styles.statValPremium}>{stats.interviews}</div>
                            <span className={styles.statHintPremium} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                                {interviews[0] ? `Next: ${formatShortDate(interviews[0].scheduledAt)}` : 'No upcoming interviews'}
                            </span>
                        </div>
                    </motion.div>

                    <motion.div 
                        className={`${styles.statPremium} ${styles.glowPurplePremium}`}
                        whileHover={{ y: -6 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.24 }}
                    >
                        <div className={styles.statTopPremium}>
                            <span className={styles.statLabelPremium}>Hires This Quarter</span>
                            <ProgressRing value={hiresPercent} size={42} strokeWidth={4.5} color="#7c3aed" />
                        </div>
                        <div>
                            <div className={styles.statValPremium}>{stats.hires}</div>
                            <span className={styles.statHintPremium}>Target: 20 hires</span>
                        </div>
                    </motion.div>
                </div>
            </AnimateOnScroll>

            {/* ── Main Content Grid (Golden Ratio: 61.8% / 38.2%) ── */}
            <AnimateOnScroll animation="fadeIn">
                <div className={styles.mainGrid}>
                    {/* Left Column — 61.8% */}
                    <div className={styles.leftCol}>
                        {/* Active Positions */}
                        <motion.div 
                            className={styles.cardPremium}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitlePremium}>Active Positions</h2>
                                <Link href={`/dashboard/recruiter/${role_id}/jobs`} className={styles.viewAll}>
                                    View all {IC.arrowRight}
                                </Link>
                            </div>
                            {jobs.length > 0 ? jobs.map((j, i) => (
                                <motion.div 
                                    key={i} 
                                    className={styles.posCard}
                                    whileHover={{ x: 6, backgroundColor: 'rgba(59,130,246,0.02)' }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className={styles.posBody}>
                                        <div className={styles.posRow}>
                                            <span className={styles.posTitle}>{j.title}</span>
                                            {j.applicants > 50 && <span className={styles.urgentTag}>{IC.alertCircle} Hot</span>}
                                        </div>
                                        <span className={styles.posMeta}>{j.applicants} applicants · {j.new_applicants} new this week</span>
                                    </div>
                                    <span className={styles.posStatus} style={{ textTransform: 'capitalize', fontWeight: 700, color: j.status === 'active' ? '#10b981' : '#64748b' }}>{j.status}</span>
                                </motion.div>
                            )) : (
                                <p className={styles.emptyText}>No active positions yet. Post your first job to get started!</p>
                            )}
                        </motion.div>

                        {/* Hiring Pipeline */}
                        <motion.div 
                            className={styles.cardPremium}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.36 }}
                        >
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitlePremium}>Hiring Pipeline</h2>
                                <Link href={`/dashboard/recruiter/${role_id}/pipeline`} className={styles.viewAll}>
                                    Full view {IC.arrowRight}
                                </Link>
                            </div>
                            <div className={styles.pipelineBar}>
                                {pipelineData.map((s: any, i: number) => (
                                    <div key={i} className={styles.pipeSegment}>
                                        <div
                                            className={styles.pipeBar}
                                            style={{
                                                width: s.count > 0 ? `${Math.max((s.count / maxPipeCount) * 100, 8)}%` : '5%',
                                                background: s.color,
                                                borderRadius: '100px'
                                            }}
                                        />
                                        <div className={styles.pipeMeta}>
                                            <span className={styles.pipeLabel}>{s.label}</span>
                                            <span className={styles.pipeCount}>{s.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column — 38.2% */}
                    <div className={styles.rightCol}>
                        {/* Top Candidates */}
                        <motion.div 
                            className={styles.cardPremium}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.33 }}
                        >
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitlePremium}>Top Candidates</h2>
                                <Link href={`/dashboard/recruiter/${role_id}/candidates`} className={styles.viewAll}>
                                    View all {IC.arrowRight}
                                </Link>
                            </div>
                            {recommendationsDisabled ? (
                                <p className={styles.emptyText} style={{ opacity: 0.8 }}>
                                    Candidate matching is temporarily disabled during Candidate & Admin launch.
                                </p>
                            ) : candidates.length > 0 ? candidates.map((c, i) => (
                                <motion.div 
                                    key={i} 
                                    className={styles.candCard}
                                    whileHover={{ x: 4, backgroundColor: 'rgba(124,58,237,0.02)' }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className={styles.candAvatar} style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 800 }}>{c.name.split(' ').map((n: string) => n[0]).join('')}</div>
                                    <div className={styles.candBody}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span className={styles.candName}>{c.name}</span>
                                            {c.category && (
                                                <span className={styles.candCategoryBadge} data-category={c.category.toLowerCase()}>
                                                    {c.category}
                                                </span>
                                            )}
                                        </div>
                                        <span className={styles.candMeta}>{c.role} · {c.skills?.slice(0, 2).join(', ')}</span>
                                    </div>
                                    <span className={styles.candMatch} style={{ color: '#7c3aed', fontWeight: 800 }}>{c.match}%</span>
                                </motion.div>
                            )) : (
                                <p className={styles.emptyText}>No candidate matches yet.</p>
                            )}
                        </motion.div>

                        {/* Today's Interviews */}
                        <motion.div 
                            className={styles.cardPremium}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.39 }}
                        >
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitlePremium}>Today&apos;s Interviews</h2>
                                <Link href={`/dashboard/recruiter/${role_id}/interviews`} className={styles.viewAll}>
                                    Schedule {IC.arrowRight}
                                </Link>
                            </div>
                            {(() => {
                                const todayStr = new Date().toDateString();
                                const todayInterviews = interviews.filter(intr => new Date(intr.scheduledAt).toDateString() === todayStr);
                                return todayInterviews.length > 0 ? todayInterviews.map((intr, i) => (
                                    <motion.div 
                                        key={i} 
                                        className={styles.intCard}
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className={styles.intTime}>{formatTime(intr.scheduledAt)}</div>
                                        <div className={styles.intBody}>
                                            <span className={styles.intName}>{intr.role}</span>
                                            <span className={styles.intType}>{intr.type} Round</span>
                                        </div>
                                        {intr.meetingLink ? (
                                            <a href={intr.meetingLink} target="_blank" rel="noopener noreferrer" className={styles.intBtn} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                Join
                                            </a>
                                        ) : (
                                            <Link href={`/dashboard/recruiter/${role_id}/interviews/${intr.id}`} className={styles.intBtn} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                Details
                                            </Link>
                                        )}
                                    </motion.div>
                                )) : (
                                    <p className={styles.emptyText}>No interviews scheduled for today.</p>
                                );
                            })()}
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div 
                            className={styles.cardPremium}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.42 }}
                        >
                            <h2 className={styles.cardTitlePremium}>Quick Actions</h2>
                            <Link href={`/dashboard/recruiter/${role_id}/jobs/post-job`} style={{ textDecoration: 'none' }}>
                                <motion.button 
                                    className={styles.primaryAction}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {IC.plus} Post a New Job
                                </motion.button>
                            </Link>
                            <Link href={`/dashboard/recruiter/${role_id}/reports`} style={{ textDecoration: 'none' }}>
                                <motion.button 
                                    className={styles.secondaryAction}
                                    style={{ marginTop: '8px' }}
                                    whileHover={{ x: 4 }}
                                >
                                    {IC.barChart} View Reports
                                </motion.button>
                            </Link>
                            <Link href={`/dashboard/recruiter/${role_id}/candidates`} style={{ textDecoration: 'none' }}>
                                <motion.button 
                                    className={styles.secondaryAction}
                                    style={{ marginTop: '8px' }}
                                    whileHover={{ x: 4 }}
                                >
                                    {IC.users} Browse Candidates
                                </motion.button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </AnimateOnScroll>
        </div>
    );
}
