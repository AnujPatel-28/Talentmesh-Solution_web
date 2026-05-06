"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './jobs.module.css';
import { JobCard } from '@/components/jobs/JobCard';
import { AdminHeader } from '../_components/AdminHeader';
import { AdminStatCard } from '../_components/AdminStatCard';
import { AdminInput, AdminSelect, AdminButton } from '../_components/AdminForm';
import { insforge } from '@/lib/insforge';

type CompanyOption = {
  id: string;
  name: string;
};

type AdminJob = {
  id: string;
  title: string;
  location: string;
  type: string;
  status: string;
  is_approved: boolean;
  salary: string;
  created_at?: string;
  description: string;
  department?: string;
  company_id?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  experience_min?: number | null;
  experience_max?: number | null;
  requirements?: string[];
  skills_required?: string[];
  companies?: {
    name?: string | null;
  };
};

type JobFormState = {
  company_id: string;
  title: string;
  description: string;
  requirements: string;
  skills_required: string;
  type: string;
  location: string;
  salary_min: string;
  salary_max: string;
  currency: string;
  experience_min: string;
  experience_max: string;
  department: string;
  status: string;
};

const defaultFormState: JobFormState = {
  company_id: '',
  title: '',
  description: '',
  requirements: '',
  skills_required: '',
  type: 'full-time',
  location: '',
  salary_min: '',
  salary_max: '',
  currency: 'INR',
  experience_min: '',
  experience_max: '',
  department: '',
  status: 'active',
};

const typeOptions = [
  { label: 'Full-Time', value: 'full-time' },
  { label: 'Part-Time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Internship', value: 'internship' },
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' }
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' },
  { label: 'Reported', value: 'reported' }
];

