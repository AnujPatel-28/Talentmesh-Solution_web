import { insforge } from '@/lib/insforge';

export interface RecruiterDashboardStats {
  activeJobs: number;
  totalApplications: number;
  recentApplicants: any[];
}

/**
 * Fetches dashboard stats for the logged-in recruiter.
 */
export async function getRecruiterDashboard(): Promise<RecruiterDashboardStats> {
  const { data: sessionData } = await insforge.auth.refreshSession();
  const sessionUser = sessionData?.user;
  if (!sessionUser) throw new Error('Unauthorized');

  const [
    { count: activeJobs },
    { count: totalApps },
    { data: recentApplicants }
  ] = await Promise.all([
    insforge.database.from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('recruiter_id', sessionUser.id)
      .eq('status', 'active'),
    
    insforge.database.from('applications')
      .select('*, jobs!inner(*)', { count: 'exact', head: true })
      .eq('jobs.recruiter_id', sessionUser.id),

    insforge.database.from('applications')
      .select('*, jobs!inner(title), profiles!applications_candidate_id_fkey(name, email)')
      .eq('jobs.recruiter_id', sessionUser.id)
      .order('applied_at', { ascending: false })
      .limit(5)
  ]);

  return {
    activeJobs: activeJobs || 0,
    totalApplications: totalApps || 0,
    recentApplicants: recentApplicants || []
  };
}

/**
 * Fetches all applicants for a specific job posted by the recruiter.
 */
export async function getJobApplicants(jobId: string) {
  const { data, error } = await insforge.database
    .from('applications')
    .select('*, profiles!applications_candidate_id_fkey(*, candidate_profiles(*))')
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch applicants: ${error.message}`);
  return data;
}

/**
 * Moves an application to a new stage in the recruitment pipeline.
 */
export async function moveApplicationStage(applicationId: string, status: string) {
  const { error } = await insforge.database
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) throw new Error(`Failed to update application stage: ${error.message}`);
}

/**
 * Completes recruiter setup by linking to a company and setting role details.
 */
export async function completeRecruiterSetup(data: { 
  companyName: string; 
  jobTitle: string; 
  department: string; 
}) {
  const { data: sessionData } = await insforge.auth.refreshSession();
  const sessionUser = sessionData?.user;
  if (!sessionUser) throw new Error('Unauthorized');

  // 1. Find or create company by name
  let { data: company } = await insforge.database
    .from('companies')
    .select('id')
    .eq('name', data.companyName)
    .maybeSingle();

  if (!company) {
    const { data: newCompany, error: createError } = await insforge.database
      .from('companies')
      .insert([{ name: data.companyName }])
      .select('id')
      .single();
    
    if (createError) throw new Error(`Failed to create company: ${createError.message}`);
    company = newCompany;
  }

  // 2. Upsert recruiter profile
  const { error: profileError } = await insforge.database
    .from('recruiter_profiles')
    .upsert([{
      id: sessionUser.id,
      company_id: company!.id,
      job_title: data.jobTitle,
      department: data.department,
      is_approved: false
    }]);

  if (profileError) throw new Error(`Failed to save recruiter profile: ${profileError.message}`);

  // 3. Activity log
  await insforge.database.from('activity').insert([{
    user_id: sessionUser.id,
    type: 'onboarding_complete',
    description: `Completed recruiter setup at ${data.companyName}`
  }]);
}
