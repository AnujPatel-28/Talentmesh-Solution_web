import React from 'react';
import Link from 'next/link';
import { getServerUser } from '@/lib/server-auth';
import styles from './dashboard.module.css';
import {
    getDashboardStats,
    getRecentApplications,
    getFunnelStats,
    getTopJobs,
    getLatestUsers,
    getActivityFeed
} from './_actions/stats';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({ params }: { params: { role_id: string } }) {
    const { role_id } = await params;
    // 1. Fetch all data in parallel
    const [
        stats,
        recentApps,
        funnel,
        topJobs,
        latestUsers,
        activity
    ] = await Promise.all([
        getDashboardStats().catch(() => null),
        getRecentApplications(),
        getFunnelStats(),
        getTopJobs(),
        getLatestUsers(),
        getActivityFeed()
    ]);

    if (!stats) return <div className={styles.error}>Error loading dashboard data. Please check connection.</div>;

    // 2. Identify Admin
    const user = await getServerUser();
    const adminName = user?.name || user?.email?.split('@')[0] || 'Admin';
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // 3. Prepare KPI Data
    const kpiCards = [
        { label: 'Total Candidates', value: stats.candidates.total, trend: `+${stats.candidates.trend} this week`, color: '#2563eb' },
        { label: 'Active Jobs', value: stats.jobs.total, trend: stats.jobs.pending > 0 ? `${stats.jobs.pending} pending` : 'All approved', color: '#10b981' },
        { label: 'Applications', value: stats.applications.total, trend: `+${stats.applications.trend} this week`, color: '#7c3aed' },
        { label: 'Pending Approvals', value: stats.pendingApprovals.total, trend: 'Urgent', color: '#f59e0b' },
    ];

    // 4. Funnel Logic
    const stages = [
        { id: 'applied', label: 'Applied' },
        { id: 'reviewing', label: 'Reviewing' },
        { id: 'shortlisted', label: 'Shortlisted' },
        { id: 'interview', label: 'Interview' },
        { id: 'offer', label: 'Offer' },
        { id: 'hired', label: 'Hired' }
    ];

    const getConversion = (idx: number) => {
        if (idx === 0 || !funnel) return null;
        const current = funnel[stages[idx].id] || 0;
        const prev = funnel[stages[idx - 1].id] || 0;
        if (prev === 0) return '0%';
        return Math.round((current / prev) * 100) + '%';
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>Good afternoon, {adminName}</h1>
                    <p>TalentMesh Intelligence Hub · {todayStr}</p>
                </div>
                <div className={styles.systemStatus}>
                    <span className={styles.statusDot}>●</span>
                    Live Platform Status
                </div>
            </header>

            {/* Urgent Actions Strip */}
            {stats.pendingApprovals.total > 0 && (
                <div className={styles.urgentStrip}>
                    <div className={styles.urgentContent}>
                        <div className={styles.urgentIcon}>⚡</div>
                        <div className={styles.urgentText}>
                            <strong>{stats.pendingApprovals.total} pending approvals require action</strong>
                            <p>{stats.pendingApprovals.recruiters} Recruiters and {stats.pendingApprovals.jobs} Jobs are waiting for verification.</p>
                        </div>
                    </div>
                    <div className={styles.urgentActions}>
                        <Link href={`/dashboard/admin/${role_id}/recruiters`} className={styles.urgentBtn}>Manage Recruiters</Link>
                        <Link href={`/dashboard/admin/${role_id}/jobs`} className={styles.urgentBtnPrimary}>Review Jobs</Link>
                    </div>
                </div>
            )}

            {/* KPI Grid */}
            <div className={styles.kpiGrid}>
                {kpiCards.map((kpi, i) => (
                    <div key={i} className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>{kpi.label}</span>
                        <div className={styles.kpiValueRow}>
                            <span className={styles.kpiValue}>{kpi.value}</span>
                            <span className={styles.kpiTrend} style={{ color: kpi.color }}>
                                {kpi.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hiring Funnel Section */}
            <section className={styles.widgetCard}>
                <div className={styles.sectionHeader}>
                    <h2>Real-time Hiring Funnel</h2>
                    <span className={styles.link}>Overall Conversion: {getConversion(5) || '0%'}</span>
                </div>
                <div className={styles.funnelGrid}>
                    {stages.map((stage, i) => (
                        <div key={stage.id} className={styles.funnelStage}>
                            <div className={styles.funnelBox}>
                                <span className={styles.funnelCount}>{funnel?.[stage.id] || 0}</span>
                                <span className={styles.funnelLabel}>{stage.label}</span>
                            </div>
                            {i > 0 && (
                                <div className={styles.conversionBadge}>
                                    ↓ {getConversion(i)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Main Content Grid */}
            <div className={styles.dashboardGrid}>
                {/* Left Column */}
                <div className={styles.leftCol}>
                    <section className={styles.activityFeed}>
                        <div className={styles.sectionHeader}>
                            <h2>Platform Activity Feed</h2>
                            <Link href={`/dashboard/admin/${role_id}/audit-logs`} className={styles.link}>Master Log</Link>
                        </div>
                        <div className={styles.feedCard}>
                            {activity.map((log: any) => {
                                const actor = Array.isArray(log.actor) ? log.actor[0] : log.actor;
                                return (
                                    <div key={log.id} className={styles.feedItem}>
                                        <div className={styles.userRow}>
                                            {actor?.avatar_url ? (
                                                <img src={actor.avatar_url} className={styles.userAvatar} alt="" />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    {actor?.name?.charAt(0) || 'S'}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.feedContent}>
                                            <p>
                                                <strong>{actor?.name || 'System'}</strong> {log.action}
                                            </p>
                                            <span>
                                                {log.table_name || 'System'} · {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className={styles.widgetCard} style={{ marginTop: '2rem' }}>
                        <div className={styles.sectionHeader}>
                            <h2>Recent Applications</h2>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.dashboardTable}>
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Job</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentApps.map((app: any) => {
                                        const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
                                        const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
                                        return (
                                            <tr key={app.id}>
                                                <td>{candidate?.name}</td>
                                                <td>{job?.title}</td>
                                                <td>
                                                    <span className={`${styles.statusPill} ${styles['status-' + app.status]}`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <div className={styles.rightCol}>
                    <section className={styles.widgetCard}>
                        <div className={styles.sectionHeader}>
                            <h2>Top Performing Jobs</h2>
                        </div>
                        <div className={styles.adminLogs}>
                            {topJobs.map((job: any) => (
                                <div key={job.id} className={styles.logItem}>
                                    <div className={styles.logDot} style={{ background: '#2563eb' }} />
                                    <div className={styles.logBody}>
                                        <p><strong>{job.title}</strong> at {job.company_name}</p>
                                        <span>{job.applications?.[0]?.count || 0} applications this month</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.widgetCard} style={{ marginTop: '2rem' }}>
                        <div className={styles.sectionHeader}>
                            <h2>Latest Registrations</h2>
                        </div>
                        <div className={styles.adminLogs}>
                            {[...latestUsers.candidates, ...latestUsers.recruiters]
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .slice(0, 8)
                                .map((u: any) => (
                                    <div key={u.id} className={styles.logItem}>
                                        <div className={styles.userRow}>
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} className={styles.userAvatar} alt="" />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    {u.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.logBody}>
                                            <p><strong>{u.name}</strong> joined as {u.role || 'candidate'}</p>
                                            <span>{new Date(u.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>

                    <section className={styles.widgetCard} style={{ marginTop: '2rem' }}>
                        <div className={styles.sectionHeader}>
                            <h2>Quick Actions</h2>
                        </div>
                        <div className={styles.quickActions}>
                            <Link href={`/dashboard/admin/${role_id}/recruiters`} className={styles.actionBtn}>
                                <span className={styles.actionIcon}>👥</span>
                                <span>Recruiters</span>
                            </Link>
                            <Link href={`/dashboard/admin/${role_id}/jobs`} className={styles.actionBtn}>
                                <span className={styles.actionIcon}>📋</span>
                                <span>All Jobs</span>
                            </Link>
                            <Link href={`/dashboard/admin/${role_id}/audit-logs`} className={styles.actionBtn}>
                                <span className={styles.actionIcon}>🔍</span>
                                <span>Audit logs</span>
                            </Link>
                            <Link href={`/dashboard/admin/${role_id}/settings`} className={styles.actionBtn}>
                                <span className={styles.actionIcon}>⚙️</span>
                                <span>Settings</span>
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
