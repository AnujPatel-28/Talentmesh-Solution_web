import { insforge } from '@/lib/insforge';

export type ApplicationStatus = 
  | 'applied' 
  | 'reviewing' 
  | 'shortlisted' 
  | 'interview' 
  | 'offer' 
  | 'accepted' 
  | 'rejected' 
  | 'withdrawn';

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  cover_letter?: string;
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
      logo_url: string;
    };
  };
}

/**
 * Submits a new job application.
 * Handles duplicate application error (PG error 23505).
 */
export async function applyToJob(jobId: string, coverLetter?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await insforge.auth.getCurrentSession();
    if (!session?.user) {
      throw new Error('You must be logged in to apply for a job.');
    }

    const { error } = await insforge.database
      .from('applications')
      .insert({
        job_id: jobId,
        candidate_id: session.user.id,
        cover_letter: coverLetter,
        status: 'applied'
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You have already applied for this job.' };
      }
      throw new Error(`Application failed: ${error.message}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches the current user's job applications.
 */
export async function getMyApplications(): Promise<Application[]> {
  const { data: { session } } = await insforge.auth.getCurrentSession();
  if (!session?.user) {
    throw new Error('User not authenticated.');
  }

  const { data, error } = await insforge.database
    .from('applications')
    .select('*, jobs(title, location, type, salary_min, salary_max, currency, companies(name, logo_url))')
    .eq('candidate_id', session.user.id)
    .order('applied_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data as unknown as Application[];
}

/**
 * Withdraws a specific job application.
 */
export async function withdrawApplication(id: string): Promise<void> {
  const { error } = await insforge.database
    .from('applications')
    .update({ status: 'withdrawn' })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to withdraw application: ${error.message}`);
  }
}

/**
 * Checks if the user has already applied for a specific job.
 * Returns the status if applied, null otherwise.
 */
export async function checkAlreadyApplied(jobId: string): Promise<ApplicationStatus | null> {
  const { data: { session } } = await insforge.auth.getCurrentSession();
  if (!session?.user) return null;

  const { data, error } = await insforge.database
    .from('applications')
    .select('status')
    .eq('job_id', jobId)
    .eq('candidate_id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking application status:', error.message);
    return null;
  }

  return data?.status as ApplicationStatus || null;
}
