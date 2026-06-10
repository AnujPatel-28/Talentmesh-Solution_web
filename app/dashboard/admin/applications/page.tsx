'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import styles from './applications.module.css';
import { insforge, invokeFunction } from '@/lib/insforge';
import { MapPin, Phone, FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

type AdminApplication = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  applied_at: string;
  updated_at: string;
  cover_letter?: string;
  ai_match_score?: number;
  apply_type?: string;
  resume_url?: string;
  resume_snapshot_key?: string;
  jobs: {
    id: string;
    title: string;
    companies: {
      name: string;
    };
  };
  profiles: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    candidate_profiles?: Array<{
      headline?: string;
      experience_years?: number;
      skills?: string[];
      resume_url?: string;
      education?: string;
      linkedin_url?: string;
      github_url?: string;
      portfolio_url?: string;
    }>;
  };
};

import { APPLICATION_STATUSES, STATUS_LABELS as CANONICAL_STATUS_LABELS } from '@/lib/constants/applicationStatuses';

const statusOptions = [
  'all',
  APPLICATION_STATUSES.APPLIED,
  APPLICATION_STATUSES.REVIEWING,
  APPLICATION_STATUSES.SHORTLISTED,
  APPLICATION_STATUSES.INTERVIEWING,
  APPLICATION_STATUSES.OFFERED,
  APPLICATION_STATUSES.HIRED,
  APPLICATION_STATUSES.REJECTED,
  APPLICATION_STATUSES.WITHDRAWN,
];

