"use client";
import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
    x: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    mail: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
};

export default function AdminCandidatesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push('/dashboard/candidate');
            return;
        }

        async function fetchData() {
            try {
                const { data } = await insforge.database
                    .from('application')
                    .select('*, job(title, companyprofile(name)), profiles(full_name, email)')
                    .order('created_at', { ascending: false });
                
                setApplications(data || []);
                
                // Calculate stats
                const s = (data || []).reduce((acc: any, app: any) => {
                    acc.total++;
                    if (app.status === 'applied' || app.status === 'pending') acc.pending++;
                    else if (app.status === 'accepted') acc.accepted++;
                    else if (app.status === 'rejected') acc.rejected++;
                    return acc;
                }, { total: 0, pending: 0, accepted: 0, rejected: 0 });
                setStats(s);

            } catch (err) {
                console.error('Fetch apps error:', err);
            } finally {
                setLoading(false);
            }
        }

        if (user?.role === 'super_admin') fetchData();
    }, [user, authLoading, router]);

    const handleStatusUpdate = async (appId: string, newStatus: string) => {
        try {
            const { error } = await insforge.database
                .from('application')
                .update({ status: newStatus })
                .eq('id', appId);
            
            if (error) throw error;
            
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
            alert(`Application ${newStatus}`);
        } catch (err) {
            console.error(err);
            alert('Status update failed');
        }
    };

    if (authLoading || loading) return <div className={styles.loading}>Loading applications...</div>;

    const statusClass = (s: string) => {
        if (s === 'accepted') return styles.badgeActive;
        if (s === 'applied' || s === 'pending') return styles.badgePending;
        return styles.badgeClosed;
    };

    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Manage Candidates</h1>
                <p className={styles.pageSub}>Review platform-wide applications and oversee candidate progress.</p>
            </div>

            <div className={styles.stats} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className={styles.stat}><span className={styles.statLabel}>Total</span><span className={styles.statVal}>{stats.total}</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Pending</span><span className={styles.statVal} style={{ color: '#d97706' }}>{stats.pending}</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Accepted</span><span className={styles.statVal} style={{ color: '#16a34a' }}>{stats.accepted}</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Rejected</span><span className={styles.statVal} style={{ color: '#dc2626' }}>{stats.rejected}</span></div>
            </div>

            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Applied For</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app, i) => (
                            <tr key={i}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div className={styles.avatar} style={{ background: '#0D47A1' }}>
                                            {(app.profiles?.full_name || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{app.profiles?.full_name || 'Unknown Candidate'}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                {IC.mail} {app.profiles?.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 500 }}>{app.job?.title}</td>
                                <td>{app.job?.companyprofile?.name}</td>
                                <td><span className={`${styles.badge} ${statusClass(app.status)}`}>{app.status}</span></td>
                                <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(app.created_at).toLocaleDateString()}</td>
                                <td>
                                    {(app.status === 'applied' || app.status === 'pending') && (
                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                            <button className={styles.successBtn} onClick={() => handleStatusUpdate(app.id, 'accepted')}>{IC.check} Accept</button>
                                            <button className={styles.dangerBtn} onClick={() => handleStatusUpdate(app.id, 'rejected')}>{IC.x} Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
