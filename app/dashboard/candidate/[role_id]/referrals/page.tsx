'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './referrals.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

const Ico = {
  TrendingUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
};

export default function CandidateReferralsPage() {
  const { role_id } = useParams();
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferrals() {
      if (!user) return;
      try {
        const { data, error } = await insforge.database
          .from('referrals')
          .select('*, jobs(title, company_profiles(company_name))')
          .eq('referrer_id', user.id);

        if (!error) setReferrals(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, [user]);

  const totalClicks = referrals.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const totalApps = referrals.reduce((sum, r) => sum + (r.applications || 0), 0);
  const totalEarnings = referrals.reduce((sum, r) => sum + (r.earnings || 0), 0);

  if (loading) return <div className={styles.page}><p>Loading referrals...</p></div>;

  return (
    <div className={styles.page}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Clicks</span>
          <span className={styles.statValue}>{totalClicks}</span>
          <div className={`${styles.statTrend} ${styles.trendUp}`}>
            <Ico.TrendingUp /> 12% increase
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Applications</span>
          <span className={styles.statValue}>{totalApps}</span>
          <div className={`${styles.statTrend} ${styles.trendUp}`}>
            <Ico.TrendingUp /> 5% conversion
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Earnings</span>
          <span className={styles.statValue}>₹{totalEarnings}</span>
          <div className={`${styles.statTrend} ${styles.trendUp}`}>
            <Ico.TrendingUp /> ₹2,400 pending
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Active Referrals</h2>
          <Link href="/jobs" className={styles.actionBtn}>Browse Jobs to Refer</Link>
        </div>

        {referrals.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You haven't referred any jobs yet. Start sharing to earn!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Job Role</th>
                  <th className={styles.th}>Code</th>
                  <th className={styles.th}>Clicks</th>
                  <th className={styles.th}>Apps</th>
                  <th className={styles.th}>Earnings</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref, idx) => (
                  <tr key={idx}>
                    <td className={styles.td}>
                      <div className={styles.jobCell}>
                        <span className={styles.jobTitle}>{ref.jobs?.title}</span>
                        <span className={styles.jobCompany}>{ref.jobs?.company_profiles?.company_name}</span>
                      </div>
                    </td>
                    <td className={styles.td}><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{ref.referral_code}</code></td>
                    <td className={styles.td}>{ref.clicks || 0}</td>
                    <td className={styles.td}>{ref.applications || 0}</td>
                    <td className={styles.td}>₹{ref.earnings || 0}</td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                    </td>
                    <td className={styles.td}>
                      <Link href={`/jobs/${ref.job_id}/share`} style={{ color: '#1e88e5' }}>
                        <Ico.External />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
