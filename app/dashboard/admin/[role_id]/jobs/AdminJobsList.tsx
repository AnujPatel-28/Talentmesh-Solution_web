'use client';

import React, { useState, useTransition, useMemo } from 'react';
import styles from '../admin.module.css';
import Link from 'next/link';
import { 
    approveJobAction, 
    pauseJobAction, 
    closeJobAction, 
    deleteJobAction,
    rejectJobAction 
} from './actions';
import Toast from '@/components/ui/Toast';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
};

interface AdminJobsListProps {
    initialJobs: any[];
}

type TabStatus = 'all' | 'active' | 'draft' | 'pending' | 'closed' | 'paused';

export default function AdminJobsList({ initialJobs }: AdminJobsListProps) {
    const [jobs, setJobs] = useState(initialJobs);
    const [activeTab, setActiveTab] = useState<TabStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const filteredJobs = useMemo(() => {
        return jobs.filter(j => {
            const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 j.companies?.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (activeTab === 'all') return matchesSearch && j.status !== 'deleted';
            if (activeTab === 'pending') return matchesSearch && !j.is_approved && j.status !== 'deleted';
            return matchesSearch && j.status === activeTab;
        });
    }, [jobs, activeTab, searchQuery]);

    const handleAction = async (id: string, action: any, successMsg: string) => {
        startTransition(async () => {
            const res = await action(id);
            if (res.success) {
                setToast({ message: successMsg, type: 'success' });
            } else {
                setToast({ message: res.error || 'Action failed', type: 'error' });
                // Revert or re-fetch if needed, but actions are idempotent usually
            }
        });
    };

    const handleApprove = (id: string) => {
        const job = jobs.find(j => j.id === id);
        if (confirm(`Approve "${job?.title}"?`)) {
            // Optimistic update
            setJobs(prev => prev.map(j => j.id === id ? { ...j, is_approved: true, status: 'active' } : j));
            handleAction(id, approveJobAction, 'Job approved successfully');
        }
    };

    const handlePause = (id: string) => {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'paused' } : j));
        handleAction(id, pauseJobAction, 'Job paused');
    };

    const handleClose = (id: string) => {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'closed' } : j));
        handleAction(id, closeJobAction, 'Job closed');
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this job? This is a soft delete.')) {
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'deleted' } : j));
            handleAction(id, deleteJobAction, 'Job deleted');
        }
    };

    const handleReject = (id: string) => {
        const reason = prompt('Reason for rejection:');
        if (reason !== null) {
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'closed', is_approved: false, recruiter_notes: reason } : j));
            startTransition(async () => {
                const res = await rejectJobAction(id, reason);
                if (res.success) setToast({ message: 'Job rejected', type: 'info' });
                else setToast({ message: res.error || 'Action failed', type: 'error' });
            });
        }
    };

    const statusBadge = (j: any) => {
        if (!j.is_approved) return <span className={`${styles.badge} ${styles.badgeWarning}`}>Pending Approval</span>;
        if (j.status === 'active') return <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>;
        if (j.status === 'paused') return <span className={`${styles.badge} ${styles.badgeWarning}`}>Paused</span>;
        if (j.status === 'closed') return <span className={`${styles.badge} ${styles.badgeDanger}`}>Closed</span>;
        return <span className={`${styles.badge} ${styles.badgePending}`}>{j.status}</span>;
    };

    return (
        <div className={styles.dash}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Job Management</h1>
                    <p className={styles.pageSub}>Manage, approve, and oversee all platform job listings.</p>
                </div>
                <Link href="/dashboard/admin/jobs/new" className={styles.primaryBtn}>
                    {IC.plus} Post New Job
                </Link>
            </div>

            <div className={styles.searchRow}>
                <div className={styles.searchBar}>
                    {IC.search}
                    <input 
                        placeholder="Search by title or company..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['all', 'active', 'draft', 'pending', 'closed', 'paused'] as TabStatus[]).map(tab => (
                        <button 
                            key={tab}
                            className={`${styles.filterBtn} ${activeTab === tab ? styles.filterBtnActive : ''}`}
                            onClick={() => setActiveTab(tab)}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Job Details</th>
                            <th>Company</th>
                            <th>Stats</th>
                            <th>Status</th>
                            <th>Posted By</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredJobs.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    No jobs found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredJobs.map(j => (
                                <tr key={j.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{j.title}</span>
                                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{j.type} • {j.location}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className={styles.logoCircle} style={{ width: '24px', height: '24px', fontSize: '0.6rem' }}>
                                                {j.companies?.name?.[0]}
                                            </div>
                                            <span>{j.companies?.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {j.applications_count || 0} applicants
                                        </span>
                                    </td>
                                    <td>{statusBadge(j)}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.8rem' }}>{j.profiles?.name || 'Admin'}</span>
                                            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{new Date(j.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            {!j.is_approved && (
                                                <>
                                                    <button className={styles.successBtn} onClick={() => handleApprove(j.id)}>Approve</button>
                                                    <button className={styles.dangerBtn} onClick={() => handleReject(j.id)}>Reject</button>
                                                </>
                                            )}
                                            {j.is_approved && j.status === 'active' && (
                                                <button className={styles.secondaryBtn} onClick={() => handlePause(j.id)}>Pause</button>
                                            )}
                                            {j.is_approved && j.status === 'paused' && (
                                                <button className={styles.successBtn} onClick={() => handleApprove(j.id)}>Resume</button>
                                            )}
                                            {j.status !== 'closed' && (
                                                <button className={styles.secondaryBtn} onClick={() => handleClose(j.id)}>Close</button>
                                            )}
                                            <Link href={`/dashboard/admin/jobs/${j.id}/edit`} className={styles.secondaryBtn} title="Edit">
                                                {IC.edit}
                                            </Link>
                                            <button className={styles.dangerBtn} onClick={() => handleDelete(j.id)} title="Delete">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
