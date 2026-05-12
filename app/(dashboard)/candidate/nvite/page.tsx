"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import styles from './nvite.module.css';

/* ─── Interfaces ─── */
interface Recruiter {
    id: string;
    full_name: string;
    avatar_url: string | null;
    company_name: string;
}

interface Job {
    id: string;
    title: string;
    company_name: string;
    location: string;
    job_type: string;
}

interface NVite {
    id: string;
    recruiter_id: string;
    candidate_id: string;
    job_id: string | null;
    subject: string;
    message: string;
    status: 'sent' | 'read' | 'accepted' | 'declined';
    read_at: string | null;
    responded_at: string | null;
    expires_at: string;
    created_at: string;
    candidate_response: string | null;
    candidate_reason: string | null;
    recruiter: Recruiter;
    job: Job | null;
}

type FilterStatus = 'all' | 'new' | 'accepted' | 'declined';

export default function NViteInbox() {
    const { user, isInitialized } = useAuth();
    const [nvites, setNvites] = useState<NVite[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isExpiredExpanded, setIsExpiredExpanded] = useState(false);
    
    // Decline Modal State
    const [declineModal, setDeclineModal] = useState<{ isOpen: boolean, nviteId: string | null }>({
        isOpen: false,
        nviteId: null
    });
    const [declineReason, setDeclineReason] = useState("");
    const [declineMessage, setDeclineMessage] = useState("");

    const fetchNVites = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            // Get candidate profile first to get candidate_id
            const { data: profile } = await insforge.database
                .from('candidate_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;

            const { data, error } = await insforge.database
                .from('nvites')
                .select(`
                    *,
                    recruiter:profiles!recruiter_id(id, full_name, avatar_url, company_name),
                    job:jobs(id, title, company_name, location, job_type)
                `)
                .eq('candidate_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNvites(data || []);
            
            // Update local storage for sidebar badge
            const unreadCount = (data || []).filter(n => n.status === 'sent').length;
            localStorage.setItem('nvite_unread_count', unreadCount.toString());
            
        } catch (err) {
            console.error('Failed to fetch NVites:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isInitialized && user) {
            fetchNVites();
        }
    }, [isInitialized, user, fetchNVites]);

    const handleExpand = async (nvite: NVite) => {
        if (expandedId === nvite.id) {
            setExpandedId(null);
            return;
        }

        setExpandedId(nvite.id);

        if (nvite.status === 'sent') {
            try {
                await insforge.database
                    .from('nvites')
                    .update({ 
                        status: 'read', 
                        read_at: new Date().toISOString() 
                    })
                    .eq('id', nvite.id)
                    .eq('status', 'sent');
                
                // Update local state
                setNvites(prev => prev.map(n => 
                    n.id === nvite.id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n
                ));
                
                // Refresh unread count in localStorage
                const newUnreadCount = nvites.filter(n => n.id !== nvite.id && n.status === 'sent').length;
                localStorage.setItem('nvite_unread_count', newUnreadCount.toString());
            } catch (err) {
                console.error('Failed to mark as read:', err);
            }
        }
    };

    const handleAccept = async (nvite: NVite) => {
        try {
            await insforge.database
                .from('nvites')
                .update({ 
                    status: 'accepted', 
                    responded_at: new Date().toISOString() 
                })
                .eq('id', nvite.id);

            // Create notification for recruiter
            await insforge.database.from('notifications').insert([{
                user_id: nvite.recruiter_id,
                title: 'NVite Accepted',
                message: `${user?.name || 'A candidate'} accepted your NVite for ${nvite.job?.title || 'a role'}.`,
                type: 'nvite_accepted',
                link: `/dashboard/recruiter/nvite/${nvite.id}`
            }]);

            setNvites(prev => prev.map(n => 
                n.id === nvite.id ? { ...n, status: 'accepted', responded_at: new Date().toISOString() } : n
            ));
        } catch (err) {
            console.error('Failed to accept NVite:', err);
        }
    };

    const handleDeclineClick = (id: string) => {
        setDeclineModal({ isOpen: true, nviteId: id });
    };

    const confirmDecline = async () => {
        if (!declineModal.nviteId) return;

        try {
            await insforge.database
                .from('nvites')
                .update({ 
                    status: 'declined', 
                    responded_at: new Date().toISOString(),
                    candidate_reason: declineReason,
                    candidate_response: declineMessage
                })
                .eq('id', declineModal.nviteId);

            setNvites(prev => prev.map(n => 
                n.id === declineModal.nviteId ? { 
                    ...n, 
                    status: 'declined', 
                    responded_at: new Date().toISOString(),
                    candidate_reason: declineReason,
                    candidate_response: declineMessage
                } : n
            ));
            
            setDeclineModal({ isOpen: false, nviteId: null });
            setDeclineReason("");
            setDeclineMessage("");
        } catch (err) {
            console.error('Failed to decline NVite:', err);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHrs < 24) {
            if (diffHrs === 0) return 'Just now';
            return `${diffHrs} hours ago`;
        }
        if (diffHrs < 48) return 'Yesterday';
        return date.toLocaleDateString();
    };

    const isExpired = (expiry: string) => new Date(expiry) < new Date();

    const activeNvites = nvites.filter(n => !isExpired(n.expires_at));
    const expiredNvites = nvites.filter(n => isExpired(n.expires_at));

    const filteredNvites = activeNvites.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'new') return n.status === 'sent' || n.status === 'read';
        if (filter === 'accepted') return n.status === 'accepted';
        if (filter === 'declined') return n.status === 'declined';
        return true;
    });

    const unreadCount = activeNvites.filter(n => n.status === 'sent').length;

    if (loading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <h1 className={styles.title}>NVite Inbox</h1>
                    {unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{unreadCount} New</span>
                    )}
                </div>
            </header>

            <div className={styles.filters}>
                {(['all', 'new', 'accepted', 'declined'] as FilterStatus[]).map(f => (
                    <button
                        key={f}
                        className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {filteredNvites.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                    <h2 className={styles.emptyTitle}>Your NVite inbox is empty</h2>
                    <p className={styles.emptyText}>
                        When recruiters invite you to opportunities, they'll appear here.
                    </p>
                    <Link href="/dashboard/candidate/profile" className={styles.profileLink}>
                        Build your profile to attract more NVites →
                    </Link>
                </div>
            ) : (
                <div className={styles.nviteList}>
                    {filteredNvites.map(nvite => (
                        <div 
                            key={nvite.id} 
                            className={`${styles.card} ${nvite.status === 'sent' ? styles.unreadCard : ''}`}
                        >
                            <div className={styles.cardMain} onClick={() => handleExpand(nvite)}>
                                <div className={styles.logoWrapper}>
                                    {nvite.recruiter.avatar_url ? (
                                        <img src={nvite.recruiter.avatar_url} alt="" className={styles.logo} />
                                    ) : (
                                        <div className={styles.logo}>
                                            {nvite.recruiter.company_name?.charAt(0) || 'C'}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.recruiterInfo}>
                                        From {nvite.recruiter.full_name} at {nvite.recruiter.company_name}
                                    </div>
                                    {nvite.job && (
                                        <div className={styles.jobInfo}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                            </svg>
                                            For: {nvite.job.title}
                                        </div>
                                    )}
                                    <div className={styles.subject}>{nvite.subject}</div>
                                    <div className={styles.preview}>{nvite.message}</div>
                                    <div className={styles.timestamp}>{formatTime(nvite.created_at)}</div>
                                </div>
                                <div className={styles.cardRight}>
                                    <span className={`${styles.statusBadge} ${styles[`status_${nvite.status}`]}`}>
                                        {nvite.status}
                                    </span>
                                </div>
                            </div>

                            {expandedId === nvite.id && (
                                <div className={styles.expandedContent}>
                                    <div className={styles.fullMessage}>{nvite.message}</div>
                                    
                                    {nvite.status === 'accepted' ? (
                                        <div className={styles.successPanel}>
                                            <div className={styles.successText}>
                                                You accepted this opportunity! The recruiter will be in touch soon.
                                            </div>
                                            {nvite.job && (
                                                <Link href={`/jobs/${nvite.job.id}`} className={styles.applyBtn}>
                                                    Apply Now
                                                </Link>
                                            )}
                                        </div>
                                    ) : nvite.status === 'declined' ? (
                                        <div className={styles.declinedInfo}>
                                            <strong>Declined:</strong> {nvite.candidate_reason}
                                            {nvite.candidate_response && <p>{nvite.candidate_response}</p>}
                                        </div>
                                    ) : (
                                        <div className={styles.actions}>
                                            <button 
                                                className={styles.btnPrimary}
                                                onClick={() => handleAccept(nvite)}
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                className={styles.btnOutline}
                                                onClick={() => handleDeclineClick(nvite.id)}
                                            >
                                                Decline
                                            </button>
                                            <button 
                                                className={styles.linkBtn}
                                                onClick={() => setExpandedId(null)}
                                            >
                                                Ignore for now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {expiredNvites.length > 0 && (
                <div className={styles.expiredSection}>
                    <div 
                        className={styles.expiredHeader}
                        onClick={() => setIsExpiredExpanded(!isExpiredExpanded)}
                    >
                        <span>Expired invitations ({expiredNvites.length})</span>
                        <svg 
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ transform: isExpiredExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                    {isExpiredExpanded && (
                        <div className={styles.expiredList}>
                            {expiredNvites.map(nvite => (
                                <div key={nvite.id} className={styles.card} style={{ cursor: 'default' }}>
                                    <div className={styles.cardMain}>
                                        <div className={styles.logoWrapper}>
                                            <div className={styles.logo}>
                                                {nvite.recruiter.company_name?.charAt(0) || 'C'}
                                            </div>
                                        </div>
                                        <div className={styles.cardBody}>
                                            <div className={styles.recruiterInfo}>
                                                {nvite.recruiter.company_name}
                                            </div>
                                            <div className={styles.subject}>{nvite.subject}</div>
                                            <div className={styles.timestamp}>
                                                This invitation expired on {new Date(nvite.expires_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Decline Modal */}
            {declineModal.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Decline Invitation</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Reason</label>
                            <select 
                                className={styles.select}
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                            >
                                <option value="">Select a reason</option>
                                <option value="Not interested in this role">Not interested in this role</option>
                                <option value="Not looking for new opportunities">Not looking for new opportunities</option>
                                <option value="Compensation doesn't match">Compensation doesn't match</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Additional Message (Optional)</label>
                            <textarea 
                                className={styles.textarea}
                                maxLength={200}
                                value={declineMessage}
                                onChange={(e) => setDeclineMessage(e.target.value)}
                                placeholder="Write a short message to the recruiter..."
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.cancelBtn}
                                onClick={() => setDeclineModal({ isOpen: false, nviteId: null })}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.confirmBtn}
                                onClick={confirmDecline}
                                disabled={!declineReason}
                            >
                                Confirm Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
