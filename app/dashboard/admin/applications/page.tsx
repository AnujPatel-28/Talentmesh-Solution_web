'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './applications.module.css';

type AdminApplication = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  applied_at: string;
  updated_at: string;
  cover_letter?: string;
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
    candidate_profiles?: Array<{
      headline?: string;
      experience_years?: number;
      skills?: string[];
      resume_url?: string;
    }>;
  };
};

const statusOptions = [
  'all',
  'applied',
  'reviewing',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
];

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Detail View
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchApplications = useCallback(async (currentStatus = status, p = page, q = search) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        status: currentStatus,
        search: q,
        page: p.toString(),
        limit: '20',
      });
      const res = await fetch(`/api/admin/applications?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications || []);
        // Assuming the API might be updated to return total soon, for now we list
        setTotal(data.applications?.length || 0); 
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
    setUpdatingId(appId);
    try {
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: nextStatus } : a));
        if (selectedApp?.id === appId) setSelectedApp({ ...selectedApp, status: nextStatus });
      }
    } catch (err) {
      setError('Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Platform Pipeline</p>
        <h1 className={styles.title}>Global Application Registry</h1>
        <p className={styles.subtitle}>Audit every professional interaction, from initial intent to final placement.</p>
      </header>

      <div className={styles.toolbarRow}>
        <div className={styles.toolbar}>
          <input 
            className={styles.select} 
            style={{ flex: 1, backgroundImage: 'none', paddingRight: '1rem' }} 
            placeholder="Search candidate, job, or company..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchApplications()}
          />
          <select className={styles.select} value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}>
            {statusOptions.map(o => <option key={o} value={o}>{o === 'all' ? 'All Stages' : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
          <button className={styles.primaryButton} onClick={() => fetchApplications()}>Sync Hub</button>
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
                <th>Candidate Profile</th>
                <th>Target Role</th>
                <th>Hiring Company</th>
                <th>Submission Date</th>
                <th>Stage</th>
                <th>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className={styles.candidateCell}>
                      <strong>{app.profiles?.name}</strong>
                      <span>{app.profiles?.email}</span>
                    </div>
                  </td>
                  <td><button className={styles.viewBtn} onClick={() => setSelectedApp(app)}>{app.jobs?.title}</button></td>
                  <td>{app.jobs?.companies?.name}</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[`status_${app.status}`]}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className={styles.statusSelect}
                      value={app.status}
                      disabled={updatingId === app.id}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                    >
                      {statusOptions.filter(o => o !== 'all').map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedApp && (
        <div className={styles.modalOverlay} onClick={() => setSelectedApp(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h2>Application Audit</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedApp(null)}>×</button>
            </header>
            
            <div className={styles.modalContent}>
              <div className={styles.detailGrid}>
                <div>
                  <span className={styles.sectionTitle}>Candidate Profile</span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', background: '#3b82f6', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {selectedApp.profiles.name[0]}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{selectedApp.profiles.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{selectedApp.profiles.email}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <span className={styles.sectionTitle}>Application Summary</span>
                  <div style={{ fontSize: '0.875rem' }}>
                    <div><strong>Job:</strong> {selectedApp.jobs.title}</div>
                    <div><strong>Company:</strong> {selectedApp.jobs.companies.name}</div>
                    <div><strong>Applied:</strong> {new Date(selectedApp.applied_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <span className={styles.sectionTitle}>Cover Letter / Statement</span>
                <div className={styles.coverLetterBox}>
                  {selectedApp.cover_letter || 'No cover letter provided for this application.'}
                </div>
              </div>

              {selectedApp.profiles.candidate_profiles?.[0]?.resume_url && (
                <div>
                  <span className={styles.sectionTitle}>Required Assets</span>
                  <a 
                    href={selectedApp.profiles.candidate_profiles[0].resume_url} 
                    target="_blank" 
                    className={styles.primaryButton}
                    style={{ display: 'inline-block', textDecoration: 'none' }}
                  >
                    📄 Review Candidate Resume
                  </a>
                </div>
              )}
            </div>

            <footer className={styles.modalFooter}>
              <button className={styles.closeBtn} style={{ fontSize: '0.875rem', fontWeight: 700 }} onClick={() => setSelectedApp(null)}>Dismiss</button>
              <select
                className={styles.statusSelect}
                style={{ padding: '0.6rem 1rem' }}
                value={selectedApp.status}
                onChange={(e) => handleStatusUpdate(selectedApp.id, e.target.value)}
              >
                {statusOptions.filter(o => o !== 'all').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
