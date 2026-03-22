import { insforge } from '@/lib/insforge';

export type JobStatus = 'draft' | 'active' | 'closed';

export interface JobFilters {
  search?: string;
  type?: string;
  location?: string;
  page?: number;
}

export interface CreateJobInput {
  company_id: string;
  recruiter_id: string;
  title: string;
  description: string;
  requirements?: string[];
  skills_required?: string[];
  type?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  experience_min?: number;
  experience_max?: number;
  department?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[] | null;
  skills_required: string[] | null;
  type: string;
  location: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  experience_min: number | null;
  experience_max: number | null;
  department: string | null;
  status: JobStatus;
  is_approved: boolean;
  views_count: number;
  applications_count: number;
  created_at: string;
  companies: {
    name: string;
    logo_url: string;
    industry: string;
  };
}

/**
 * Fetches approved and active jobs with pagination and filters.
 */
export async function getApprovedJobs(filters: JobFilters = {}): Promise<Job[]> {
  const { search, type, location, page = 0 } = filters;
  const start = page * 20;
  const end = (page + 1) * 20 - 1;

  let query = insforge.database
    .from('jobs')
    .select('*, companies(name, logo_url, industry)')
    .eq('is_approved', true)
    .eq('status', 'active');

  if (search) {
    query = query.filter('fts', '@@', `plainto_tsquery('${search}')`);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (location) {
    query = query.eq('location', location);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`);
  }

  return data as unknown as Job[];
}

/**
 * Fetches a single job by ID and increments its views count.
 */
export async function getJobById(id: string): Promise<Job> {
  const { data, error } = await insforge.database
    .from('jobs')
    .select('*, companies(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error(`Job not found: ${error?.message || 'Unknown error'}`);
  }

  // Fire and forget increment view count
  insforge.database.from('jobs')
    .update({ views_count: (data.views_count || 0) + 1 })
    .eq('id', id)
    .then(({ error: incError }) => {
      if (incError) console.error('Failed to increment view count:', incError.message);
    });

  return data as unknown as Job;
}

/**
 * Creates a new job in draft status.
 */
export async function createJob(data: CreateJobInput): Promise<Job> {
  const { data: newJob, error } = await insforge.database
    .from('jobs')
    .insert({
      ...data,
      status: 'draft',
      is_approved: false
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create job: ${error.message}`);
  }

  return newJob as unknown as Job;
}

/**
 * Updates an existing job.
 */
export async function updateJob(id: string, data: Partial<CreateJobInput>): Promise<Job> {
  const { data: updatedJob, error } = await insforge.database
    .from('jobs')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update job: ${error.message}`);
  }

  return updatedJob as unknown as Job;
}

/**
 * Updates the status of a job.
 */
export async function updateJobStatus(id: string, status: JobStatus): Promise<void> {
  const { error } = await insforge.database
    .from('jobs')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }
}

/**
 * Soft deletes a job by setting its status to closed.
 */
export async function deleteJob(id: string): Promise<void> {
  return updateJobStatus(id, 'closed');
}
