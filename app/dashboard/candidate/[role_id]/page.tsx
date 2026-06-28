"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../shared-dashboard.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import ProfileStrengthWidget from '@/components/candidate/ProfileStrengthWidget';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatTime, formatShortDate } from '@/lib/utils/date-utils';
import { getCandidateAccessState } from '@/lib/auth/candidate-access';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';
import { useCandidateDashboardQuery } from '@/lib/queries/dashboard';
import { useRecommendationsQuery } from '@/lib/queries/recommendations';
import * as Icons from '@/components/ui/icons';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Toast from '@/components/ui/Toast';

function ProgressRing({ value, size = 42, strokeWidth = 4.5, color = '#10b981' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
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

/* ─── Inline SVG icons ─── */
const IC = {
    send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
    target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    cal: <Icons.Calendar />,
    star: <Icons.Star />,
    check: <Icons.Check />,
    eye: <Icons.Eye />,
    mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    clock: <Icons.Clock />,
    monitor: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    file: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    sliders: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /></svg>,
    award: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
    chevron: <Icons.ChevronRight className="chevronRight" />,
    arrowRight: <Icons.ArrowRight />,
    trending: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    moreH: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
};

export default function CandidateHome({ params }: { params: Promise<{ role_id: string }> }) {
    const { role_id } = React.use(params);
    return (
        <React.Suspense fallback={<HomeSkeleton />}>
            <CandidateHomeInner role_id={role_id} />
        </React.Suspense>
    );
}

function CandidateHomeInner({ role_id }: { role_id: string }) {
    const router = useRouter();
    const { user: authUser, isLoading: authLoading, refreshUser } = useAuth();
    const [onboardingVerified, setOnboardingVerified] = useState(false);

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    useEffect(() => {
        // 0. Wait for session restoration
        if (authLoading) return;

        // 1. Auth Guard
        if (!authUser) {
            router.replace('/login');
            return;
        }

        const userId = authUser.id;

        // 1. Guard against uninitialized role_id
        if (!role_id || role_id === ':role_id' || role_id === 'undefined') return;

        // 2. Self-Correction: If URL has an invalid ID or doesn't match the logged-in user, redirect to actual user UUID
        if ((!isUUID(role_id) || role_id !== userId) && isUUID(userId)) {
            console.log('Redirecting to valid UUID dashboard path...');
            router.replace(`/dashboard/candidate/${userId}`);
            return;
        }

        // 3. Final safety: Don't query if still not a UUID
        if (!isUUID(role_id)) {
            return;
        }

        async function verifyOnboarding() {
            const accessState = await getCandidateAccessState(userId);

            if (!accessState.completedOnboarding) {
                router.replace('/onboarding/candidate');
                return;
            }
            setOnboardingVerified(true);
        }

        verifyOnboarding();
    }, [authLoading, authUser, role_id, router]);

    useEffect(() => {
        if (onboardingVerified) {
            refreshUser().catch(console.error);
        }
    }, [onboardingVerified, refreshUser]);

    const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.get('onboarding_success') === 'true') {
                setToastMsg({ message: 'Onboarding completed successfully! Welcome to your dashboard.', type: 'success' });
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        }
    }, []);

    const { data: dash, isLoading: dashLoading, isFetching: dashFetching } = useCandidateDashboardQuery(role_id, onboardingVerified);
    const { data: recommendedJobs = [], isLoading: recsLoading, isFetching: recsFetching } = useRecommendationsQuery(role_id, onboardingVerified);

    const profile = dash?.candidateProfile;
    const dbProfile = dash?.profile;
    const jobs = dash?.jobs || [];
    const activity = dash?.activity || [];
    const appCount = dash?.appCount || 0;
    const interviewCount = dash?.interviews?.length || 0;
    const nextInterview = dash?.interviews && dash.interviews.length > 0 ? {
        ...dash.interviews[0],
        scheduledAt: dash.interviews[0].scheduled_at
    } : null;

    const loading = authLoading || !onboardingVerified || (dashLoading && !dash);
    const recommendationsLoading = authLoading || !onboardingVerified || (recsLoading && recommendedJobs.length === 0);

    if (loading) {
        return <HomeSkeleton />;
    }

    const userName = dbProfile?.name || authUser?.name || 'User';

    return (
        <motion.div 
            className={cn(styles.dash, styles.dashPremium)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Greeting */}
            <div className={styles.greet}>
                <h1 className={styles.greetTitle}>Welcome back, {userName}!</h1>
                <p className={styles.greetSub}>Here&apos;s what&apos;s happening with your job search today.</p>
            </div>

            {/* Stat Cards */}
            <AnimateOnScroll animation="fadeIn">
                <div className={styles.stats}>
                    <motion.div 
                        className={`${styles.statPremium} ${styles.glowBluePremium} ${styles.clickable}`} 
                        onClick={() => router.push(`/dashboard/candidate/${role_id}/applications`)}
                        whileHover={{ y: -6 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className={styles.statTopPremium}>
                            <span className={styles.statLabelPremium}>Active Applications</span>
                            <span className={styles.statIconBoxPremium} style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary-blue)' }}>{IC.send}</span>
                        </div>
                        <div>
                            <div className={styles.statValPremium}>{appCount}</div>
                            <span className={styles.statHintPremium}>{IC.trending} Real-time status</span>
                        </div>
                    </motion.div>

                    <motion.div 
                        className={`${styles.statPremium} ${styles.glowGreenPremium} ${styles.clickable}`} 
                        onClick={() => router.push(`/dashboard/candidate/${role_id}/profile`)}
                        whileHover={{ y: -6 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08 }}
                    >
                        <div className={styles.statTopPremium}>
                            <span className={styles.statLabelPremium}>Profile Strength</span>
                            <ProgressRing value={profile?.profile_strength ?? 0} size={42} strokeWidth={4.5} color="#10b981" />
                        </div>
                        <div>
                            <div className={styles.statValPremium}>{profile?.profile_strength ?? 0}%</div>
                            <span className={styles.statHintPremium}>Add {Math.max(0, 90 - (profile?.profile_strength ?? 0))}% to reach 90%</span>
                        </div>
                    </motion.div>

                    <motion.div 
                        className={`${styles.statPremium} ${styles.glowOrangePremium} ${styles.clickable}`} 
                        onClick={() => router.push(`/dashboard/candidate/${role_id}/messages`)}
                        whileHover={{ y: -6 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.16 }}
                    >
                        <div className={styles.statTopPremium}>
                            <span className={styles.statLabelPremium}>Upcoming Interviews</span>
                            <span className={styles.statIconBoxPremium} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{IC.cal}</span>
                        </div>
                        <div>
                            <div className={styles.statValPremium}>{interviewCount}</div>
                            <span className={styles.statHintPremium} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                                {nextInterview ? `Next: ${formatShortDate(nextInterview.scheduledAt)}, ${formatTime(nextInterview.scheduledAt)}` : 'No upcoming interviews'}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </AnimateOnScroll>

            {/* Recommended for You Section */}
            <AnimateOnScroll animation="fadeIn">
                <ErrorBoundary fallbackText="Unable to load recommendations. Please refresh.">
                    <motion.div 
                        className={styles.recommendedSectionPremium}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.24 }}
                    >
                        <div className={styles.recommendedHeader}>
                            <div className={styles.recommendedTitleRow}>
                                <h3 className={styles.cardTitlePremium}>{IC.star} Recommended for You</h3>
                                {recsFetching && (
                                    <span className={styles.subtleLoader} title="Syncing fresh recommendations...">
                                        <span className={styles.spinnerDot} />
                                        Syncing
                                    </span>
                                )}
                            </div>
                            <button 
                                className={styles.viewAll} 
                                onClick={() => router.push(`/dashboard/candidate/${role_id}/search`)}
                            >
                                View All
                            </button>
                        </div>

                        <div className={styles.recommendedScroll}>
                            {recommendationsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className={styles.skeletonCard} />
                                ))
                            ) : recommendedJobs.length > 0 ? (
                                recommendedJobs.map((job, idx) => (
                                    <motion.div 
                                        key={job.id} 
                                        className={styles.recommendedCardPremium}
                                        whileHover={{ y: -6 }}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
                                    >
                                        <div className={styles.recCardTop}>
                                            <div className={styles.recLogo}>
                                                {job.companies?.logo_url ? (
                                                    <img src={getPublicStorageUrl('company-logos', job.companies.logo_url)} alt={job.companies.name} style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                                                ) : (
                                                    <span>{job.companies?.name?.[0] || 'J'}</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 className={styles.recTitle}>{job.title}</h4>
                                                <div className={styles.recMeta}>{job.companies?.name} • {job.location}</div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, margin: '6px 0' }}>
                                            {job.salary_max ? `₹${(job.salary_max/100000).toFixed(1)}L PA` : 'Salary Undisclosed'}
                                        </div>

                                        <div className={styles.recFooter}>
                                            <div className={styles.recMatch} style={{ color: '#10b981', background: '#f0fdf4', padding: '2px 8px', borderRadius: '100px', fontSize: '0.68rem', fontWeight: 700 }}>
                                                {job.match_score ? `${job.match_score}% Match` : 'New Match'}
                                            </div>
                                            <button 
                                                className={styles.recView}
                                                onClick={() => router.push(`/dashboard/candidate/${role_id}/jobs/${job.id}`)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-blue)' }}
                                            >
                                                View Job
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className={styles.recommendedEmpty} style={{ width: '100%' }}>
                                    <p className={styles.emptyText}>Discover jobs matching your specific skills</p>
                                    <button 
                                        className={styles.viewJobBtn}
                                        onClick={() => router.push(`/dashboard/candidate/${role_id}/search`)}
                                    >
                                        Browse All Jobs
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </ErrorBoundary>
            </AnimateOnScroll>

            {/* Main Grid */}
            <AnimateOnScroll animation="fadeIn">
                <div className={styles.mainGrid}>
                    <div className={styles.leftCol}>
                        {/* Top AI Matches */}
                        <ErrorBoundary fallbackText="Unable to load top matches. Please refresh.">
                            <motion.div 
                                className={styles.cardPremium}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <div className={styles.cardHead}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h2 className={styles.cardTitlePremium}>{IC.star} Top AI Matches</h2>
                                        {dashFetching && (
                                            <span className={styles.subtleLoader} title="Syncing fresh dashboard data...">
                                                <span className={styles.spinnerDot} />
                                                Syncing
                                            </span>
                                        )}
                                    </div>
                                    <button className={styles.viewAll} onClick={() => router.push(`/dashboard/candidate/${role_id}/search`)}>View all matches</button>
                                </div>
                                {jobs.map((job: any, i: number) => (
                                    <motion.div 
                                        key={i} 
                                        className={styles.jobCard}
                                        whileHover={{ x: 6, backgroundColor: 'rgba(59,130,246,0.02)', borderColor: 'rgba(59,130,246,0.15)' }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className={styles.jobIcon} style={{ background: '#f8fafc', color: 'var(--primary-blue)', border: '1px solid #f1f5f9' }}>{job.companies?.name?.[0] || 'J'}</div>
                                        <div className={styles.jobBody}>
                                            <div className={styles.jobRow}>
                                                <span className={styles.jobTitle}>{job.title}</span>
                                                <span className={styles.matchBadge}>{IC.check} {job.salary_max ? 'Top Tier' : 'High Match'}</span>
                                            </div>
                                            <span className={styles.jobMeta}>{job.companies?.name} · {job.location}</span>
                                            <div className={styles.jobTags}>
                                                <span className={cn(styles.tag, styles.tagNeutral, styles.tagSmall)}>{job.type}</span>
                                                {job.salary_max && <span className={cn(styles.tag, styles.tagSuccess, styles.tagSmall)}>₹{(job.salary_max/100000).toFixed(1)}L PA</span>}
                                            </div>
                                            <div className={styles.jobFoot}>
                                                <span className={styles.jobTime}>Featured matching</span>
                                                <button className={styles.viewJobBtn} onClick={() => router.push(`/dashboard/candidate/${role_id}/jobs/${job.id}`)}>View Job</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </ErrorBoundary>
 
                        {/* Recent Activity */}
                        <ErrorBoundary fallbackText="Unable to load recent activity. Please refresh.">
                            <motion.div 
                                className={styles.cardPremium}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.45 }}
                            >
                                <h2 className={styles.cardTitlePremium}>Recent Activity</h2>
                                {activity.map((act: any, i: number) => (
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
                            </motion.div>
                        </ErrorBoundary>
                    </div>

                    <div className={styles.rightCol}>
                        {/* Schedule */}
                        <ErrorBoundary fallbackText="Unable to load schedule. Please refresh.">
                            <motion.div 
                                className={styles.cardPremium}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.42 }}
                            >
                                <div className={styles.cardHead}>
                                    <h2 className={styles.cardTitlePremium}>Schedule</h2>
                                    <button className={styles.moreBtn}>{IC.moreH}</button>
                                </div>
                                {nextInterview ? (
                                    <div className={styles.scheduleItem} style={{ borderLeft: '4px solid var(--primary-blue)' }}>
                                        <div className={styles.schedBadge}>{new Date(nextInterview.scheduledAt) > new Date() ? 'UPCOMING' : 'TODAY'}</div>
                                        <span className={styles.schedTitle}>{nextInterview.type.toUpperCase()} INTERVIEW</span>
                                        <span className={styles.schedMeta}>
                                            {nextInterview.applications?.jobs?.companies?.name || 'Company'} · {nextInterview.applications?.jobs?.title || 'Role'}
                                        </span>
                                        <div className={styles.schedDetails}>
                                            <span>{IC.clock} {formatTime(nextInterview.scheduledAt)}</span>
                                            <span>{IC.monitor} Online Join</span>
                                        </div>
                                        {nextInterview.meeting_link && (
                                            <a href={nextInterview.meeting_link} target="_blank" rel="noopener noreferrer" className={styles.joinBtn}>
                                                Join Meeting
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>
                                        <p>No interviews scheduled</p>
                                    </div>
                                )}
                            </motion.div>
                        </ErrorBoundary>

                        {/* Profile Strength Widget */}
                        <ErrorBoundary fallbackText="Unable to load profile card. Please refresh.">
                            <motion.div 
                                style={{ marginBottom: '1.5rem' }}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.46 }}
                            >
                                <ProfileStrengthWidget 
                                    variant="compact"
                                    candidate={{
                                        avatar_url: dbProfile?.avatar_url,
                                        resume_url: profile?.resume_url,
                                        bio: dbProfile?.bio,
                                        skills: profile?.skills,
                                        experience: profile?.work_history,
                                        education: profile?.education,
                                        location: dbProfile?.location,
                                        linkedin_url: profile?.linkedin_url,
                                        profile_strength: profile?.profile_strength
                                    }}
                                />
                            </motion.div>
                        </ErrorBoundary>

                        {/* Quick Actions */}
                        <motion.div 
                            className={styles.cardPremium}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <h2 className={styles.cardTitlePremium}>Quick Actions</h2>
                            <div className={styles.quickActionsContainer}>
                                {[
                                    { icon: IC.file, label: 'Update Resume', route: `/dashboard/candidate/${role_id}/profile` },
                                    { icon: IC.sliders, label: 'Edit Preferences', route: `/dashboard/candidate/${role_id}/settings` },
                                    { icon: IC.award, label: 'Add Certifications', route: `/dashboard/candidate/${role_id}/profile` },
                                ].map((qa, i) => (
                                    <button 
                                        key={i} 
                                        className={styles.quickAction} 
                                        onClick={() => router.push(qa.route)}
                                    >
                                        <span className={styles.qaIcon}>{qa.icon}</span>
                                        <span className={styles.qaLabel}>{qa.label}</span>
                                        {IC.chevron}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Featured Company */}
                        <motion.div 
                            className={styles.featuredCard}
                            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px' }}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.54 }}
                            whileHover={{ y: -4 }}
                        >
                            <span className={styles.featuredLabel}>FEATURED COMPANY</span>
                            <span className={styles.featuredName}>Join the team at Airbnb</span>
                            <button className={styles.featuredLink}>View 15 open roles {IC.arrowRight}</button>
                        </motion.div>
                    </div>
                </div>
            </AnimateOnScroll>
            {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
        </motion.div>
    );
}
