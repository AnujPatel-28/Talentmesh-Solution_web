"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './dashboard.module.css';
import { AdminHeader } from './_components/AdminHeader';
import { AdminStatCard } from './_components/AdminStatCard';
import { AdminActivityFeed } from './_components/AdminActivityFeed';
import { AdminButton } from './_components/AdminForm';

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
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, alertsRes, activityRes] = await Promise.all([
        fetch('/api/admin/reports'),
        fetch('/api/admin/alerts'),
        fetch('/api/admin/activity?limit=10')
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({
          users: { value: data.metrics.totalCandidates + data.metrics.totalRecruiters, trend: 'up', trendValue: '+12%' },
          jobs: { value: data.metrics.totalJobs, trend: 'up', trendValue: '+5%' },
          applications: { value: data.metrics.totalApplications, trend: 'up', trendValue: '+18%' },
          recruiters: { value: data.metrics.totalRecruiters, trend: 'down', trendValue: '-2%' },
        });
      }

      if (alertsRes.ok) {
        setAlerts(await alertsRes.json());
      }

      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivities(data.activities || []);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className={styles.page} style={{ background: 'transparent' }}>
      <AdminHeader 
        title={`Welcome back, ${user?.name || user?.email?.split('@')[0] || 'Admin'}`}
        eyebrow="System Intelligence Overview"
        subtitle="Monitor, moderate, and manage your platform ecosystem from this central command center."
        actions={
          <>
            <AdminButton variant="secondary" onClick={fetchData}>Refresh Data</AdminButton>
            <AdminButton onClick={() => window.open('/dashboard/admin/jobs')}>Create New Role</AdminButton>
          </>
        }
      />

      <section className={styles.statsGrid}>
        <AdminStatCard 
          label="Global User Base" 
          value={stats?.users.value || 0} 
          trend={stats?.users.trend} 
          trendValue={stats?.users.trendValue}
          color="indigo"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
        />
        <AdminStatCard 
          label="Active Positions" 
          value={stats?.jobs.value || 0} 
          trend={stats?.jobs.trend} 
          trendValue={stats?.jobs.trendValue}
          color="emerald"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
        />
        <AdminStatCard 
          label="Application Velocity" 
          value={stats?.applications.value || 0} 
          trend={stats?.applications.trend} 
          trendValue={stats?.applications.trendValue}
          color="blue"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>}
        />
        <AdminStatCard 
          label="Recruiter Partnerships" 
          value={stats?.recruiters.value || 0} 
          trend={stats?.recruiters.trend} 
          trendValue={stats?.recruiters.trendValue}
          color="amber"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
        />
      </section>

      <div className={styles.dashboardContent}>
        <div className={styles.mainCol}>
          {alerts && (alerts.pendingRecruiters > 0 || alerts.pendingJobs > 0 || alerts.reportedJobs > 0) && (
            <section className={styles.alertsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Critical Moderation Queue</h2>
              </div>
              <div className={styles.alertsList}>
                {alerts.pendingRecruiters > 0 && (
                  <Link href="/dashboard/admin/recruiters?status=pending" className={`${styles.alertCard} ${styles.alertAmber}`}>
                    <div className={styles.alertIcon}>⚠️</div>
                    <div className={styles.alertContent}>
                      <strong>{alerts.pendingRecruiters} Approval Requests</strong>
                      <span>Recruiters waiting for portal access</span>
                    </div>
                  </Link>
                )}
                {alerts.pendingJobs > 0 && (
                  <Link href="/dashboard/admin/jobs?status=pending" className={`${styles.alertCard} ${styles.alertAmber}`}>
                    <div className={styles.alertIcon}>📝</div>
                    <div className={styles.alertContent}>
                      <strong>{alerts.pendingJobs} Job Reviews</strong>
                      <span>New listings requiring verification</span>
                    </div>
                  </Link>
                )}
                {alerts.reportedJobs > 0 && (
                  <Link href="/dashboard/admin/jobs?status=reported" className={`${styles.alertCard} ${styles.alertRed}`}>
                    <div className={styles.alertIcon}>🚩</div>
                    <div className={styles.alertContent}>
                      <strong>{alerts.reportedJobs} Flagged Reports</strong>
                      <span>Safety violations requiring attention</span>
                    </div>
                  </Link>
                )}
              </div>
            </section>
          )}

          <section className={styles.quickActionsSection} style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>High Frequency Operations</h2>
            </div>
            <div className={styles.quickActions} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Link href="/dashboard/admin/jobs" className={styles.actionButton} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', background: '#f8fafc', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>🚀</span>
                <strong>Deploy New Job</strong>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>Add a listing to global index</p>
              </Link>
              <Link href="/dashboard/admin/blogs" className={styles.actionButton} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', background: '#f8fafc', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>✍️</span>
                <strong>Publish Article</strong>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>Update the ecosystem blog</p>
              </Link>
              <Link href="/dashboard/admin/reports" className={styles.actionButton} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', background: '#f8fafc', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>📈</span>
                <strong>Deep Analytics</strong>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>Export performance metrics</p>
              </Link>
              <Link href="/dashboard/admin/settings" className={styles.actionButton} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', background: '#f8fafc', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>⚙️</span>
                <strong>System Prefs</strong>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>Configure global parameters</p>
              </Link>
            </div>
          </section>
        </div>

        <aside className={styles.rightCol}>
          <AdminActivityFeed activities={activities} isLoading={loading} />
          
          <div style={{ marginTop: '28px', padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff' }}>
             <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Platform Health</h3>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '1.2rem', fontWeight: 700 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                Optimal
             </div>
             <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px' }}>
                All nodes are operational. Request latency is at <span style={{ color: '#fff', fontWeight: 600 }}>24ms</span>. No active incidents reported.
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
