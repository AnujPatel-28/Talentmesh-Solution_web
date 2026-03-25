'use client';

import { useEffect, useMemo, useState } from 'react';
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
    title: string;
    companies: {
      name: string;
    };
  };
  profiles: {
    name: string;
    email: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = async (currentStatus = status) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        status: currentStatus,
        page: '0',
        limit: '50',
      });
      const response = await fetch(`/api/admin/applications?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load applications');
      }

      setApplications(payload.applications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (applicationId: string, nextStatus: string) => {
    setUpdatingId(applicationId);
    setError('');

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to update status');
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: nextStatus } : app
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Super Admin Applications</p>
          <h1 className={styles.title}>Track every TalentMesh application from applied to hired.</h1>
          <p className={styles.subtitle}>Review candidate interest, update statuses, and manage the hiring pipeline.</p>
        </div>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.toolbar}>
          <select
            className={styles.select}
            value={status}
            onChange={(event) => {
              const nextStatus = event.target.value;
              setStatus(nextStatus);
              fetchApplications(nextStatus);
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'all' ? 'All statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
          <button onClick={() => fetchApplications()} className={styles.primaryButton}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.list}>
        {loading ? (
          <div className={styles.emptyState}>Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className={styles.emptyState}>No applications found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job Title</th>
                <th>Company</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className={styles.candidateCell}>
                      <strong>{app.profiles?.name || 'Anonymous'}</strong>
                      <span>{app.profiles?.email}</span>
                    </div>
                  </td>
                  <td>{app.jobs?.title}</td>
                  <td>{app.jobs?.companies?.name}</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[`status_${app.status}`] || ''}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className={styles.statusSelect}
                      value={app.status}
                      disabled={updatingId === app.id}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    >
                      {statusOptions.filter(o => o !== 'all').map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
