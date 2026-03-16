"use client";
import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    mail: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    briefcase: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
};

export default function AdminRecruitersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [recruiters, setRecruiters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, suspended: 0 });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push('/dashboard/candidate');
            return;
        }

        async function fetchData() {
            try {
                const { data } = await insforge.database
                    .from('profiles')
                    .select('*, companyprofile(name)')
                    .eq('role', 'recruiter')
                    .order('created_at', { ascending: false });
                
                setRecruiters(data || []);
                
                // Calculate stats (mocked since status field might not exist yet)
                setStats({
                    total: (data || []).length,
                    pending: 0,
                    suspended: 0
                });

            } catch (err) {
                console.error('Fetch recruiters error:', err);
            } finally {
                setLoading(false);
            }
        }

        if (user?.role === 'super_admin') fetchData();
    }, [user, authLoading, router]);

    const handleStatusUpdate = async (recId: string, newStatus: string) => {
        alert(`Setting recruiter ${recId} status to ${newStatus}`);
    };

    if (authLoading || loading) return <div className={styles.loading}>Loading recruiters...</div>;

    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Manage Recruiters</h1>
                <p className={styles.pageSub}>View, approve, and manage recruiter accounts across the platform.</p>
            </div>

            <div className={styles.stats} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className={styles.stat}><span className={styles.statLabel}>Total Recruiters</span><span className={styles.statVal}>{stats.total}</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Pending Approval</span><span className={styles.statVal} style={{ color: '#d97706' }}>{stats.pending}</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Suspended</span><span className={styles.statVal} style={{ color: '#dc2626' }}>{stats.suspended}</span></div>
            </div>

            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Recruiter</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recruiters.map((r, i) => (
                            <tr key={i}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div className={styles.avatar} style={{ background: '#1565C0' }}>{(r.full_name || 'R')[0].toUpperCase()}</div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{r.full_name || 'Anonymous Recruiter'}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>{IC.mail} {r.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 500 }}>{r.companyprofile?.name || 'Self-employed'}</td>
                                <td><span className={`${styles.badge} ${styles.badgeActive}`}>Active</span></td>
                                <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button className={styles.dangerBtn} onClick={() => handleStatusUpdate(r.id, 'suspended')}>Suspend</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
