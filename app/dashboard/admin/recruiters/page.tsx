'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from '../candidates/candidates.module.css'; // Reusing established styles
import { insforge } from '@/lib/insforge';

type RecruiterProfile = {
  id: string;
  company_name: string;
  industry?: string;
  company_size?: string;
  is_approved: boolean;
  website_url?: string;
  linkedin_url?: string;
  about?: string;
};

type AdminRecruiter = {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  recruiter_profiles: RecruiterProfile | RecruiterProfile[];
};

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<AdminRecruiter[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [previewUser, setPreviewUser] = useState<AdminRecruiter | null>(null);

  const fetchRecruiters = useCallback(async (p = page, q = search, s = statusFilter) => {
    setLoading(true);
    try {
      const cleanParams = Object.fromEntries(
        Object.entries({
          search: q || undefined,
          status: s !== 'all' ? s : undefined,
          page: p.toString(),
          limit: '20'
        }).filter(([_, v]) => v !== undefined && v !== null)
      );
      const queryStr = new URLSearchParams(cleanParams as any).toString();
      const slug = queryStr ? `admin-recruiters?${queryStr}` : 'admin-recruiters';

      const { data, error: fetchError } = await insforge.functions.invoke(slug, {
        method: 'GET'
      });
      
      if (fetchError) throw new Error(fetchError.message);
      
      if (data) {
        setRecruiters(data.recruiters || []);
        setTotalCount(data.total);
        setTotalPages(Math.ceil(data.total / 20));
      }
    } catch (err: any) {
      setError('Failed to load recruiters registry');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchRecruiters();
  }, [fetchRecruiters]);

  const toggleStatus = async (user: AdminRecruiter) => {
    try {
      const { data, error: updateError } = await insforge.functions.invoke(`admin-recruiters/${user.id}`, {
        method: 'PATCH',
        body: { is_active: !user.is_active }
      });
      
      if (updateError) throw new Error(updateError.message);

      if (data) {
        fetchRecruiters();
        if (previewUser?.id === user.id) {
          setPreviewUser({ ...user, is_active: !user.is_active });
        }
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const approveRecruiter = async (profileId: string) => {
    try {
      // In the edge function, we can handle approval by updating the profile
      // Actually, my admin-recruiters edge function updates recruiter_profiles table if I passed the profile ID, 
      // but it currently targets recruiter_profiles (based on my index.ts write).
      // Let's check index.ts for admin-recruiters.
      
      const { data, error: updateError } = await insforge.functions.invoke(`admin-recruiters/${profileId}`, {
        method: 'PATCH',
        body: { is_approved: true }
      });
      
      if (updateError) throw new Error(updateError.message);

      if (data) {
        fetchRecruiters();
        setPreviewUser(null);
      }
    } catch (err) {
      setError('Approval failed');
    }
  };

  const getProfile = (recruiter: AdminRecruiter): RecruiterProfile | null => {
    if (!recruiter.recruiter_profiles) return null;
    if (Array.isArray(recruiter.recruiter_profiles)) {
      return recruiter.recruiter_profiles[0] || null;
    }
    return recruiter.recruiter_profiles;
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Employer Management</p>
          <h1 className={styles.title}>Recruiter Index</h1>
          <p className={styles.subtitle}>Audit company profiles, verify hiring credentials, and manage platform access.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ fontSize: '1.5rem', display: 'block' }}>{totalCount}</strong>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Registered Employers</span>
        </div>
      </header>

      <div className={styles.toolbarRow}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <form className={styles.toolbar} style={{ flex: 1 }} onSubmit={e => { e.preventDefault(); setPage(0); fetchRecruiters(0); }}>
            <input
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, company, or email..."
            />
            <button type="submit" className={styles.primaryButton}>Search</button>
          </form>
          <select 
            className={styles.searchInput} 
            style={{ width: '200px' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="all">All Recruiters</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.emptyState}>Syncing registry...</div>
        ) : recruiters.length === 0 ? (
          <div className={styles.emptyState}>No recruiters found.</div>
        ) : (
          recruiters.map((recruiter) => {
            const profile = getProfile(recruiter);
            return (
              <article key={recruiter.id} className={styles.candidateCard} onClick={() => setPreviewUser(recruiter)}>
                <div className={styles.cardHeader}>
                  <div className={styles.initials} style={{ background: '#f59e0b', color: 'white' }}>
                    {recruiter.name ? recruiter.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className={styles.mainInfo}>
                    <h3 className={styles.name}>{recruiter.name}</h3>
                    <p className={styles.email}>{recruiter.email}</p>
                  </div>
                  {!profile?.is_approved && (
                    <div className={styles.strengthBadge} style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                      Pending
                    </div>
                  )}
                </div>

                <div className={styles.body}>
                  <p className={styles.headline}><strong>{profile?.company_name || 'Individual Recruiter'}</strong></p>
                  <div className={styles.meta}>
                    <span>🌐 {profile?.industry || 'Unspecified Industry'}</span>
                    <span>👥 {profile?.company_size || 'N/A'} employees</span>
                  </div>
                </div>

                <div className={styles.footer}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`${styles.statusDot} ${recruiter.is_active ? styles.dotActive : ''}`} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                      {recruiter.is_active ? 'Active Account' : 'Suspended'}
                    </span>
                  </div>
                  <button className={styles.actionBtn}>Audit Profile →</button>
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
              <h2>Recruiter Audit</h2>
              <button className={styles.drawerClose} onClick={() => setPreviewUser(null)}>×</button>
            </header>
            
            <div className={styles.drawerContent}>
              <div className={styles.statusToggle}>
                <div className={styles.statusLabel}>
                  <strong>Account Authorization</strong>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    {previewUser.is_active ? 'Recruiter can post jobs and review talent.' : 'Recruiter dashboard access is disabled.'}
                  </p>
                </div>
                <div 
                  className={`${styles.toggleSwitch} ${previewUser.is_active ? styles.toggleActive : ''}`}
                  onClick={() => toggleStatus(previewUser)}
                >
                  <div className={styles.toggleKnob} />
                </div>
              </div>

              <section className={styles.profileSection}>
                <h4>Company Info</h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className={styles.initials} style={{ width: '64px', height: '64px', fontSize: '1.5rem', background: '#f59e0b', color: 'white' }}>
                    {getProfile(previewUser)?.company_name[0] || 'C'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{getProfile(previewUser)?.company_name}</h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>{getProfile(previewUser)?.industry} · {getProfile(previewUser)?.company_size} Employees</p>
                  </div>
                </div>
              </section>

              <section className={styles.profileSection}>
                <h4>About Company</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#334155' }}>
                  {getProfile(previewUser)?.about || 'No company description provided.'}
                </p>
              </section>

              <section className={styles.profileSection}>
                <h4>Contact Details</h4>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div><strong>Name:</strong> {previewUser.name}</div>
                  <div><strong>Email:</strong> {previewUser.email}</div>
                  {getProfile(previewUser)?.website_url && (
                    <div><strong>Website:</strong> <a href={getProfile(previewUser)?.website_url} target="_blank" style={{ color: '#3b82f6' }}>{getProfile(previewUser)?.website_url}</a></div>
                  )}
                </div>
              </section>

              {!getProfile(previewUser)?.is_approved && (
                <div style={{ marginTop: 'auto', padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#92400e' }}>
                    This recruiter is pending verification. Once approved, they can start posting jobs.
                  </p>
                  <button 
                    className={styles.primaryButton} 
                    style={{ width: '100%', background: '#d97706' }}
                    onClick={() => approveRecruiter(getProfile(previewUser)!.id)}
                  >
                    Verify & Approve Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
