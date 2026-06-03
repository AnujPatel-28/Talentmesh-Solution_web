'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './candidates.module.css';
import { invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';


type CandidateProfile = {
  headline?: string;
  skills?: string[];
  experience_years?: number | null;
  education?: string;
  resume_url?: string;
  profile_strength?: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
};

type AdminCandidate = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  is_active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  candidate_profiles: CandidateProfile | CandidateProfile[];
};

export default function AdminCandidatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Detail view
  const [previewUser, setPreviewUser] = useState<AdminCandidate | null>(null);

  const fetchCandidates = useCallback(async (p = page, q = search) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await invokeFunction('admin-candidates', {
        method: 'GET',
        queries: {
          search: q || undefined,
          page: p.toString(),
          limit: '20'
        }
      });

      
      if (fetchError) throw new Error(fetchError.message);
      
      if (data) {
        setCandidates(data.candidates || []);
        setTotalCount(data.total);
        setTotalPages(Math.ceil(data.total / 20));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (user) {
      fetchCandidates();
    }
  }, [fetchCandidates, user]);

  const updateCandidate = async (user: AdminCandidate, payload: Partial<AdminCandidate>) => {
    try {
      const { data, error: updateError } = await invokeFunction('admin-candidates', {
        method: 'PATCH',
        path: `/${user.id}`,
        body: payload
      });

      
      if (updateError) throw new Error(updateError.message);

      if (data) {
        fetchCandidates();
        if (previewUser?.id === user.id) {
          setPreviewUser({ ...user, ...payload });
        }
      }
    } catch (err) {
      setError('Failed to update candidate');
    }
  };

  const toggleStatus = async (user: AdminCandidate) => {
    await updateCandidate(user, { is_active: !user.is_active });
  };

  const setApprovalStatus = async (user: AdminCandidate, status: 'approved' | 'rejected') => {
    await updateCandidate(user, { status });
  };



  const getProfile = (candidate: AdminCandidate): CandidateProfile | null => {
    if (!candidate.candidate_profiles) return null;
    if (Array.isArray(candidate.candidate_profiles)) {
      return candidate.candidate_profiles[0] || null;
    }
    return candidate.candidate_profiles;
  };

  const currentProfile = previewUser ? getProfile(previewUser) : null;

  // CSV Export Utility
  const downloadCSV = (rows: string[][], filename: string) => {
    const csv = rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCandidatesCSV = (data: AdminCandidate[]) => {
    const headers = ['Name', 'Email', 'Location', 'Headline', 'Skills', 'Status', 'Active', 'Joined Date']
    const rows = data.map(c => {
      const p = getProfile(c)
      return [
        c.name || 'Anonymous',
        c.email,
        c.location || 'Remote',
        p?.headline || '',
        (p?.skills || []).join('; '),
        c.status,
        c.is_active ? 'Yes' : 'No',
        new Date(c.created_at).toLocaleDateString('en-IN')
      ]
    })
    downloadCSV([headers, ...rows], `candidates-export-${Date.now()}.csv`)
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Candidate Registry</p>
          <h1 className={styles.title}>Global Talent Index</h1>
          <p className={styles.subtitle}>Audit, verify, and moderate professional profiles across the platform.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ fontSize: '1.5rem', display: 'block' }}>{totalCount}</strong>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified Candidates</span>
        </div>
      </header>

      <div className={styles.toolbarRow}>
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <form className={styles.toolbar} onSubmit={e => { e.preventDefault(); setPage(0); fetchCandidates(0); }}>
            <input
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by name, email or keyword..."
            />
            <button type="submit" className={styles.primaryButton}>Search</button>
          </form>
          <button onClick={() => exportCandidatesCSV(candidates)} className={styles.exportBtn}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.grid}>
        {(authLoading || loading) ? (
          <div className={styles.emptyState}>Syncing registry...</div>
        ) : candidates.length === 0 ? (
          <div className={styles.emptyState}>No candidates matched your criteria.</div>
        ) : (
          candidates.map((candidate) => {
            const profile = getProfile(candidate);
            return (
              <article key={candidate.id} className={styles.candidateCard} onClick={() => setPreviewUser(candidate)}>
                <div className={styles.cardHeader}>
                  <div className={styles.initials}>{candidate.name ? candidate.name.charAt(0).toUpperCase() : '?'}</div>
                  <div className={styles.mainInfo}>
                    <h3 className={styles.name}>{candidate.name || 'Anonymous user'}</h3>
                    <p className={styles.email}>{candidate.email}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div className={styles.strengthBadge}>
                      {profile?.profile_strength || 0}%
                    </div>
                    {candidate.status === 'pending' && (
                       <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '100px', border: '1px solid #ffedd5' }}>Pending</span>
                    )}
                  </div>
                </div>

                <div className={styles.body}>
                  <p className={styles.headline}>{profile?.headline || 'Profile incomplete'}</p>
                  <div className={styles.meta}>
                    <span>📍 {candidate.location || 'Remote'}</span>
                    <span>💼 {profile?.experience_years ? `${profile.experience_years}y` : 'Entry'}</span>
                  </div>
                </div>

                <div className={styles.footer}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`${styles.statusDot} ${candidate.is_active ? styles.dotActive : ''}`} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                      {candidate.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>

                    <button className={styles.actionBtn}>Open Profile →</button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className={styles.pageButton}>Prev</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} className={`${styles.pageButton} ${page === i ? styles.pageActive : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button disabled={page === totalPages - 1} onClick={() => setPage(page + 1)} className={styles.pageButton}>Next</button>
        </div>
      )}

      {previewUser && (
        <div className={styles.drawerOverlay} onClick={() => setPreviewUser(null)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h2>Candidate Insight</h2>
              <button className={styles.drawerClose} onClick={() => setPreviewUser(null)}>×</button>
            </header>
            
            <div className={styles.drawerContent}>
              <div className={styles.statusToggle} style={{ display: 'grid', gap: '0.75rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                <div>
                  <strong>Account Access</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    {previewUser.is_active ? 'Candidate can apply and browse jobs.' : 'Candidate access is currently restricted.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => toggleStatus(previewUser)}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      background: previewUser.is_active ? '#fee2e2' : '#dcfce7',
                      color: previewUser.is_active ? '#991b1b' : '#166534',
                      border: '1px solid',
                      borderColor: previewUser.is_active ? '#fca5a5' : '#86efac',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {previewUser.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Are you absolutely sure you want to PERMANENTLY delete candidate ${previewUser.name}?\n\nThis will delete their auth account and all database records, and cannot be undone.`)) {
                        try {
                          const { error: delError } = await invokeFunction('admin-candidates', {
                            method: 'DELETE',
                            queries: { id: previewUser.id }
                          });
                          if (delError) throw new Error(delError.message);
                          alert('Candidate deleted successfully');
                          setPreviewUser(null);
                          fetchCandidates();
                        } catch (err: any) {
                          alert('Failed to delete candidate: ' + err.message);
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    🗑️ Permanent Delete
                  </button>
                </div>
              </div>

              <section className={styles.profileSection}>
                <h4>Professional Identity</h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className={styles.initials} style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                    {previewUser.name[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{previewUser.name}</h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>{previewUser.email}</p>
                  </div>
                </div>
              </section>

              <section className={styles.profileSection}>
                <h4>Career Summary</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#334155' }}>
                  {currentProfile?.headline || 'No summary provided.'}
                </p>
                <div className={styles.meta} style={{ marginTop: '1rem' }}>
                  <span>📍 {previewUser.location || 'Not specified'}</span>
                  <span>💼 {currentProfile?.experience_years || '0'} years of experience</span>
                </div>
              </section>

              {currentProfile?.skills && currentProfile.skills.length > 0 && (
                <section className={styles.profileSection}>
                  <h4>Verified Skills</h4>
                  <div className={styles.skills}>
                    {currentProfile.skills.map((s, i) => (
                      <span key={i} className={styles.skillTag}>{s}</span>
                    ))}
                  </div>
                </section>
              )}

              <section className={styles.profileSection}>
                <h4>Resources & Presence</h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {currentProfile?.resume_url && (
                    <a href={currentProfile.resume_url} target="_blank" className={styles.primaryButton} style={{ textAlign: 'center', textDecoration: 'none' }}>
                      📄 Download/View Resume
                    </a>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {currentProfile?.linkedin_url && (
                      <a href={currentProfile.linkedin_url} target="_blank" className={styles.pageButton} style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>LinkedIn</a>
                    )}
                    {currentProfile?.github_url && (
                      <a href={currentProfile.github_url} target="_blank" className={styles.pageButton} style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>GitHub</a>
                    )}
                  </div>
                </div>
              </section>

              <section className={styles.profileSection} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginTop: 'auto' }}>
                <h4>Approval Workflow</h4>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className={styles.primaryButton} 
                    style={{ flex: 1, background: previewUser.status === 'approved' ? '#f0fdf4' : '#10b981', color: previewUser.status === 'approved' ? '#166534' : 'white', border: previewUser.status === 'approved' ? '1px solid #bbf7d0' : 'none' }}
                    onClick={() => setApprovalStatus(previewUser, 'approved')}
                  >
                    {previewUser.status === 'approved' ? '✅ Approved' : 'Accept Candidate'}
                  </button>
                  <button 
                    className={styles.pageButton} 
                    style={{ flex: 1, color: previewUser.status === 'rejected' ? '#dc2626' : '#64748b', borderColor: previewUser.status === 'rejected' ? '#fecaca' : '#e2e8f0', background: previewUser.status === 'rejected' ? '#fef2f2' : 'white' }}
                    onClick={() => setApprovalStatus(previewUser, 'rejected')}
                  >
                    {previewUser.status === 'rejected' ? '❌ Rejected' : 'Reject'}
                  </button>
                </div>
                {previewUser.status === 'pending' && (
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.75rem', textAlign: 'center' }}>
                    Candidate is awaiting initial profile review.
                  </p>
                )}

              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
