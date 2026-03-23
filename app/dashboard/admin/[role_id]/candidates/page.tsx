"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../admin.module.css';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { insforge } from '@/lib/insforge';
import { 
  getAllApplications, 
  getApplicationStats,
  getAllJobs
} from '@/lib/api/admin';
import { 
  updateStatusAction, 
  shortlistAction, 
  rejectAction 
} from './actions';
import Toast from '@/components/ui/Toast';

const IC = {
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  mail: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  calendar: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  briefcase: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
};

type AppStatus = 'all' | 'applied' | 'reviewing' | 'shortlisted' | 'interview' | 'offer' | 'rejected';

export default function AdminCandidatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<AppStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState('all');

  // UI State
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingApp, setRejectingApp] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [appData, statsData, jobsData] = await Promise.all([
        getAllApplications(),
        getApplicationStats(),
        getAllJobs()
      ]);
      setApplications(appData || []);
      setStats(statsData);
      setJobs(jobsData || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Failed to load applications data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'super_admin') {
        router.push('/dashboard/candidate');
        return;
      }
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  // Filtering Logic
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const statusMatch = activeTab === 'all' || app.status?.toLowerCase() === activeTab;
      const jobMatch = jobFilter === 'all' || app.job_id === jobFilter;
      
      const candidate = app.profiles;
      const job = app.jobs;
      
      const searchLower = searchQuery.toLowerCase();
      const stringMatch = !searchQuery || 
        candidate?.name?.toLowerCase().includes(searchLower) ||
        candidate?.email?.toLowerCase().includes(searchLower) ||
        job?.title?.toLowerCase().includes(searchLower);

      return statusMatch && jobMatch && stringMatch;
    });
  }, [applications, activeTab, jobFilter, searchQuery]);

  // Actions
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    const res = await updateStatusAction(id, newStatus);
    if (res.success) {
      setToast({ message: `Application status updated to ${newStatus}`, type: 'success' });
      await fetchData();
    } else {
      setToast({ message: res.error || 'Update failed', type: 'error' });
    }
    setActionLoading(null);
  };

  const handleShortlist = async (id: string) => {
    setActionLoading(id);
    const res = await shortlistAction(id);
    if (res.success) {
      setToast({ message: 'Candidate shortlisted and notified!', type: 'success' });
      await fetchData();
    } else {
      setToast({ message: res.error || 'Shortlist failed', type: 'error' });
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectingApp || !rejectionReason.trim()) return;
    
    setActionLoading(rejectingApp.id);
    const res = await rejectAction(rejectingApp.id, rejectionReason);
    if (res.success) {
      setToast({ message: 'Application rejected and candidate notified.', type: 'info' });
      setRejectingApp(null);
      setRejectionReason('');
      await fetchData();
    } else {
      setToast({ message: res.error || 'Rejection failed', type: 'error' });
    }
    setActionLoading(null);
  };

  // UI Helpers
  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10b981'; // Green
    if (score >= 40) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  if (authLoading || loading) return <div className={styles.loading}>Loading platform applications...</div>;
  if (error) return <div className={styles.loading} style={{ color: '#ef4444' }}>{error}</div>;

  return (
    <div className={styles.dash}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Platform Applications</h1>
          <p className={styles.pageSub}>Oversee complete candidate pipeline across all active jobs.</p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className={styles.stats} style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {[
          { label: 'Total', val: stats?.total, color: '#0f172a' },
          { label: 'Applied', val: stats?.applied, color: '#3b82f6' },
          { label: 'Reviewing', val: stats?.reviewing, color: '#6366f1' },
          { label: 'Shortlisted', val: stats?.shortlisted, color: '#10b981' },
          { label: 'Interview', val: stats?.interview, color: '#a855f7' },
          { label: 'Offer', val: stats?.offer, color: '#f59e0b' },
          { label: 'Rejected', val: stats?.rejected, color: '#ef4444' }
        ].map(s => (
          <div key={s.label} className={styles.stat} style={{ padding: '1rem' }}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statVal} style={{ fontSize: '1.2rem', color: s.color }}>{s.val || 0}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className={styles.card} style={{ gap: '1rem' }}>
        <div className={styles.filterTabsRow}>
          <div className={styles.filterTabs}>
            {(['all', 'applied', 'reviewing', 'shortlisted', 'interview', 'rejected'] as AppStatus[]).map(tab => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <select 
            className={styles.jobSelect}
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
          >
            <option value="all">All Job Postings</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>

        <div className={styles.searchBar}>
          {IC.search}
          <input 
            placeholder="Search by candidate name, email, or job title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Applications List */}
      <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Candidate</th>
              <th>Job & Company</th>
              <th>Match</th>
              <th>Status</th>
              <th>Applied</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No applications found matching your filters.
                </td>
              </tr>
            ) : (
              filteredApps.map(app => {
                const isExpanded = expandedId === app.id;
                const cand = app.profiles;
                const cProfile = cand?.candidate_profiles?.[0];

                return (
                  <React.Fragment key={app.id}>
                    <tr 
                      className={styles.appRow}
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    >
                      <td style={{ paddingRight: 0 }}>
                        <div className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
                          {IC.chevron}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div className={styles.avatar} style={{ background: '#3b82f6' }}>
                            {cand?.name?.[0].toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{cand?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{cand?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{app.jobs?.title}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{app.jobs?.companies?.name}</span>
                        </div>
                      </td>
                      <td>
                        <div 
                          className={styles.scoreCircle} 
                          style={{ background: getScoreColor(app.ai_match_score || 0) }}
                          title={`AI Match Score: ${app.ai_match_score}%`}
                        >
                          {app.ai_match_score || 0}%
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          app.status === 'shortlisted' ? styles.badgeActive : 
                          app.status === 'rejected' ? styles.badgeDanger : 
                          styles.badgeWarning
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {getTimeAgo(app.applied_at)}
                      </td>
                      <td></td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={7}>
                          <div className={styles.expandedContent}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                              <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Candidate Profile</span>
                                <div style={{ marginBottom: '0.5rem' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cProfile?.headline || 'No headline provided'}</span>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                                    {cProfile?.experience_years || 0} years of experience
                                  </div>
                                </div>
                                <div className={styles.skillsList}>
                                  {(cProfile?.skills || []).map((s: string) => (
                                    <span key={s} className={styles.skillChip}>{s}</span>
                                  ))}
                                  {(!cProfile?.skills || cProfile.skills.length === 0) && (
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No skills listed</span>
                                  )}
                                </div>
                              </div>

                              <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Cover Letter</span>
                                <div className={styles.detailValue} style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                                  {app.cover_letter || 'No cover letter provided.'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '0.5rem' }}>
                              <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Admin Notes</span>
                                <div className={styles.detailValue} style={{ fontSize: '0.8rem' }}>
                                  {app.recruiter_notes || 'No notes yet.'}
                                </div>
                              </div>

                              <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Documents</span>
                                {cProfile?.resume_url ? (
                                  <a 
                                    href={cProfile.resume_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={styles.viewAll}
                                    style={{ width: 'fit-content' }}
                                  >
                                    View Resume
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Resume not available</span>
                                )}
                              </div>
                            </div>

                            <div className={styles.actionRow}>
                              {app.status === 'applied' && (
                                <button 
                                  className={styles.secondaryBtn}
                                  onClick={() => handleUpdateStatus(app.id, 'reviewing')}
                                  disabled={!!actionLoading}
                                >
                                  Mark Reviewing
                                </button>
                              )}
                              
                              {(app.status === 'applied' || app.status === 'reviewing') && (
                                <button 
                                  className={styles.primaryBtn}
                                  onClick={() => handleShortlist(app.id)}
                                  disabled={!!actionLoading}
                                >
                                  Shortlist Candidate
                                </button>
                              )}

                              {app.status === 'shortlisted' && (
                                <button 
                                  className={styles.primaryBtn}
                                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 3px 10px rgba(124, 58, 237, 0.25)' }}
                                  onClick={() => handleUpdateStatus(app.id, 'interview')}
                                  disabled={!!actionLoading}
                                >
                                  Move to Interview
                                </button>
                              )}

                              {app.status !== 'rejected' && (
                                <button 
                                  className={styles.dangerBtn}
                                  onClick={() => setRejectingApp(app)}
                                  disabled={!!actionLoading}
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {rejectingApp && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className={styles.modalTitle}>Reject Application</h2>
                <p className={styles.modalSub}>
                  {rejectingApp.profiles?.name} applied for <strong>{rejectingApp.jobs?.title}</strong>
                </p>
              </div>
              <button 
                onClick={() => setRejectingApp(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                {IC.x}
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Rejection Reason</label>
              <textarea 
                className={styles.textarea}
                placeholder="Briefly explain why you're not moving forward (this helps the candidate)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={() => setRejectingApp(null)}>Cancel</button>
              <button 
                className={styles.primaryBtn} 
                style={{ background: '#ef4444', boxShadow: '0 3px 10px rgba(239, 68, 68, 0.25)' }}
                onClick={handleReject}
                disabled={!rejectionReason.trim() || !!actionLoading}
              >
                {actionLoading === rejectingApp.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
