import { insforge, invokeFunction } from '../insforge';

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
      logo_url: string | null;
    };
  };
}

/**
 * Helper to build a URL with query parameters for Edge Functions
 */
function buildUrl(slug: string, params: Record<string, any>): string {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
  );
  const query = new URLSearchParams(cleanParams as any).toString();
  return query ? `${slug}?${query}` : slug;
}

export async function applyToJob(jobId: string, coverLetter?: string): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const { data, error } = await invokeFunction('candidate-applications', {
      method: 'POST',
      body: { jobId, coverLetter }
    });

    if (error) {
      return { success: false, error: error.message || 'Application failed.' };
    }

    return { success: true, applicationId: data?.application?.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Application failed.' };
  }
}

export async function getMyApplications(): Promise<Application[]> {
  const { data, error } = await invokeFunction('candidate-applications', {
    method: 'GET'
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch applications.');
  }

  return (data?.applications || []) as Application[];
}

export async function withdrawApplication(id: string): Promise<void> {
  const { error } = await invokeFunction(`candidate-applications-id?id=${id}`, {
    method: 'DELETE'
  });

  if (error) {
    throw new Error(error.message || 'Failed to withdraw application.');
  }
}

export async function checkAlreadyApplied(jobId: string): Promise<ApplicationStatus | null> {
  const { data, error } = await invokeFunction(`candidate-applications?jobId=${jobId}`, {
    method: 'GET'
  });

  if (error) {
    if (error.status === 401 || error.status === 403) return null;
    return null;
  }

  return (data?.status as ApplicationStatus | null) || null;
}

