'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@insforge/sdk';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './job-approvals.module.css';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || ''
});

interface Job {
    id: string;
    title: string;
    description: string;
    status: string;
    is_featured: boolean;
    featured_order: number;
    location: string;
    type: string;
    salary_min: number;
    salary_max: number;
    currency: string;
    created_at: string;
    admin_review_notes?: string;
    reviewed_at?: string;
    reviewed_by?: string;
    skills_required?: string[];
    experience_min?: number;
    experience_max?: number;
    companies: {
        name: string;
        logo_url: string;
    };
    profiles: {
        name: string;
        email: string;
    };
}

const REJECTION_REASONS = [
    "Incomplete information",
    "Inappropriate content",
    "Duplicate posting",
    "Policy violation",
    "Other"
];

export default function JobApprovalsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'featured'>('pending');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ pending: 0, approvedToday: 0, rejectedToday: 0, featured: 0 });
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; jobId: string | null; reason: string; notes: string }>({
        isOpen: false, jobId: null, reason: '', notes: ''
    });
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; jobId: string | null; message: string }>({
        isOpen: false, jobId: null, message: ''
    });

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = insforge.database
                .from('jobs')
                .select(`
                    *,
                    companies(name, logo_url),
                    profiles:recruiter_id(name, email)
                `);

            if (activeTab === 'pending') {
                query = query.eq('status', 'draft').order('created_at', { ascending: false });
            } else if (activeTab === 'approved') {
                query = query.eq('status', 'active').order('reviewed_at', { ascending: false });
            } else if (activeTab === 'rejected') {
                query = query.eq('status', 'rejected').order('reviewed_at', { ascending: false });
            } else if (activeTab === 'featured') {
                query = query.eq('is_featured', true).order('featured_order', { ascending: true });
            }

            const { data, error } = await query;
            if (error) throw error;
            setJobs(data || []);

            // Fetch Stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [pendingCount, approvedToday, rejectedToday, featuredCount] = await Promise.all([
                insforge.database.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
                insforge.database.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('reviewed_at', today.toISOString()),
                insforge.database.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'rejected').gte('reviewed_at', today.toISOString()),
                insforge.database.from('jobs').select('id', { count: 'exact', head: true }).eq('is_featured', true)
            ]);

            setStats({
                pending: pendingCount.count || 0,
                approvedToday: approvedToday.count || 0,
                rejectedToday: rejectedToday.count || 0,
                featured: featuredCount.count || 0
            });

        } catch (error) {
            console.error('Fetch Jobs Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleApprove = async (jobId: string) => {
        try {
            const { error } = await insforge.database
                .from('jobs')
                .update({
                    status: 'active',
                    reviewed_by: user?.id,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (error) throw error;

            // Optimistic update
            setJobs(prev => prev.filter(j => j.id !== jobId));
            setStats(prev => ({ ...prev, pending: prev.pending - 1, approvedToday: prev.approvedToday + 1 }));

            // Notification (Simplified - assuming a notifications table exists)
            const job = jobs.find(j => j.id === jobId);
            if (job) {
                await insforge.database.from('notifications').insert({
                    user_id: job.profiles.email, // Using email as user identifier for now or look up recruiter user_id
                    title: 'Job Approved',
                    content: `Your job '${job.title}' has been approved and is now live.`,
                    type: 'success'
                });
            }
        } catch (err) {
            console.error('Approve Error:', err);
        }
    };

    const handleReject = async () => {
        const { jobId, reason, notes } = rejectionModal;
        if (!jobId || !reason) return;

        try {
            const { error } = await insforge.database
                .from('jobs')
                .update({
                    status: 'rejected',
                    admin_review_notes: `${reason}: ${notes}`,
                    reviewed_by: user?.id,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (error) throw error;

            setJobs(prev => prev.filter(j => j.id !== jobId));
            setStats(prev => ({ ...prev, pending: prev.pending - 1, rejectedToday: prev.rejectedToday + 1 }));
            setRejectionModal({ isOpen: false, jobId: null, reason: '', notes: '' });

            // Notification
            const job = jobs.find(j => j.id === jobId);
            if (job) {
                await insforge.database.from('notifications').insert({
                    user_id: job.profiles.email,
                    title: 'Job Rejected',
                    content: `Your job '${job.title}' was rejected. Reason: ${reason}. ${notes}`,
                    type: 'error'
                });
            }
        } catch (err) {
            console.error('Reject Error:', err);
        }
    };

    const toggleFeatured = async (job: Job) => {
        try {
            const { error } = await insforge.database
                .from('jobs')
                .update({ is_featured: !job.is_featured })
                .eq('id', job.id);

            if (error) throw error;
            
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_featured: !j.is_featured } : j));
            setStats(prev => ({ ...prev, featured: job.is_featured ? prev.featured - 1 : prev.featured + 1 }));
        } catch (err) {
            console.error('Feature Toggle Error:', err);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Reorder logic (Native Drag & Drop)
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const onDragStart = (id: string) => setDraggedId(id);
    const onDragOver = (e: React.DragEvent) => e.preventDefault();
    const onDrop = async (targetId: string) => {
        if (!draggedId || draggedId === targetId) return;

        const items = [...jobs];
        const draggedIndex = items.findIndex(i => i.id === draggedId);
        const targetIndex = items.findIndex(i => i.id === targetId);

        const [removed] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, removed);

        // Update orders locally
        const updatedItems = items.map((item, index) => ({ ...item, featured_order: index }));
        setJobs(updatedItems);

        // Save to DB
        try {
            const updates = updatedItems.map(item => 
                insforge.database.from('jobs').update({ featured_order: item.featured_order }).eq('id', item.id)
            );
            await Promise.all(updates);
        } catch (err) {
            console.error('Reorder Error:', err);
        }
        setDraggedId(null);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Job Approval Queue</h1>
                    <span className={styles.pendingBadge}>{stats.pending} Pending Review</span>
                </div>
            </header>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Pending Review</span>
                    <span className={styles.statValue}>{stats.pending}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Approved Today</span>
                    <span className={styles.statValue} style={{ color: '#10b981' }}>{stats.approvedToday}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Rejected Today</span>
                    <span className={styles.statValue} style={{ color: '#ef4444' }}>{stats.rejectedToday}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Featured Jobs</span>
                    <span className={styles.statValue} style={{ color: '#f59e0b' }}>{stats.featured}</span>
                </div>
            </div>

            <div className={styles.tabs}>
                {(['pending', 'approved', 'rejected', 'featured'] as const).map(tab => (
                    <button 
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.emptyState}>Loading jobs...</div>
                ) : jobs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <h2>All caught up!</h2>
                        <p>No jobs pending review in this category.</p>
                    </div>
                ) : activeTab === 'pending' ? (
                    <div className={styles.pendingList}>
                        {jobs.map(job => (
                            <div key={job.id} className={styles.jobReviewCard}>
                                <div className={styles.cardLeft}>
                                    <div className={styles.companyInfo}>
                                        <div className={styles.logo}>
                                            {job.companies?.logo_url ? <img src={job.companies.logo_url} alt="" /> : job.companies?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <span className={styles.companyName}>{job.companies?.name}</span>
                                            <span className={styles.recruiterName}>Posted by {job.profiles?.name}</span>
                                        </div>
                                        <button 
                                            className={`${styles.featureBtn} ${job.is_featured ? styles.featuredActive : ''}`}
                                            onClick={() => toggleFeatured(job)}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill={job.is_featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        </button>
                                    </div>

                                    <span className={styles.jobTitle}>{job.title}</span>
                                    <div className={styles.jobMeta}>
                                        <div className={styles.metaItem}>📍 {job.location}</div>
                                        <div className={styles.metaItem}>💼 {job.type}</div>
                                        <div className={styles.metaItem}>💰 {job.currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}</div>
                                        <div className={styles.metaItem}>⏱️ {new Date(job.created_at).toLocaleDateString()}</div>
                                    </div>

                                    <div className={styles.descriptionBox}>
                                        <p className={styles.descriptionText}>
                                            {expandedIds.has(job.id) ? job.description : `${job.description.substring(0, 300)}...`}
                                        </p>
                                        <button className={styles.showMore} onClick={() => toggleExpand(job.id)}>
                                            {expandedIds.has(job.id) ? 'Show less' : 'Show more'}
                                        </button>
                                    </div>

                                    <div className={styles.skillTags}>
                                        {job.skills_required?.map(skill => (
                                            <span key={skill} className={styles.skillTag}>{skill}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.actionPanel}>
                                    <span className={styles.actionTitle}>Moderation Actions</span>
                                    <button className={styles.approveBtn} onClick={() => handleApprove(job.id)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Approve Job
                                    </button>
                                    <button className={styles.rejectBtn} onClick={() => setRejectionModal({ ...rejectionModal, isOpen: true, jobId: job.id })}>
                                        Reject Listing
                                    </button>
                                    <button className={styles.infoBtn} onClick={() => setInfoModal({ isOpen: true, jobId: job.id, message: '' })}>
                                        Request More Info
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                {activeTab === 'approved' ? (
                                    <tr>
                                        <th>Title</th>
                                        <th>Company</th>
                                        <th>Approved At</th>
                                        <th>Featured</th>
                                        <th>Actions</th>
                                    </tr>
                                ) : activeTab === 'rejected' ? (
                                    <tr>
                                        <th>Title</th>
                                        <th>Company</th>
                                        <th>Reason</th>
                                        <th>Rejected At</th>
                                        <th>Actions</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>Order</th>
                                        <th>Title</th>
                                        <th>Company</th>
                                        <th>Location</th>
                                        <th>Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {jobs.map((job, index) => (
                                    <tr 
                                        key={job.id} 
                                        draggable={activeTab === 'featured'}
                                        onDragStart={() => onDragStart(job.id)}
                                        onDragOver={onDragOver}
                                        onDrop={() => onDrop(job.id)}
                                        className={activeTab === 'featured' ? styles.featuredItem : ''}
                                    >
                                        {activeTab === 'featured' && <td>{index + 1}</td>}
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{job.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{job.type}</div>
                                        </td>
                                        <td>{job.companies?.name}</td>
                                        {activeTab === 'approved' && <td>{job.reviewed_at ? new Date(job.reviewed_at).toLocaleDateString() : 'N/A'}</td>}
                                        {activeTab === 'approved' && (
                                            <td>
                                                <button 
                                                    className={`${styles.featureBtn} ${job.is_featured ? styles.featuredActive : ''}`}
                                                    onClick={() => toggleFeatured(job)}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill={job.is_featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                    </svg>
                                                </button>
                                            </td>
                                        )}
                                        {activeTab === 'rejected' && <td>{job.admin_review_notes || 'No notes'}</td>}
                                        {activeTab === 'rejected' && <td>{job.reviewed_at ? new Date(job.reviewed_at).toLocaleDateString() : 'N/A'}</td>}
                                        {activeTab === 'featured' && <td>{job.location}</td>}
                                        <td>
                                            {activeTab === 'rejected' ? (
                                                <button 
                                                    className={styles.infoBtn} 
                                                    style={{ color: '#10b981', padding: '4px 12px' }}
                                                    onClick={() => handleApprove(job.id)}
                                                >
                                                    Override
                                                </button>
                                            ) : (
                                                <button 
                                                    className={styles.infoBtn} 
                                                    style={{ color: '#ef4444', padding: '4px 12px' }}
                                                    onClick={() => setRejectionModal({ ...rejectionModal, isOpen: true, jobId: job.id })}
                                                >
                                                    Deactivate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Reject Job Posting</h2>
                        <div className={styles.reasonList}>
                            {REJECTION_REASONS.map(reason => (
                                <div 
                                    key={reason}
                                    className={`${styles.reasonItem} ${rejectionModal.reason === reason ? styles.reasonItemActive : ''}`}
                                    onClick={() => setRejectionModal({ ...rejectionModal, reason })}
                                >
                                    <input 
                                        type="radio" 
                                        checked={rejectionModal.reason === reason} 
                                        readOnly
                                    />
                                    {reason}
                                </div>
                            ))}
                        </div>
                        <textarea 
                            className={styles.notesArea}
                            placeholder="Add additional notes for the recruiter (optional)..."
                            value={rejectionModal.notes}
                            onChange={(e) => setRejectionModal({ ...rejectionModal, notes: e.target.value })}
                        />
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}>Cancel</button>
                            <button 
                                className={styles.confirmRejectBtn} 
                                disabled={!rejectionModal.reason}
                                onClick={handleReject}
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Request Modal (Simplified) */}
            {infoModal.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Request More Info</h2>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                            Send a message to the recruiter asking for clarifications.
                        </p>
                        <textarea 
                            className={styles.notesArea}
                            placeholder="What information is missing?"
                            value={infoModal.message}
                            onChange={(e) => setInfoModal({ ...infoModal, message: e.target.value })}
                        />
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>Cancel</button>
                            <button 
                                className={styles.confirmRejectBtn} 
                                style={{ background: '#6366f1' }}
                                onClick={() => setInfoModal({ ...infoModal, isOpen: false })}
                            >
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
