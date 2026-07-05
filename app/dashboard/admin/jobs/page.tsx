"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './jobs.module.css';
import { JobCard } from '@/components/jobs/JobCard';
import { AdminHeader } from '../_components/AdminHeader';
import { AdminStatCard } from '../_components/AdminStatCard';
import { AdminInput, AdminSelect, AdminButton } from '../_components/AdminForm';
import { invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { CompanyRegisterForm } from '../_components/CompanyRegisterForm';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import DetailDrawer from '@/components/dashboard/DetailDrawer';
import StatusPill from '@/components/dashboard/StatusPill';


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
  const router = useRouter();
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

  const exportJobsCSV = (data: AdminJob[]) => {
    const headers = ['Title', 'Company', 'Location', 'Type', 'Status', 'Approved', 'Salary Min', 'Salary Max', 'Currency', 'Joined Date']
    const rows = data.map(j => [
      j.title,
      (j as any).companies?.name || 'Unknown',
      j.location,
      j.type,
      j.status,
      j.is_approved ? 'Yes' : 'No',
      j.salary_min?.toString() || '',
      j.salary_max?.toString() || '',
      j.currency || 'INR',
      j.created_at ? new Date(j.created_at).toLocaleDateString('en-IN') : 'N/A'
    ])
    downloadCSV([headers, ...rows], `jobs-export-${Date.now()}.csv`)
  }
  const { user, isLoading: authLoading } = useAuth();
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
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const summary = useMemo(() => ({
    total: totalCount,
    active: jobs.filter(j => j.status === 'active').length,
    pending: jobs.filter(j => !j.is_approved).length,
  }), [jobs, totalCount]);

  const columns = useMemo<Column<AdminJob>[]>(() => [
    {
      header: (
        <input
          type="checkbox"
          checked={jobs.length > 0 && selectedIds.size === jobs.length}
          onChange={() => {
            if (selectedIds.size === jobs.length) {
              setSelectedIds(new Set());
            } else {
              setSelectedIds(new Set(jobs.map(j => j.id)));
            }
          }}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
      key: 'selection',
      width: '40px',
      render: (job) => (
        <input
          type="checkbox"
          checked={selectedIds.has(job.id)}
          onChange={() => {
            setSelectedIds(prev => {
              const next = new Set(prev);
              if (next.has(job.id)) next.delete(job.id);
              else next.add(job.id);
              return next;
            });
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
      align: 'center'
    },
    {
      header: 'Job Title',
      key: 'title',
      render: (job) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--tm-text-primary)' }}>{job.title}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--tm-text-secondary)' }}>
            {job.companies?.name || 'Unknown Company'} • {job.type}
          </span>
        </div>
      )
    },
    {
      header: 'Department',
      key: 'department',
      render: (job) => <span>{job.department || 'General'}</span>
    },
    {
      header: 'Location',
      key: 'location',
      render: (job) => <span>{job.location}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (job) => <StatusPill status={job.status as any} />
    },
    {
      header: 'Approved',
      key: 'is_approved',
      render: (job) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: job.is_approved ? '#10b981' : '#f59e0b'
          }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--tm-text-secondary)' }}>
            {job.is_approved ? 'Approved' : 'Pending'}
          </span>
        </span>
      )
    },
    {
      header: 'Date Posted',
      key: 'created_at',
      render: (job) => <span>{job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN') : '—'}</span>
    }
  ], [jobs, selectedIds]);

  const fetchJobs = useCallback(async (p = page, s = filterStatus, q = search) => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await invokeFunction('admin-jobs', {
        method: 'GET',
        queries: {
          includeMeta: 'true',
          search: q || undefined,
          status: s !== 'all' ? s : undefined,
          page: p.toString(),
          limit: '20',
        }
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
    if (user) {
      fetchJobs();
    }
  }, [fetchJobs, user]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      const { error: approveError } = await invokeFunction('admin-jobs', {
        method: 'POST',
        body: { id, action: 'approve' }
      });
      if (approveError) throw new Error(approveError.message);
      setSuccess('Job approved and is now active');
      fetchJobs();
    } catch (err) {
      setError('Failed to approve job');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      const edgeAction = action === 'delete' ? 'bulk-delete' : 'bulk-update';
      const updates = action === 'approve' ? { is_approved: true } : action === 'reject' ? { is_approved: false } : {};
      
      const { error: bulkError } = await invokeFunction('admin-jobs', {
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
    setShowJobForm(true);
  };

  const handleEdit = (job: AdminJob) => {
    setSelectedJob(job);
    setForm(toFormState(job));
    setPreviewJob(null);
    setShowJobForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Job Creation] Submission triggered');
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (!form.company_id) {
        setError('Company is required.');
        setSaving(false);
        return;
      }

      if (!form.title.trim()) {
        setError('Job Title is required.');
        setSaving(false);
        return;
      }

      if (!form.location.trim()) {
        setError('Location is required.');
        setSaving(false);
        return;
      }

      if (form.description.length < 50) {
        setError(`Description must be at least 50 characters long (Current: ${form.description.length}).`);
        setSaving(false);
        return;
      }

      const payload: any = {
        ...form,
        requirements: form.requirements.split('\n').filter(r => r.trim()),
        skills_required: form.skills_required.split('\n').filter(s => s.trim()),
      };

      if (form.salary_min) payload.salary_min = Number(form.salary_min);
      else delete payload.salary_min;

      if (form.salary_max) payload.salary_max = Number(form.salary_max);
      else delete payload.salary_max;

      if (form.experience_min) payload.experience_min = Number(form.experience_min);
      else delete payload.experience_min;

      if (form.experience_max) payload.experience_max = Number(form.experience_max);
      else delete payload.experience_max;

      console.log('[Job Creation] Payload ready:', payload);

      const { data, error: saveError } = await invokeFunction('admin-jobs', {
        method: selectedJob ? 'PATCH' : 'POST',
        body: payload,
        queries: selectedJob ? { id: selectedJob.id } : undefined
      });

      if (saveError) throw new Error(saveError.message);

      if (data) {
        console.log('[Job Creation] Success');
        setSuccess('Job successfully saved');
        resetForm();
        fetchJobs();
      }
    } catch (err: any) {
      console.error('[Job Creation] Critical error:', err);
      setError(err.message || 'An error occurred while saving the job.');
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
        title="Manage Jobs"
        eyebrow="Admin Portal"
        subtitle="Manage, approve, and delete job listings on the platform."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/admin' }, { label: 'Jobs' }]}
        actions={
          <>
            <AdminButton variant="secondary" onClick={() => router.push('/dashboard/admin/job-approvals')} style={{ position: 'relative' }}>
              Job Approvals
              {summary.pending > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  border: '2px solid white'
                }}>
                  {summary.pending}
                </span>
              )}
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => exportJobsCSV(jobs)}>Export CSV</AdminButton>
            <AdminButton onClick={() => setShowCompanyForm(true)}>+ Add Company</AdminButton>
            <AdminButton onClick={resetForm}>+ Post Job</AdminButton>
          </>
        }
      />

      <div className={styles.stats}>
        <AdminStatCard 
          label="Total Listings" 
          value={totalCount} 
          color="primary"
          onClick={() => { setFilterStatus('all'); setPage(0); }}
          isActive={filterStatus === 'all'}
        />
        <AdminStatCard 
          label="Pending Review" 
          value={summary.pending} 
          color="primary"
          onClick={() => { setFilterStatus('pending'); setPage(0); }}
          isActive={filterStatus === 'pending'}
        />
        <AdminStatCard 
          label="Active Now" 
          value={summary.active} 
          color="primary"
          onClick={() => { setFilterStatus('active'); setPage(0); }}
          isActive={filterStatus === 'active'}
        />
        <AdminStatCard 
          label="Flagged" 
          value={jobs.filter(j => j.status === 'reported').length} 
          color="primary"
          onClick={() => { setFilterStatus('reported'); setPage(0); }}
          isActive={filterStatus === 'reported'}
        />
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
            <select 
              className={styles.select} 
              style={{ width: '160px' }} 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="pending">Pending Approval</option>
            </select>
            <AdminButton onClick={() => fetchJobs(0)}>Apply</AdminButton>
          </div>

          <div className={styles.listBody} style={{ padding: 0, border: 'none', background: 'transparent' }}>
            <DataTable
              columns={columns}
              data={jobs}
              loading={authLoading || loading}
              onRowClick={(row) => setPreviewJob(row)}
              emptyState={
                <div className={styles.emptyState}>No jobs found matching the criteria.</div>
              }
            />
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page === 0} onClick={() => { setPage(page - 1); fetchJobs(page - 1); }} className={styles.pageButton}>Prev</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`${styles.pageButton} ${page === i ? styles.pageActive : ''}`}
                  onClick={() => { setPage(i); fetchJobs(i); }}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages - 1} onClick={() => { setPage(page + 1); fetchJobs(page + 1); }} className={styles.pageButton}>Next</button>
            </div>
          )}
        </div>
      </div>

      {showJobForm && (
        <div className={styles.drawerOverlay} onClick={() => setShowJobForm(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {selectedJob ? 'Edit Job' : 'Post Job'}
              </h2>
              <button className={styles.drawerClose} onClick={() => setShowJobForm(false)}>×</button>
            </div>
            <div className={styles.drawerContent}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Fill in the details below to create or edit the job listing.
              </p>

              <div>
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
              label="Company"
              options={[
                { label: 'Select a company...', value: '' },
                ...companies.map(c => ({ label: c.name, value: c.id }))
              ]}
              value={form.company_id}
              onChange={e => handleChange('company_id', e.target.value)}
            />

            <AdminInput
              label="Job Title"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g. Lead Dev-Ops Architect"
            />

            <div className={styles.twoColumn}>
              <AdminSelect
                label="Job Type"
                options={typeOptions}
                value={form.type}
                onChange={e => handleChange('type', e.target.value)}
              />
              <AdminSelect
                label="Status"
                options={statusOptions}
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
              />
            </div>

            <AdminInput
              label="Location"
              value={form.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="City, Country or 'Remote'"
            />

            <div className={styles.threeColumn}>
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

            <div className={styles.threeColumn}>
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
                <label className={styles.label}>Job Description</label>
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
                placeholder="Describe the job role, responsibilities, and details (min. 50 characters)..."
              />
              {(form.description?.length || 0) > 0 && (form.description?.length || 0) < 50 && (
                <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '4px' }}>
                  Description needs to be at least 50 characters long.
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
              <AdminButton variant="secondary" type="button" onClick={() => setShowJobForm(false)}>Cancel</AdminButton>
              <AdminButton type="submit" isLoading={saving}>
                {selectedJob ? 'Save Changes' : 'Post Job'}
              </AdminButton>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      {showCompanyForm && (
        <div className={styles.drawerOverlay} onClick={() => setShowCompanyForm(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2>Add New Company</h2>
              <button className={styles.drawerClose} onClick={() => setShowCompanyForm(false)}>×</button>
            </div>
            <div className={styles.drawerContent} style={{ padding: '2rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>
                Create a new company profile first.
              </p>
              <CompanyRegisterForm 
                onSuccess={() => {
                  setShowCompanyForm(false);
                  fetchJobs(0);
                }}
                onCancel={() => setShowCompanyForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      <DetailDrawer
        isOpen={!!previewJob}
        onClose={() => setPreviewJob(null)}
        title="Job Details"
      >
        {previewJob && (
          <div className={styles.drawerContent} style={{ padding: 0 }}>
            <JobCard job={previewJob} showActions={false} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              {!previewJob.is_approved && (
                <AdminButton style={{ flex: 1, background: '#10b981' }} onClick={() => handleApprove(previewJob.id)}>Approve & Go Live</AdminButton>
              )}
              <AdminButton style={{ flex: 1 }} onClick={() => handleEdit(previewJob)}>Edit Job</AdminButton>
              <AdminButton variant="danger" onClick={() => handleBulkAction('delete')}>Delete</AdminButton>
            </div>
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Full Description</h3>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#334155', whiteSpace: 'pre-wrap' }}>
                {previewJob.description}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Floating Bulk Action Selection Bar */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkInfo}>{selectedIds.size} jobs selected</span>
          <div className={styles.bulkButtons}>
            <AdminButton onClick={() => handleBulkAction('approve')}>Approve</AdminButton>
            <AdminButton onClick={() => handleBulkAction('reject')}>Reject</AdminButton>
            <AdminButton variant="danger" onClick={() => handleBulkAction('delete')}>Delete</AdminButton>
            <AdminButton variant="secondary" onClick={() => { setSelectedIds(new Set()); }}>Clear</AdminButton>
          </div>
        </div>
      )}
    </section>
  );
}
