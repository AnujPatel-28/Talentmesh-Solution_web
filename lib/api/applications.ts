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

export async function applyToJob(jobId: string, coverLetter?: string): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const response = await fetch('/api/candidate/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ jobId, coverLetter }),
    });
    const payload = await response.json();

    if (!response.ok) {
      return { success: false, error: payload.error || 'Application failed.' };
    }

    return { success: true, applicationId: payload.application?.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Application failed.' };
  }
}

export async function getMyApplications(): Promise<Application[]> {
  const response = await fetch('/api/candidate/applications', {
    credentials: 'include',
    cache: 'no-store',
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to fetch applications.');
  }

  return (payload.applications || []) as Application[];
}

export async function withdrawApplication(id: string): Promise<void> {
  const response = await fetch(`/api/candidate/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status: 'withdrawn' }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to withdraw application.');
  }
}

export async function checkAlreadyApplied(jobId: string): Promise<ApplicationStatus | null> {
  const response = await fetch(`/api/candidate/applications?jobId=${encodeURIComponent(jobId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  const payload = await response.json();
  if (!response.ok) {
    return null;
  }

  return (payload.status as ApplicationStatus | null) || null;
}