// Map internal status keys to display labels
const STATUS_LABELS: Record<string, string> = {
  ...CANONICAL_STATUS_LABELS,
  offered:      'Offer Sent',
  hired:        'Hired',
  rejected:     'Rejected',
};

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Detail View
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (selectedApp) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const { data, error } = await insforge.database
            .from('application_status_history')
            .select('*')
            .eq('application_id', selectedApp.id)
            .order('changed_at', { ascending: true });
          if (data) setStatusHistory(data);
        } catch (err) {
          console.error('Failed to fetch status history:', err);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    } else {
      setStatusHistory([]);
    }
  }, [selectedApp]);

  // Pagination
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchApplications = useCallback(async (currentStatus = status, p = page, q = search) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await invokeFunction('admin-applications', {
        method: 'GET',
        queries: {
          status: currentStatus,
          search: q,
          page: p.toString(),
          limit: '20',
        }
      });

      if (!error) {
        setApplications(data.applications || []);
        setTotal(data.applications?.length || 0); 
      } else {
        setError(error.message || 'Failed to sync applications pipeline');
      }
    } catch (err: any) {
      setError('Failed to sync applications pipeline');
    } finally {
      setLoading(false);
    }
  }, [status, page, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusUpdate = async (appId: string, nextStatus: string) => {
    if (updatingId) return; // prevent double-click
    setUpdatingId(appId);
    try {
      const { data, error } = await invokeFunction('admin-applications', {
        method: 'PATCH',
        body: { id: appId, status: nextStatus },
      });
      if (error) {
        // Handle withdrawn guard
        if (error.status === 409 || error.message?.includes('withdrawn')) {
          setToast({ message: 'Cannot update a withdrawn application.', type: 'error' });
        } else {
          setToast({ message: error.message || 'Status update failed', type: 'error' });
        }
      } else {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: nextStatus } : a));
        if (selectedApp?.id === appId) setSelectedApp(prev => prev ? { ...prev, status: nextStatus } : null);
        setToast({ message: `Status updated to "${STATUS_LABELS[nextStatus] || nextStatus}"`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Status update failed', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownload = async (appId: string, filename: string, fallbackUrl?: string) => {
    try {
      const token = window.sessionStorage.getItem('tm_token');
      const targetUrl = `${window.location.origin}/api/v1/remote/functions/resume-proxy?applicationId=${appId}&accessType=downloaded`;

      const response = await fetch(targetUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch from proxy');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download document:', err);
      if (fallbackUrl) {
        window.open(fallbackUrl, '_blank');
      }
    }
  };

  const handleView = async (appId: string, fallbackUrl?: string) => {
    try {
      const token = window.sessionStorage.getItem('tm_token');
      const targetUrl = `${window.location.origin}/api/v1/remote/functions/resume-proxy?applicationId=${appId}&accessType=viewed`;

      const response = await fetch(targetUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch from proxy');
      const blob = await response.blob();
      const fileBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(fileBlob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Failed to view document:', err);
      if (fallbackUrl) {
        window.open(fallbackUrl, '_blank');
      }
    }
  };

  return (
    <section className={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.875rem 1.25rem',
          background: toast.type === 'success' ? '#f0fdf4' : toast.type === 'error' ? '#fef2f2' : '#eff6ff',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : toast.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
          borderRadius: '14px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          color: toast.type === 'success' ? '#166534' : toast.type === 'error' ? '#991b1b' : '#1e40af',
          fontWeight: 600, fontSize: '0.9rem',
          animation: 'fadeIn 0.3s ease',
          maxWidth: '360px',
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {toast.message}
          <button
            onClick={() => setToast(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '1rem', lineHeight: 1 }}
          >×</button>
        </div>
      )}
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Platform Pipeline</p>
        <h1 className={styles.title}>Job Applications</h1>
        <p className={styles.subtitle}>Track, review, and process job applications submitted by candidates.</p>
      </header>

      <div className={styles.toolbarRow}>
        <div className={styles.toolbar}>
          <input
            className={styles.searchInput}
            placeholder="Search candidate, job, or company..."
            value={search}
            onChange={e => {
              const val = e.target.value;
              setSearch(val);
              if (searchDebounce.current) clearTimeout(searchDebounce.current);
              searchDebounce.current = setTimeout(() => {
                fetchApplications(status, 0, val);
              }, 400);
            }}
            onKeyDown={e => e.key === 'Enter' && fetchApplications()}
          />
          <CustomSelect
            className={styles.customSelectDropdown}
            style={{ width: '200px' }}
            value={status}
            onChange={(e: any) => { setStatus(e.target.value); setPage(0); }}
            options={statusOptions.map(o => ({
              label: o === 'all' ? 'All Statuses' : (STATUS_LABELS[o] || o.charAt(0).toUpperCase() + o.slice(1)),
              value: o
            }))}
          />
          <button className={styles.primaryButton} onClick={() => fetchApplications()}>Refresh List</button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.list}>
        {loading ? (
          <div className={styles.emptyState}>Gathering pipeline data...</div>
        ) : applications.length === 0 ? (
          <div className={styles.emptyState}>No records found in this stage.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Target Role</th>
                <th>Company</th>
                <th>Applied</th>
                <th>Stage</th>
                <th style={{ textAlign: 'right' }}>Review / Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const profile = Array.isArray(app.profiles?.candidate_profiles)
                  ? app.profiles.candidate_profiles[0]
                  : app.profiles?.candidate_profiles;
                return (
                  <tr key={app.id}>
                    <td>
                      <div className={styles.candidateCell}>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{app.profiles?.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>{app.profiles?.email}</span>
                        {profile?.headline && (
                          <span style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                            {profile.headline} {profile.experience_years ? `(${profile.experience_years}y exp)` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button 
                        className={styles.viewBtn} 
                        style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2563eb', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        onClick={() => setSelectedApp(app)}
                      >
                        {app.jobs?.title}
                      </button>
                    </td>
                    <td style={{ fontWeight: 600, color: '#334155' }}>{app.jobs?.companies?.name}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{new Date(app.applied_at).toLocaleDateString()}</span>
                        <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>{getRelativeTime(app.applied_at)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${app.status}`]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {app.status !== 'shortlisted' && app.status !== 'hired' && (
                          <button
                            title="Shortlist / Approve"
                            disabled={updatingId === app.id}
                            onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                            style={{
                              padding: '6px 12px',
                              background: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#bbf7d0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#dcfce7'; }}
                          >
                            ✓ Shortlist
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button
                            title="Reject"
                            disabled={updatingId === app.id}
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            style={{
                              padding: '6px 12px',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fecaca'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fee2e2'; }}
                          >
                            ✗ Reject
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedApp(app)}
                          style={{
                            padding: '6px 12px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedApp && (() => {
        const profile = Array.isArray(selectedApp.profiles?.candidate_profiles)
          ? selectedApp.profiles.candidate_profiles[0]
          : selectedApp.profiles?.candidate_profiles;

        const renderEducation = (edu: any) => {
          if (!edu) return '';
          if (typeof edu === 'string') return edu;
          if (Array.isArray(edu)) {
            return edu.map((e: any) => typeof e === 'object' ? `${e.degree || ''} (${e.school || ''})` : e).join(', ');
          }
          if (typeof edu === 'object') {
            return `${edu.degree || edu.course || ''} ${edu.school || edu.institution || edu.university ? `at ${edu.school || edu.institution || edu.university}` : ''}`;
          }
          return String(edu);
        };

        return (
          <div className={styles.modalOverlay} onClick={() => setSelectedApp(null)}>
            <div className={styles.modal} style={{ maxWidth: '1000px' }} onClick={e => e.stopPropagation()}>
              <header className={styles.modalHeader}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Application Details</h2>
                <button className={styles.closeBtn} onClick={() => setSelectedApp(null)}>×</button>
              </header>
              
              <div className={styles.modalContent}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                  {/* LEFT COLUMN: Candidate Profile, Experience, Skills, Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Profile Card */}
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                      <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}>
                        {selectedApp.profiles.name[0]}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{selectedApp.profiles.name}</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>{selectedApp.profiles.email}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                          {selectedApp.profiles.phone && <span style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {selectedApp.profiles.phone}</span>}
                          {selectedApp.profiles.location && <span style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {selectedApp.profiles.location}</span>}
                        </div>
                      </div>
                    </div>

                    {/* AI Match Score Card */}
                    {selectedApp.ai_match_score !== undefined && selectedApp.ai_match_score !== null && (
                      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '1.25rem 1.5rem', borderRadius: '20px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🤖</span> AI Candidate Fit Match
                          </h4>
                          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#1e40af', lineHeight: '1.4' }}>
                            Our algorithmic model evaluated this candidate's resume, headline, and experience against target job requirements.
                          </p>
                        </div>
                        <div style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #3b82f6', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.15)', flexShrink: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{selectedApp.ai_match_score}%</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>Fit</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Candidate Profile Details Card */}
                    {profile ? (
                      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Professional Details</h4>
                        
                        {profile.headline && (
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Headline</span>
                            <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>{profile.headline}</span>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          {profile.experience_years !== undefined && (
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Experience</span>
                              <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{profile.experience_years} Years</span>
                            </div>
                          )}

                          {profile.education && (
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Education</span>
                              <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{renderEducation(profile.education)}</span>
                            </div>
                          )}
                        </div>

                        {profile.skills && profile.skills.length > 0 && (
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Skills & Keywords</span>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {profile.skills.map((skill: string, index: number) => (
                                <span key={index} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Links */}
                        {(profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>External Links</span>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              {profile.linkedin_url && (
                                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0a66c2', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  LinkedIn
                                </a>
                              )}
                              {profile.github_url && (
                                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#24292e', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  GitHub
                                </a>
                              )}
                              {profile.portfolio_url && (
                                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#10b981', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  Portfolio
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                        <span style={{ fontSize: '1.5rem' }}>📄</span>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>No detailed profile information available.</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Target Job, Cover Letter, Status History Log, Resume Assets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Target Job Details */}
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Target Position</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b', fontWeight: 500 }}>Target Role:</span>
                          <strong style={{ color: '#0f172a' }}>{selectedApp.jobs.title}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b', fontWeight: 500 }}>Company Name:</span>
                          <strong style={{ color: '#0f172a' }}>{selectedApp.jobs.companies.name}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                          <span style={{ color: '#64748b', fontWeight: 500 }}>Applied On:</span>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{new Date(selectedApp.applied_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                          <span style={{ color: '#64748b', fontWeight: 500 }}>Applied Through:</span>
                          <span style={{ color: '#0f172a', fontWeight: 600, textTransform: 'capitalize' }}>
                            {selectedApp.apply_type || 'Platform'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: 500 }}>Current Status:</span>
                          <span className={`${styles.statusBadge} ${styles[`status_${selectedApp.status}`]}`}>{selectedApp.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Status History Timeline */}
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Application History Audit</h4>
                      {loadingHistory ? (
                        <div style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>Loading history log...</div>
                      ) : statusHistory.length === 0 ? (
                        <div style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>No log entries recorded.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                          {statusHistory.map((h, i) => (
                            <div key={h.id} style={{ display: 'flex', gap: '10px', fontSize: '0.825rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '5px' }} />
                                {i < statusHistory.length - 1 && <div style={{ flex: 1, width: '2px', background: '#e2e8f0', margin: '4px 0' }} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#1e293b' }}>
                                  <span>{h.to_status.charAt(0).toUpperCase() + h.to_status.slice(1)}</span>
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>{new Date(h.changed_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                  {h.note || 'Status updated'} by <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{h.actor_type || 'user'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Statement / Cover Letter */}
                    <div>
                      <span className={styles.sectionTitle}>Cover Letter / Statement</span>
                      <div className={styles.coverLetterBox} style={{ fontSize: '0.85rem', padding: '1rem', maxHeight: '120px', overflowY: 'auto' }}>
                        {selectedApp.cover_letter || 'No cover letter provided for this application.'}
                      </div>
                    </div>

                    {/* Resume Assets */}
                    {(() => {
                      const resumeUrl = selectedApp.resume_url || profile?.resume_url;
                      if (!resumeUrl && !selectedApp.resume_snapshot_key) return null;
                      return (
                        <div>
                          <span className={styles.sectionTitle}>Assets & Resume</span>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                              onClick={() => handleView(selectedApp.id, resumeUrl || undefined)}
                              className={styles.primaryButton}
                              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <FileText size={14} /> View Resume
                            </button>
                            <button 
                              onClick={() => handleDownload(selectedApp.id, `${selectedApp.profiles.name.replace(/\s+/g, '_')}_resume.pdf`, resumeUrl || undefined)}
                              className={styles.primaryButton}
                              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', background: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Download size={14} /> Download Resume
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <footer className={styles.modalFooter}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <button 
                    className={styles.closeBtn} 
                    style={{ fontSize: '0.875rem', fontWeight: 700, padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                    onClick={() => setSelectedApp(null)}
                  >
                    Close
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      disabled={updatingId === selectedApp.id || selectedApp.status === 'shortlisted' || selectedApp.status === 'hired'}
                      onClick={async () => {
                        await handleStatusUpdate(selectedApp.id, 'shortlisted');
                        if (!toast || toast.type !== 'error') setSelectedApp(null);
                      }}
                      style={{ padding: '0.6rem 1.2rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', opacity: (updatingId === selectedApp.id || selectedApp.status === 'shortlisted' || selectedApp.status === 'hired') ? 0.5 : 1 }}
                    >
                      Shortlist
                    </button>
                    <button
                      disabled={updatingId === selectedApp.id || selectedApp.status === 'rejected'}
                      onClick={async () => {
                        await handleStatusUpdate(selectedApp.id, 'rejected');
                        if (!toast || toast.type !== 'error') setSelectedApp(null);
                      }}
                      style={{ padding: '0.6rem 1.2rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', opacity: (updatingId === selectedApp.id || selectedApp.status === 'rejected') ? 0.5 : 1 }}
                    >
                      Reject
                    </button>
                    <CustomSelect
                      className={styles.customSelectDropdown}
                      style={{ width: '180px' }}
                      value={selectedApp.status}
                      disabled={updatingId === selectedApp.id}
                      onChange={(e: any) => handleStatusUpdate(selectedApp.id, e.target.value)}
                      options={statusOptions.filter(o => o !== 'all').map(o => ({
                        label: STATUS_LABELS[o] || (o.charAt(0).toUpperCase() + o.slice(1)),
                        value: o
                      }))}
                      dropUp={true}
                    />
                  </div>
                </div>
              </footer>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