function toFormState(job?: AdminJob | null): JobFormState {
  if (!job) return defaultFormState;
  return {
    company_id: job.company_id || '',
    title: job.title || '',
    description: job.description || '',
    requirements: (job.requirements || []).join('\n'),
    skills_required: (job.skills_required || []).join('\n'),
    type: (job.type || 'full-time').toLowerCase(),
    location: job.location || '',
    salary_min: job.salary_min?.toString() || '',
    salary_max: job.salary_max?.toString() || '',
    currency: job.currency || 'INR',
    experience_min: job.experience_min?.toString() || '',
    experience_max: job.experience_max?.toString() || '',
    department: job.department || '',
    status: job.status || 'active',
  };
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [previewJob, setPreviewJob] = useState<AdminJob | null>(null);
  const [form, setForm] = useState<JobFormState>(defaultFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const summary = useMemo(() => ({
    total: totalCount,
    active: jobs.filter(j => j.status === 'active').length,
    pending: jobs.filter(j => !j.is_approved).length,
  }), [jobs, totalCount]);

  const fetchJobs = useCallback(async (p = page, s = filterStatus, q = search) => {
    setLoading(true);
    try {
      const cleanParams = Object.fromEntries(
        Object.entries({
          includeMeta: 'true',
          search: q || undefined,
          status: s !== 'all' ? s : undefined,
          page: p.toString(),
          limit: '20',
        }).filter(([_, v]) => v !== undefined && v !== null)
      );
      const queryStr = new URLSearchParams(cleanParams as any).toString();
      const slug = queryStr ? `admin-jobs?${queryStr}` : 'admin-jobs';

      const { data, error: fetchError } = await insforge.functions.invoke(slug, {
        method: 'GET'
      });

      if (fetchError) throw new Error(fetchError.message);

      if (data) {
        setJobs(data.items || []);
        setTotalCount(data.total);
        setTotalPages(Math.ceil(data.total / 20));
        if (data.companies) setCompanies(data.companies);
      }
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      const edgeAction = action === 'delete' ? 'bulk-delete' : 'bulk-update';
      const updates = action === 'approve' ? { is_approved: true } : action === 'reject' ? { is_approved: false } : {};
      
      const { error: bulkError } = await insforge.functions.invoke('admin-jobs', {
        method: 'POST',
        body: { ids: Array.from(selectedIds), action: edgeAction, updates }
      });
      
      if (bulkError) throw new Error(bulkError.message);

      setSuccess(`Successfully ${action}d ${selectedIds.size} jobs`);
      setSelectedIds(new Set());
      fetchJobs();
    } catch (err) {
      setError('Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedJob(null);
    setForm(defaultFormState);
    setSuccess('');
    setError('');
  };

  const handleEdit = (job: AdminJob) => {
    setSelectedJob(job);
    setForm(toFormState(job));
    setPreviewJob(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Job Creation] Submission triggered');
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // 1. Client-side Pre-flight Validation
      if (!form.company_id) {
        setError('Hiring Portfolio (Company) is mandatory for platform injection.');
        setSaving(false);
        return;
      }

      if (!form.title.trim()) {
        setError('Professional Title is required.');
        setSaving(false);
        return;
      }

      if (!form.location.trim()) {
        setError('Geographical Cluster (Location) is required.');
        setSaving(false);
        return;
      }

      if (form.description.length < 50) {
        setError(`Insufficient Briefing: Description must be at least 50 characters (Current: ${form.description.length}).`);
        setSaving(false);
        return;
      }

      const payload: any = {
        ...form,
        requirements: form.requirements.split('\n').filter(r => r.trim()),
        skills_required: form.skills_required.split('\n').filter(s => s.trim()),
      };

      // Clean up optional numerical fields: only include if they have a value
      if (form.salary_min) payload.salary_min = Number(form.salary_min);
      else delete payload.salary_min;

      if (form.salary_max) payload.salary_max = Number(form.salary_max);
      else delete payload.salary_max;

      if (form.experience_min) payload.experience_min = Number(form.experience_min);
      else delete payload.experience_min;

      if (form.experience_max) payload.experience_max = Number(form.experience_max);
      else delete payload.experience_max;

      console.log('[Job Creation] Payload ready:', payload);

      const slug = selectedJob ? `admin-jobs/${selectedJob.id}` : 'admin-jobs';
      const { data, error: saveError } = await insforge.functions.invoke(slug, {
        method: selectedJob ? 'PATCH' : 'POST',
        body: payload
      });

      if (saveError) throw new Error(saveError.message);

      if (data) {
        console.log('[Job Creation] Success');
        setSuccess('Job successfully injected into the ecosystem');
        resetForm();
        fetchJobs();
      }
    } catch (err: any) {
      console.error('[Job Creation] Critical error:', err);
      setError(err.message || 'A critical connectivity error occurred during injection.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof JobFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section className={styles.page}>
      <AdminHeader
        title="Jobs Registry"
        eyebrow="TalentMesh Cloud Platform"
        subtitle="Manage, moderate, and deploy employment opportunities across the global ecosystem."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/admin' }, { label: 'Jobs' }]}
        actions={
          <>
            <AdminButton variant="secondary" onClick={() => { }}>Export Data</AdminButton>
            <AdminButton onClick={resetForm}>Create Live Role</AdminButton>
          </>
        }
      />

      <div className={styles.stats}>
        <AdminStatCard label="Total Listings" value={totalCount} color="indigo" />
        <AdminStatCard label="Pending Review" value={summary.pending} color="amber" />
        <AdminStatCard label="Active Now" value={summary.active} color="emerald" />
        <AdminStatCard label="Flagged" value={jobs.filter(j => j.status === 'reported').length} color="rose" />
      </div>

      <div className={styles.grid}>
        <div className={styles.listPanel}>
          <div className={styles.toolbar}>
            <div className={styles.searchContainer} style={{ flex: 1 }}>
              <input
                className={styles.searchInput}
                placeholder="Search by title, location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchJobs(0)}
              />
            </div>
            <select className={styles.select} style={{ width: '160px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <AdminButton onClick={() => fetchJobs(0)}>Apply</AdminButton>
          </div>

          <div className={styles.listBody}>
            {loading ? <div className={styles.emptyState}>Syncing registry...</div> :
              jobs.length === 0 ? <div className={styles.emptyState}>No roles match your search.</div> : (
                jobs.map(job => (
                  <article key={job.id}
                    className={`${styles.jobCard} ${previewJob?.id === job.id ? styles.cardActive : ''}`}
                    onClick={() => setPreviewJob(job)}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div
                        onClick={(e) => toggleSelect(job.id, e)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: '2px solid #cbd5e1',
                          backgroundColor: selectedIds.has(job.id) ? '#2563eb' : 'transparent',
                          borderColor: selectedIds.has(job.id) ? '#2563eb' : '#cbd5e1',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {selectedIds.has(job.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={styles.jobCardHeader}>
                          <h2 className={styles.jobTitle}>{job.title}</h2>
                          <span className={`${styles.statusBadge} ${styles[`status_${job.status}`]}`}>
                            {job.status}
                          </span>
                        </div>
                        <p className={styles.jobMeta}>{(job as any).companies?.name} • {job.location} • {job.type}</p>
                      </div>
                    </div>
                  </article>
                ))
              )}
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              {selectedJob ? 'Refine Listing' : 'Platform Injection'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Directly curate global employment data points.
            </p>
          </div>

          <div style={{ padding: '0 1.1rem' }}>
            {error && (
              <div className={styles.errorBanner} style={{ marginTop: '1rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div className={styles.successBanner} style={{ marginTop: '1rem' }}>
                {success}
              </div>
            )}
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <AdminSelect
              label="Hiring Portfolio (Company)"
              options={[
                { label: 'Select a company...', value: '' },
                ...companies.map(c => ({ label: c.name, value: c.id }))
              ]}
              value={form.company_id}
              onChange={e => handleChange('company_id', e.target.value)}
            />

            <AdminInput
              label="Professional Title"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g. Lead Dev-Ops Architect"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <AdminSelect
                label="Contract Modality"
                options={typeOptions}
                value={form.type}
                onChange={e => handleChange('type', e.target.value)}
              />
              <AdminSelect
                label="System Status"
                options={statusOptions}
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
              />
            </div>

            <AdminInput
              label="Geographical Cluster"
              value={form.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="City, Country or 'Remote'"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <AdminInput
                label="Salary Min"
                type="number"
                value={form.salary_min}
                onChange={e => handleChange('salary_min', e.target.value)}
                placeholder="e.g. 800000"
              />
              <AdminInput
                label="Salary Max"
                type="number"
                value={form.salary_max}
                onChange={e => handleChange('salary_max', e.target.value)}
                placeholder="e.g. 1200000"
              />
              <AdminSelect
                label="Currency"
                options={[{ label: 'INR', value: 'INR' }, { label: 'USD', value: 'USD' }]}
                value={form.currency}
                onChange={e => handleChange('currency', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <AdminInput
                label="Exp Min (Years)"
                type="number"
                value={form.experience_min}
                onChange={e => handleChange('experience_min', e.target.value)}
                placeholder="0"
              />
              <AdminInput
                label="Exp Max (Years)"
                type="number"
                value={form.experience_max}
                onChange={e => handleChange('experience_max', e.target.value)}
                placeholder="5"
              />
              <AdminInput
                label="Department"
                value={form.department}
                onChange={e => handleChange('department', e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>

            <div className={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className={styles.label}>Detailed Briefing</label>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  color: (form.description?.length || 0) < 50 ? '#ef4444' : '#10b981' 
                }}>
                  {form.description?.length || 0} / 50 characters min
                </span>
              </div>
              <textarea
                className={styles.textarea}
                style={{ 
                  minHeight: '160px',
                  borderColor: (form.description?.length || 0) > 0 && (form.description?.length || 0) < 50 ? '#ef4444' : ''
                }}
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Describe the role, impact, and ecosystem context (min. 50 characters)..."
              />
              {(form.description?.length || 0) > 0 && (form.description?.length || 0) < 50 && (
                <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '4px' }}>
                  Brief needs at least 50 characters to satisfy platform standards.
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Requirements (one per line)</label>
              <textarea
                className={styles.textareaSmall}
                value={form.requirements}
                onChange={e => handleChange('requirements', e.target.value)}
                placeholder="e.g. 5+ years experience in Node.js"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Required Skills (one per line)</label>
              <textarea
                className={styles.textareaSmall}
                value={form.skills_required}
                onChange={e => handleChange('skills_required', e.target.value)}
                placeholder="e.g. TypeScript, AWS, Redis"
              />
            </div>

            <div className={styles.formActions} style={{ marginTop: '24px' }}>
              <AdminButton variant="secondary" type="button" onClick={resetForm}>Reset</AdminButton>
              <AdminButton type="submit" isLoading={saving}>
                {selectedJob ? 'Update Ecosystem' : 'Inject Listing'}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>

      {previewJob && (
        <div className={styles.drawerOverlay} onClick={() => setPreviewJob(null)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Role Intelligence</h2>
              <button className={styles.drawerClose} onClick={() => setPreviewJob(null)}>×</button>
            </div>
            <div className={styles.drawerContent}>
              <JobCard job={previewJob} showActions={false} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <AdminButton style={{ flex: 1 }} onClick={() => handleEdit(previewJob)}>Moderate Listing</AdminButton>
                <AdminButton variant="danger" onClick={() => handleBulkAction('delete')}>Purge</AdminButton>
              </div>
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Full Description</h3>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#334155', whiteSpace: 'pre-wrap' }}>
                  {previewJob.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
