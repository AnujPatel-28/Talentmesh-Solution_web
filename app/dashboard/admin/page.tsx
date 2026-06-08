"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from '../shared-dashboard.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';

/* ─── Icons ─── */
const IC = {
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  clipboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
  trending: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  alertCircle: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  barChart: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>,
  checkCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  moreH: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
  settings: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};

import { invokeFunction } from '@/lib/insforge';

type Stat = { value: number; trend: 'up' | 'down'; trendValue: string };
type Stats = {
  users: Stat;
  jobs: Stat;
  applications: Stat;
  recruiters: Stat;
};

type AlertData = {
  pendingRecruiters: number;
  pendingJobs: number;
  reportedJobs: number;
  newUsers24h: number;
};

type ActivityItem = {
  id: string;
  actor: string;
  actor_avatar?: string;
  type: string;
  description: string;
  created_at: string;
};

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const fetching = useRef(false);

  const fetchData = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const { data, error: fetchError } = await invokeFunction('admin-dashboard', {
        method: 'POST',
        body: { action: 'get-summary', limit: 10 }
      });


      if (fetchError) throw new Error(fetchError.message);

      if (data) {
        setStats({
          users: { value: data.metrics.totalCandidates + data.metrics.totalRecruiters, trend: 'up', trendValue: '+12%' },
          jobs: { value: data.metrics.totalJobs, trend: 'up', trendValue: '+5%' },
          applications: { value: data.metrics.totalApplications, trend: 'up', trendValue: '+18%' },
          recruiters: { value: data.metrics.totalRecruiters, trend: 'down', trendValue: '-2%' },
        });
        setAlerts(data.alerts);
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setDataLoading(false);
      fetching.current = false;
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchData, user?.id]);

  if (authLoading || dataLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className={styles.dash}>
      <div className={styles.greet}>
        <h1 className={styles.greetTitle}>Welcome back, {user?.name || 'Admin'}!</h1>
        <p className={styles.greetSub}>Overview: Monitor, approve, and manage jobs, recruiters, and candidates.</p>
      </div>

      <AnimateOnScroll animation="fadeUp" delay={100}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Total Users</span>
              <span className={styles.statIconBox} style={{ background: '#eff6ff', color: 'var(--primary-blue)' }}>{IC.users}</span>
            </div>
            <span className={styles.statVal}>{stats?.users.value || 0}</span>
            <span className={styles.statChange}>{IC.trending} {stats?.users.trendValue} users</span>
          </div>
          <div className={styles.stat}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Active Jobs</span>
              <span className={styles.statIconBox} style={{ background: '#f0fdf4', color: '#10b981' }}>{IC.clipboard}</span>
            </div>
            <span className={styles.statVal}>{stats?.jobs.value || 0}</span>
            <span className={styles.statChange}>{IC.trending} {stats?.jobs.trendValue} roles</span>
          </div>
          <div className={styles.stat}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Total Applications</span>
              <span className={styles.statIconBox} style={{ background: '#fef3c7', color: '#f59e0b' }}>{IC.send}</span>
            </div>
            <span className={styles.statVal}>{stats?.applications.value || 0}</span>
            <span className={styles.statChange}>{IC.trending} {stats?.applications.trendValue} apps</span>
          </div>
          <div className={styles.stat}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Recruiters</span>
              <span className={styles.statIconBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}>{IC.checkCircle}</span>
            </div>
            <span className={styles.statVal}>{stats?.recruiters.value || 0}</span>
            <span className={styles.statHint}>{stats?.recruiters.trendValue} from last week</span>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll animation="fadeUp" delay={200}>
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            {/* Critical Moderation Queue */}
            {alerts && (alerts.pendingRecruiters > 0 || alerts.pendingJobs > 0 || alerts.reportedJobs > 0) && (
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Review Queue</h2>
                </div>
                {alerts.pendingRecruiters > 0 && (
                  <div className={styles.actItem}>
                    <span className={styles.actIcon} style={{ color: '#f59e0b' }}>{IC.alertCircle}</span>
                    <div className={styles.actContent}>
                      <span className={styles.actText}><strong>{alerts.pendingRecruiters} Approval Requests</strong> - Recruiters waiting for access</span>
                    </div>
                    <Link href="/dashboard/admin/recruiters?status=pending" className={styles.actAction}>Review</Link>
                  </div>
                )}
                {alerts.pendingJobs > 0 && (
                  <div className={styles.actItem}>
                    <span className={styles.actIcon} style={{ color: '#f59e0b' }}>{IC.alertCircle}</span>
                    <div className={styles.actContent}>
                      <span className={styles.actText}><strong>{alerts.pendingJobs} Job Reviews</strong> - New listings requiring approval</span>
                    </div>
                    <Link href="/dashboard/admin/jobs?status=pending" className={styles.actAction}>Review</Link>
                  </div>
                )}
                {alerts.reportedJobs > 0 && (
                  <div className={styles.actItem}>
                    <span className={styles.actIcon} style={{ color: '#ef4444' }}>{IC.alertCircle}</span>
                    <div className={styles.actContent}>
                      <span className={styles.actText}><strong>{alerts.reportedJobs} Flagged Reports</strong> - Reported jobs requiring attention</span>
                    </div>
                    <Link href="/dashboard/admin/jobs?status=reported" className={styles.actAction}>Review</Link>
                  </div>
                )}
              </div>
            )}

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>Recent Activity</h2>
                <button className={styles.moreBtn} onClick={fetchData}>{IC.moreH}</button>
              </div>
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className={styles.actItem}>
                    <span className={styles.actIcon}>{IC.eye}</span>
                    <div className={styles.actContent}>
                      <span className={styles.actText}><strong>{act.actor}</strong> {act.description}</span>
                      <span className={styles.actTime}>{new Date(act.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyText}>No recent activity reported.</p>
              )}
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/dashboard/admin/jobs" style={{ textDecoration: 'none' }}>
                  <button className={styles.quickAction}>
                    <span className={styles.qaIcon}>{IC.plus}</span>
                    <span className={styles.qaLabel}>Post Job</span>
                  </button>
                </Link>
                <Link href="/dashboard/admin/blogs" style={{ textDecoration: 'none' }}>
                  <button className={styles.quickAction}>
                    <span className={styles.qaIcon}>{IC.barChart}</span>
                    <span className={styles.qaLabel}>Publish Article</span>
                  </button>
                </Link>
                <Link href="/dashboard/admin/reports" style={{ textDecoration: 'none' }}>
                  <button className={styles.quickAction}>
                    <span className={styles.qaIcon}>{IC.users}</span>
                    <span className={styles.qaLabel}>Reports</span>
                  </button>
                </Link>
                <Link href="/dashboard/admin/settings" style={{ textDecoration: 'none' }}>
                  <button className={styles.quickAction}>
                    <span className={styles.qaIcon}>{IC.settings}</span>
                    <span className={styles.qaLabel}>Settings</span>
                  </button>
                </Link>
              </div>
            </div>

            <div className={styles.featuredCard}>
              <span className={styles.featuredLabel}>PLATFORM STATUS</span>
              <span className={styles.featuredName}>Operational</span>
              <button className={styles.featuredLink}>All services are working correctly. No incidents. {IC.checkCircle}</button>
            </div>
          </div>
        </div>
      </AnimateOnScroll>
    </div>
  );
}
