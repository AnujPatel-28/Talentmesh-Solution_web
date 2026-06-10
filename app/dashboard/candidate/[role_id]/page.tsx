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
    chevron: <Icons.ChevronDown />,
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
    const { user: authUser, isLoading: authLoading } = useAuth();
    const [onboardingVerified, setOnboardingVerified] = useState(false);

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    useEffect(() => {
        // 0. Wait for session restoration
        if (authLoading) return;

        // 1. Auth Guard
        if (!authUser) {
            window.location.replace('/login');
            return;
        }

        const userId = authUser.id;

        // 1. Guard against uninitialized role_id
        if (!role_id || role_id === ':role_id' || role_id === 'undefined') return;

        // 2. Self-Correction: If URL has an invalid ID or doesn't match the logged-in user, redirect to actual user UUID
        if ((!isUUID(role_id) || role_id !== userId) && isUUID(userId)) {
            console.log('Redirecting to valid UUID dashboard path...');
            window.location.replace(`/dashboard/candidate/${userId}`);
            return;
        }

        // 3. Final safety: Don't query if still not a UUID
        if (!isUUID(role_id)) {
            return;
        }

        async function verifyOnboarding() {
            const accessState = await getCandidateAccessState(userId);

            if (!accessState.completedOnboarding) {
                window.location.replace('/onboarding/candidate');
                return;
            }
            setOnboardingVerified(true);
        }

        verifyOnboarding();
    }, [authLoading, authUser, role_id]);

    const { data: dash, isLoading: dashLoading } = useCandidateDashboardQuery(role_id, onboardingVerified);
    const { data: recommendedJobs = [], isLoading: recsLoading } = useRecommendationsQuery(role_id, onboardingVerified);

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

    const loading = authLoading || !onboardingVerified || dashLoading;
    const recommendationsLoading = authLoading || !onboardingVerified || recsLoading;

    if (loading) {
        return <HomeSkeleton />;
    }

    const userName = dbProfile?.name || authUser?.name || 'User';

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
                    <div className={`${styles.stat} ${styles.clickable}`} onClick={() => router.push(`/dashboard/candidate/${role_id}/applications`)}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Active Applications</span>
                            <span className={styles.statIconBox} style={{ background: '#eff6ff', color: 'var(--primary-blue)' }}>{IC.send}</span>
                        </div>
                        <span className={styles.statVal}>{appCount}</span>
                        <span className={styles.statChange}>{IC.trending} Real-time status</span>
                    </div>
                    <div className={`${styles.stat} ${styles.clickable}`} onClick={() => router.push(`/dashboard/candidate/${role_id}/profile`)}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Profile Strength</span>
                            <span className={styles.statIconBox} style={{ background: '#f0fdf4', color: '#10b981' }}>{IC.target}</span>
                        </div>
                        <span className={styles.statVal}>{profile?.profile_strength || 85}%</span>
                        <span className={styles.statHint}>Add {Math.max(0, 90 - (profile?.profile_strength || 85))}% more to reach 90%</span>
                    </div>
                    <div className={`${styles.stat} ${styles.clickable}`} onClick={() => router.push(`/dashboard/candidate/${role_id}/messages`)}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Upcoming Interviews</span>
                            <span className={styles.statIconBox} style={{ background: '#fef3c7', color: '#f59e0b' }}>{IC.cal}</span>
                        </div>
                        <span className={styles.statVal}>{interviewCount}</span>
                        <span className={styles.statHint}>
                            {nextInterview ? `Next: ${formatShortDate(nextInterview.scheduledAt)}, ${formatTime(nextInterview.scheduledAt)}` : 'No upcoming interviews'}
                        </span>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* Recommended for You Section */}
            <AnimateOnScroll animation="fadeUp" delay={150}>
                <ErrorBoundary fallbackText="Unable to load recommendations. Please refresh.">
                    <div className={styles.recommendedSection}>
                        <div className={styles.recommendedHeader}>
                            <div className={styles.recommendedTitleRow}>
                                <h3 className={styles.cardTitle}>Recommended for You</h3>
                                <div className={styles.auraBadge}>
                                    <span>✦</span>
                                    <span>Aura AI</span>
                                </div>
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
                                recommendedJobs.map((job) => (
                                    <div key={job.id} className={styles.recommendedCard}>
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
                                        
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {job.salary_max ? `₹${(job.salary_max/1000).toFixed(0)}k` : 'Salary Undisclosed'}
                                        </div>

                                        <div className={styles.recFooter}>
                                            <div className={styles.recMatch}>
                                                {job.match_score ? `${job.match_score}% Match` : 'New Match'}
                                            </div>
                                            <button 
                                                className={styles.recView}
                                                onClick={() => router.push(`/dashboard/candidate/${role_id}/jobs/${job.id}`)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                View Job
                                            </button>
                                        </div>
                                    </div>
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
                    </div>
                </ErrorBoundary>
            </AnimateOnScroll>

            {/* Main Grid */}
            <AnimateOnScroll animation="fadeUp" delay={200}>
                <div className={styles.mainGrid}>
                    <div className={styles.leftCol}>
                        {/* Top AI Matches */}
                        <ErrorBoundary fallbackText="Unable to load top matches. Please refresh.">
                            <div className={styles.card}>
                                <div className={styles.cardHead}>
                                    <h2 className={styles.cardTitle}>{IC.star} Top AI Matches</h2>
                                    <button className={styles.viewAll} onClick={() => router.push(`/dashboard/candidate/${role_id}/search`)}>View all matches</button>
                                </div>
                                {jobs.map((job: any, i: number) => (
                                    <div key={i} className={styles.jobCard}>
                                        <div className={styles.jobIcon}>{job.companies?.name?.[0] || 'J'}</div>
                                        <div className={styles.jobBody}>
                                            <div className={styles.jobRow}>
                                                <span className={styles.jobTitle}>{job.title}</span>
                                                <span className={styles.matchBadge}>{IC.check} {job.salary_max ? 'Top Tier' : 'High Match'}</span>
                                            </div>
                                            <span className={styles.jobMeta}>{job.companies?.name} · {job.location}</span>
                                            <div className={styles.jobTags}>
                                                <span className={styles.tag}>{job.type}</span>
                                                {job.salary_max && <span className={styles.tag}>₹{(job.salary_max/1000).toFixed(0)}k</span>}
                                            </div>
                                            <div className={styles.jobFoot}>
                                                <span className={styles.jobTime}>Featured matching</span>
                                                <button className={styles.viewJobBtn} onClick={() => router.push(`/dashboard/candidate/${role_id}/jobs/${job.id}`)}>View Job</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ErrorBoundary>
 
                        {/* Recent Activity */}
                        <ErrorBoundary fallbackText="Unable to load recent activity. Please refresh.">
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Recent Activity</h2>
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
                            </div>
                        </ErrorBoundary>
                    </div>

                    <div className={styles.rightCol}>
                        {/* Schedule */}
                        <ErrorBoundary fallbackText="Unable to load schedule. Please refresh.">
                            <div className={styles.card}>
                                <div className={styles.cardHead}>
                                    <h2 className={styles.cardTitle}>Schedule</h2>
                                    <button className={styles.moreBtn}>{IC.moreH}</button>
                                </div>
                                {nextInterview ? (
                                    <div className={styles.scheduleItem}>
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
                            </div>
                        </ErrorBoundary>

                        {/* Profile Strength Widget */}
                        <ErrorBoundary fallbackText="Unable to load profile card. Please refresh.">
                            <div style={{ marginBottom: '1.5rem' }}>
                                <ProfileStrengthWidget 
                                    variant="compact"
                                    candidate={{
                                        avatar_url: dbProfile?.avatar_url,
                                        resume_url: profile?.resume_url,
                                        bio: dbProfile?.bio,
                                        skills: profile?.skills,
                                        experience: profile?.work_history,
                                        education: profile?.education,
                                        location: dbProfile?.location
                                    }}
                                />
                            </div>
                        </ErrorBoundary>

                        {/* Quick Actions */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Quick Actions</h2>
                            {[
                                { icon: IC.file, label: 'Update Resume', route: `/dashboard/candidate/${role_id}/profile` },
                                { icon: IC.sliders, label: 'Edit Preferences', route: `/dashboard/candidate/${role_id}/settings` },
                                { icon: IC.award, label: 'Add Certifications', route: `/dashboard/candidate/${role_id}/profile` },
                            ].map((qa, i) => (
                                <button key={i} className={styles.quickAction} onClick={() => router.push(qa.route)}>
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
