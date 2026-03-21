"use client";
import React, { useState, useEffect, useCallback } from 'react';
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
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, suspended: 0 });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await insforge.database
                .from('profiles')
                .select(`
                    *,
                    recruiter_profiles (
                        is_approved,
                        approved_at,
                        companies: company_id (
                            name
                        )
                    )
                `)
                .eq('role', 'recruiter')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const recData = data || [];
            setRecruiters(recData);

            // Calculate stats
            const pending = recData.filter((r: any) => !r.recruiter_profiles?.[0]?.is_approved).length;
            const suspended = recData.filter((r: any) => !r.is_active).length;

            setStats({
                total: recData.length,
                pending,
                suspended
            });

        } catch (err) {
            console.error('Fetch recruiters error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
                router.push('/dashboard/candidate');
                return;
            }
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);

    const handleAction = async (recId: string, action: 'approve' | 'suspend') => {
        if (!confirm(`Are you sure you want to ${action} this recruiter?`)) return;

        setActionLoading(recId);
        try {
            const res = await fetch(`/api/admin/recruiters/${recId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Action failed');
            }

            await fetchData();
            alert(`Recruiter ${action === 'approve' ? 'approved' : 'suspended'} successfully.`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (authLoading || (loading && recruiters.length === 0)) {
        return <div className={styles.loading}>Loading recruiters...</div>;
    }

    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Manage Recruiters</h1>
                    <p className={styles.pageSub}>View, approve, and manage recruiter accounts across the platform.</p>
                </div>
                <button onClick={fetchData} className={styles.secondaryAction} style={{ width: 'auto', padding: '0.4rem 1rem' }}>
                    Refresh List
                </button>
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
                        {recruiters.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    No recruiters found.
                                </td>
                            </tr>
                        ) : (
                            recruiters.map((r, i) => {
                                const isSuspended = !r.is_active;
                                const isPending = !r.recruiter_profiles?.[0]?.is_approved;
                                const status = isSuspended ? 'Suspended' : isPending ? 'Pending' : 'Active';
                                const companyName = r.recruiter_profiles?.[0]?.companies?.name || 'Self-employed';

                                return (
                                    <tr key={r.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div className={styles.avatar} style={{ background: isSuspended ? '#94a3b8' : '#1565C0' }}>
                                                    {(r.name || 'R')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: isSuspended ? '#94a3b8' : '#1e293b' }}>
                                                        {r.name || 'Anonymous Recruiter'}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                        {IC.mail} {r.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 500, color: '#475569' }}>{companyName}</td>
                                        <td>
                                            <span className={`${styles.badge} ${isSuspended ? styles.badgeDanger : isPending ? styles.badgeWarning : styles.badgeActive
                                                }`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {isPending && !isSuspended && (
                                                    <button
                                                        className={styles.primaryAction}
                                                        style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                        onClick={() => handleAction(r.id, 'approve')}
                                                        disabled={actionLoading === r.id}
                                                    >
                                                        {actionLoading === r.id ? '...' : 'Approve'}
                                                    </button>
                                                )}
                                                {!isSuspended && (
                                                    <button
                                                        className={styles.dangerBtn}
                                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                        onClick={() => handleAction(r.id, 'suspend')}
                                                        disabled={actionLoading === r.id}
                                                    >
                                                        Suspend
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
