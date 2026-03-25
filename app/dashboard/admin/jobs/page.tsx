'use client';

import { useEffect, useMemo, useState } from 'react';

import styles from './jobs.module.css';

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
  type: 'Full-Time',
  location: '',
  salary_min: '',
  salary_max: '',
  currency: 'INR',
  experience_min: '',
  experience_max: '',
  department: '',
  status: 'active',
};

const typeOptions = ['Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Internship', 'Remote'];
const statusOptions = ['all', 'active', 'draft', 'paused', 'closed', 'deleted'];

function toFormState(job?: AdminJob | null): JobFormState {
  if (!job) {
    return defaultFormState;
  }

  return {
    company_id: job.company_id || '',
    title: job.title || '',
    description: job.description || '',
    requirements: (job.requirements || []).join('\n'),
    skills_required: (job.skills_required || []).join('\n'),
    type: job.type || 'Full-Time',
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
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [form, setForm] = useState<JobFormState>(defaultFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const summary = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter((job) => job.status === 'active').length,
    drafts: jobs.filter((job) => job.status === 'draft').length,
    paused: jobs.filter((job) => job.status === 'paused').length,
  }), [jobs]);

  const fetchJobs = async (currentSearch = search, currentStatus = status) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        includeMeta: 'true',
        search: currentSearch,
        status: currentStatus,
        page: '0',
        limit: '50',
      });
      const response = await fetch(`/api/admin/jobs?${params.toString()}`, { credentials: 'include' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load jobs');
      }

      setJobs(payload.jobs || []);
      setCompanies(payload.companies || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const resetForm = () => {
    setSelectedJob(null);
    setForm(defaultFormState);
    setSuccess('');
    setError('');
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchJobs(search, status);
  };

  const handleChange = (field: keyof JobFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleEdit = (job: AdminJob) => {
    setSelectedJob(job);
    setForm(toFormState(job));
    setSuccess('');
    setError('');
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      experience_min: form.experience_min ? Number(form.experience_min) : null,
      experience_max: form.experience_max ? Number(form.experience_max) : null,
    };

    try {
      const response = await fetch(selectedJob ? `/api/admin/jobs/${selectedJob.id}` : '/api/admin/jobs', {
        method: selectedJob ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save job');
      }

      setSelectedJob(null);
      setForm(defaultFormState);
      setSuccess(selectedJob ? 'Job updated successfully.' : 'Job created successfully.');
      await fetchJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (jobId: string, action: 'publish' | 'unpublish' | 'close' | 'delete') => {
    setError('');
    setSuccess('');

    const actionLabels = {
      publish: 'published',
      unpublish: 'unpublished',
      close: 'closed',
      delete: 'deleted',
    } as const;

    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || `Failed to ${action} job`);
      }

      setSuccess(`Job ${actionLabels[action]} successfully.`);
      await fetchJobs();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} job`);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Super Admin Jobs</p>
          <h1 className={styles.title}>Create, control, and publish every TalentMesh role.</h1>
          <p className={styles.subtitle}>This panel drives the live jobs visible on your public career pages and candidate search experience.</p>
        </div>
        <button className={styles.secondaryButton} onClick={resetForm}>
          New Job
        </button>
      </div>

      <div className={styles.stats}>
        <StatCard label="Total Jobs" value={summary.total} />
        <StatCard label="Active" value={summary.active} />
        <StatCard label="Drafts" value={summary.drafts} />
        <StatCard label="Paused" value={summary.paused} />
      </div>

      {(error || success) && (
        <div className={error ? styles.errorBanner : styles.successBanner}>
          {error || success}
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.listPanel}>
          <form className={styles.toolbar} onSubmit={handleSearchSubmit}>
            <input
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search jobs by title or description"
            />
            <select
              className={styles.select}
              value={status}
              onChange={(event) => {
                const nextStatus = event.target.value;
                setStatus(nextStatus);
                fetchJobs(search, nextStatus);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : option}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.primaryButton}>
              Refresh
            </button>
          </form>

          <div className={styles.listBody}>
            {loading ? (
              <div className={styles.emptyState}>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className={styles.emptyState}>No jobs match the current filters.</div>
            ) : (
              jobs.map((job) => (
                <article key={job.id} className={styles.jobCard}>
                  <div className={styles.jobCardHeader}>
                    <div>
                      <h2 className={styles.jobTitle}>{job.title}</h2>
                      <p className={styles.jobMeta}>
                        {(job.companies?.name || 'Unknown company')} · {job.location} · {job.type}
                      </p>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status_${job.status}`] || ''}`}>
                      {job.status}
                    </span>
                  </div>

                  <p className={styles.jobDescription}>{job.description}</p>

                  <div className={styles.jobFooter}>
                    <span>{job.salary}</span>
                    <span>{job.is_approved ? 'Published' : 'Not published'}</span>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.secondaryButton} onClick={() => handleEdit(job)}>
                      Edit
                    </button>
                    {job.status !== 'active' ? (
                      <button className={styles.primaryButton} onClick={() => handleAction(job.id, 'publish')}>
                        Publish
                      </button>
                    ) : (
                      <button className={styles.secondaryButton} onClick={() => handleAction(job.id, 'unpublish')}>
                        Unpublish
                      </button>
                    )}
                    <button className={styles.secondaryButton} onClick={() => handleAction(job.id, 'close')}>
                      Close
                    </button>
                    <button className={styles.deleteButton} onClick={() => handleAction(job.id, 'delete')}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2>{selectedJob ? 'Edit Job' : 'Create Job'}</h2>
            <p>{selectedJob ? 'Update the selected role and republish when ready.' : 'New jobs created here can go live immediately or stay in draft.'}</p>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <label className={styles.field}>
              <span>Company</span>
              <select
                className={styles.select}
                value={form.company_id}
                onChange={(event) => handleChange('company_id', event.target.value)}
                required
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Job Title</span>
              <input className={styles.input} value={form.title} onChange={(event) => handleChange('title', event.target.value)} required />
            </label>

            <div className={styles.twoColumn}>
              <label className={styles.field}>
                <span>Type</span>
                <select className={styles.select} value={form.type} onChange={(event) => handleChange('type', event.target.value)}>
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Status</span>
                <select className={styles.select} value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
                  {statusOptions.filter((option) => option !== 'all').map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.twoColumn}>
              <label className={styles.field}>
                <span>Location</span>
                <input className={styles.input} value={form.location} onChange={(event) => handleChange('location', event.target.value)} required />
              </label>
              <label className={styles.field}>
                <span>Department</span>
                <input className={styles.input} value={form.department} onChange={(event) => handleChange('department', event.target.value)} />
              </label>
            </div>

            <label className={styles.field}>
              <span>Description</span>
              <textarea className={styles.textarea} value={form.description} onChange={(event) => handleChange('description', event.target.value)} required />
            </label>

            <div className={styles.twoColumn}>
              <label className={styles.field}>
                <span>Requirements</span>
                <textarea className={styles.textareaSmall} value={form.requirements} onChange={(event) => handleChange('requirements', event.target.value)} placeholder="One requirement per line" />
              </label>
              <label className={styles.field}>
                <span>Skills</span>
                <textarea className={styles.textareaSmall} value={form.skills_required} onChange={(event) => handleChange('skills_required', event.target.value)} placeholder="One skill per line" />
              </label>
            </div>

            <div className={styles.threeColumn}>
              <label className={styles.field}>
                <span>Salary Min</span>
                <input className={styles.input} type="number" value={form.salary_min} onChange={(event) => handleChange('salary_min', event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Salary Max</span>
                <input className={styles.input} type="number" value={form.salary_max} onChange={(event) => handleChange('salary_max', event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Currency</span>
                <select className={styles.select} value={form.currency} onChange={(event) => handleChange('currency', event.target.value)}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>

            <div className={styles.twoColumn}>
              <label className={styles.field}>
                <span>Experience Min</span>
                <input className={styles.input} type="number" value={form.experience_min} onChange={(event) => handleChange('experience_min', event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Experience Max</span>
                <input className={styles.input} type="number" value={form.experience_max} onChange={(event) => handleChange('experience_max', event.target.value)} />
              </label>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                Clear
              </button>
              <button type="submit" className={styles.primaryButton} disabled={saving}>
                {saving ? 'Saving...' : selectedJob ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
