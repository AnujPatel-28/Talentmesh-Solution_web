import { getAuthenticatedSession } from '@/lib/auth/server-auth';
import { insforgeAdmin } from '@/lib/insforge-admin';

import type { ApplicationStatusValue, CreateApplicationInput } from '@/lib/validation/applications';

export type CandidateApplicationRecord = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatusValue;
  cover_letter?: string | null;
  applied_at: string;
  updated_at: string;
  jobs: {
    title: string;
    location: string;
    type: string;
    salary_min: number | null;
    salary_max: number | null;
    currency: string;
    companies: {
      name: string;
      logo_url: string | null;
    };
  };
};

function requireAdminClient() {
  if (!insforgeAdmin) {
    throw new Error('Admin client not initialized');
  }

  return insforgeAdmin;
}

async function requireCandidateSession() {
  const session = await getAuthenticatedSession();
  if (!session?.user) {
    throw new Error('You must be logged in to continue.');
  }

  if (session.isAdmin || session.user.role === 'recruiter') {
    throw new Error('Only candidates can perform this action.');
  }

  return session;
}

export async function listCandidateApplications() {
  const session = await requireCandidateSession();
  const client = requireAdminClient();

  const { data, error } = await client.database
    .from('applications')
    .select('id, job_id, candidate_id, status, cover_letter, applied_at, updated_at, jobs(title, location, type, salary_min, salary_max, currency, companies(name, logo_url))')
    .eq('candidate_id', session.user.id)
    .order('applied_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  // Handle Supabase's return of singular joins as arrays
  const mapped = (data || []).map((app: any) => {
    const rawJob = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
    const mappedJob = rawJob ? {
        ...rawJob,
        companies: Array.isArray(rawJob.companies) ? rawJob.companies[0] : rawJob.companies
    } : null;

    return {
      ...app,
      jobs: mappedJob,
    };
  });

  return mapped as unknown as CandidateApplicationRecord[];
}

export async function getCandidateApplicationStatus(jobId: string) {
  const session = await requireCandidateSession();
  const client = requireAdminClient();

  const { data, error } = await client.database
    .from('applications')
    .select('status')
    .eq('candidate_id', session.user.id)
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch application status: ${error.message}`);
  }

  return (data?.status as ApplicationStatusValue | undefined) || null;
}

export async function createCandidateApplication(input: CreateApplicationInput) {
  const session = await requireCandidateSession();
  const client = requireAdminClient();

  const { data: job, error: jobError } = await client.database
    .from('jobs')
    .select('id, title, status, is_approved, applications_count')
    .eq('id', input.jobId)
    .single();

  if (jobError || !job) {
    throw new Error('This job could not be found.');
  }

  if (job.status !== 'active' || job.is_approved !== true) {
    throw new Error('This job is no longer accepting applications.');
  }

  const { data: existing } = await client.database
    .from('applications')
    .select('id, status')
    .eq('candidate_id', session.user.id)
    .eq('job_id', input.jobId)
    .maybeSingle();

  if (existing?.id) {
    throw new Error(existing.status === 'withdrawn'
      ? 'You have already applied to this job before and cannot submit a duplicate application.'
      : 'You have already applied for this job.');
  }

  const now = new Date().toISOString();
  const { data, error } = await client.database
    .from('applications')
    .insert({
      job_id: input.jobId,
      candidate_id: session.user.id,
      cover_letter: input.coverLetter || null,
      status: 'applied',
      applied_at: now,
      updated_at: now,
    })
    .select('id, job_id, candidate_id, status, cover_letter, applied_at, updated_at, jobs(title, location, type, salary_min, salary_max, currency, companies(name, logo_url))')
    .single();

  if (error || !data) {
    if ((error as any)?.code === '23505') {
      throw new Error('You have already applied for this job.');
    }
    throw new Error(`Application failed: ${error?.message || 'Unknown error'}`);
  }

  await client.database
    .from('jobs')
    .update({ applications_count: (job.applications_count || 0) + 1 })
    .eq('id', input.jobId);

  await client.database
    .from('activity')
    .insert({
      user_id: session.user.id,
      type: 'application',
      description: `Applied to ${job.title}`,
      created_at: now,
    });

  // Handle Supabase's return of singular joins as arrays
  const rawJob = Array.isArray(data.jobs) ? data.jobs[0] : data.jobs;
  const mappedJob = rawJob ? {
    ...rawJob,
    companies: Array.isArray(rawJob.companies) ? rawJob.companies[0] : rawJob.companies
  } : null;
  
  const mapped = {
    ...data,
    jobs: mappedJob,
  };

  return mapped as unknown as CandidateApplicationRecord;
}

export async function withdrawCandidateApplication(applicationId: string) {
  const session = await requireCandidateSession();
  const client = requireAdminClient();

  const { data: existing, error: existingError } = await client.database
    .from('applications')
    .select('id, status')
    .eq('id', applicationId)
    .eq('candidate_id', session.user.id)
    .single();

  if (existingError || !existing) {
    throw new Error('Application not found.');
  }

  if (existing.status === 'withdrawn') {
    return { id: applicationId, status: 'withdrawn' as const };
  }

  const { data, error } = await client.database
    .from('applications')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .eq('candidate_id', session.user.id)
    .select('id, status')
    .single();

  if (error || !data) {
    throw new Error(`Failed to withdraw application: ${error?.message || 'Unknown error'}`);
  }

  return data as { id: string; status: 'withdrawn' };
}
