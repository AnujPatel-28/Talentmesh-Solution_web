"use client";
import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
};

export default function AdminJobsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push('/dashboard/candidate');
            return;
        }

        async function fetchJobs() {
            try {
                const { data } = await insforge.database
                    .from('job')
                    .select('*, companyprofile(name)')
                    .order('created_at', { ascending: false });
                setJobs(data || []);
            } catch (err) {
                console.error('Fetch jobs error:', err);
            } finally {
                setLoading(false);
            }
        }

        if (user?.role === 'super_admin') fetchJobs();
    }, [user, authLoading, router]);

    const handleStatusUpdate = async (jobId: string, newStatus: string) => {
        try {
            const { error } = await insforge.database
                .from('job')
                .update({ status: newStatus })
                .eq('id', jobId);
            if (error) throw error;
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
            alert(`Job status updated to ${newStatus}`);
        } catch (err) {
            console.error(err);
            alert('Failed to update job status');
        }
    };

    const handleDelete = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this job?')) return;
        try {
            const { error } = await insforge.database
                .from('job')
                .delete()
                .eq('id', jobId);
            if (error) throw error;
            setJobs(prev => prev.filter(j => j.id !== jobId));
            alert('Job deleted');
        } catch (err) {
            console.error(err);
            alert('Failed to delete job');
        }
    };

    if (authLoading || loading) return <div className={styles.loading}>Loading jobs...</div>;

    const statusClass = (s: string) => {
        if (s === 'active') return styles.badgeActive;
        if (s === 'pending') return styles.badgePending;
        if (s === 'flagged') return styles.badgeClosed; // repurposed
        return styles.badgeClosed;
    };

    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Manage Jobs</h1>
                <p className={styles.pageSub}>Oversee all job listings and maintain platform content quality.</p>
            </div>

            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Job Title</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Posted</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map(j => (
                            <tr key={j.id}>
                                <td style={{ fontWeight: 600 }}>{j.title}</td>
                                <td>{j.companyprofile?.name}</td>
                                <td style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{IC.mapPin} {j.location}</td>
                                <td><span className={`${styles.badge} ${statusClass(j.status)}`}>{j.status}</span></td>
                                <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(j.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        {j.status === 'pending' && <button className={styles.successBtn} onClick={() => handleStatusUpdate(j.id, 'active')}>Approve</button>}
                                        {j.status !== 'flagged' && <button className={styles.secondaryBtn} onClick={() => handleStatusUpdate(j.id, 'flagged')}>Flag</button>}
                                        <button className={styles.dangerBtn} onClick={() => handleDelete(j.id)}>Delete</button>
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
