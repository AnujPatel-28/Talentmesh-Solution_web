import { insforgeAdmin } from '@/lib/insforge-admin';

/**
 * lib/api/admin.ts
 * CRITICAL: This file MUST only be imported in Server Components or API Routes.
 * It uses the service role key via insforgeAdmin.
 */

if (typeof window !== 'undefined') {
  throw new Error('lib/api/admin.ts can only be used on the server.');
}

export interface AdminFilters {
  page?: number;
  status?: 'all' | 'active' | 'draft' | 'pending' | 'closed' | 'paused';
  search?: string;
  is_approved?: boolean;
}

/**
 * Fetches all applications with detailed job and candidate joins.
 */
export async function getAllApplications(filters: AdminFilters = {}) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { page = 0, status, search } = filters;
  const start = page * 50; // Increased limit for admin review
  const end = (page + 1) * 50 - 1;

  let query = insforgeAdmin.database
    .from('applications')
    .select(`
      *,
      jobs (
        id,
        title,
        companies (
          name
        )
      ),
      profiles!applications_candidate_id_fkey (
        id,
        name,
        email,
        avatar_url,
        candidate_profiles (
          headline,
          skills,
          experience_years
        )
      )
    `)
    .order('applied_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query.range(start, end);

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return data;
}

/**
 * Gets aggregated application statistics.
 */
export async function getApplicationStats() {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  
  const { data, error } = await insforgeAdmin.database
    .from('applications')
    .select('status');

  if (error) throw new Error(`Stats fetch failed: ${error.message}`);

  const stats = {
    total: data.length,
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    offer: 0,
    rejected: 0
  };

  data.forEach((app: any) => {
    const s = app.status?.toLowerCase();
    if (s && s in stats) {
      (stats as any)[s]++;
    }
  });

  return stats;
}

/**
 * Fetches all jobs regardless of status or approval.
 */
export async function getAllJobs(filters: AdminFilters = {}) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { page = 0, status, search, is_approved } = filters;
  const start = page * 20;
  const end = (page + 1) * 20 - 1;

  let query = insforgeAdmin.database
    .from('jobs')
    .select('*, companies(name), profiles:recruiter_id(name)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    if (status === 'pending') {
      query = query.eq('is_approved', false);
    } else {
      query = query.eq('status', status);
    }
  }
  
  if (is_approved !== undefined) {
    query = query.eq('is_approved', is_approved);
  }

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error } = await query.range(start, end);

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return data;
}

/**
 * Fetches all candidate profiles.
 */
export async function getAllCandidates(filters: AdminFilters = {}) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { page = 0, search } = filters;
  const limit = 20;
  const start = page * limit;
  const end = (page + 1) * limit - 1;

  let query = insforgeAdmin.database
    .from('profiles')
    .select('*, candidate_profiles(*)', { count: 'exact' })
    .eq('role', 'candidate')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(start, end);

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return {
    candidates: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * Fetches all recruiter profiles.
 */
export async function getAllRecruiters(filters: AdminFilters = {}) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { page = 0, search, status } = filters;
  const limit = 20;
  const start = page * limit;
  const end = (page + 1) * limit - 1;

  let query = insforgeAdmin.database
    .from('profiles')
    .select('*, recruiter_profiles(*)', { count: 'exact' })
    .eq('role', 'recruiter')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (status && status !== 'all') {
    if (status === 'pending') {
      // Assuming pending means not approved yet
      query = query.eq('recruiter_profiles.is_approved', false);
    }
  }

  const { data, error, count } = await query.range(start, end);

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return {
    recruiters: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * Gets overview statistics for the admin dashboard with trends.
 */
export async function getPlatformStats() {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: lastWeekUsers },
    { count: totalJobs },
    { count: lastWeekJobs },
    { count: totalApplications },
    { count: lastWeekApplications },
    { count: totalCompanies },
    { count: lastWeekCompanies }
  ] = await Promise.all([
    insforgeAdmin.database.from('profiles').select('*', { count: 'exact', head: true }),
    insforgeAdmin.database.from('profiles').select('*', { count: 'exact', head: true }).lt('created_at', weekAgo),
    insforgeAdmin.database.from('jobs').select('*', { count: 'exact', head: true }),
    insforgeAdmin.database.from('jobs').select('*', { count: 'exact', head: true }).lt('created_at', weekAgo),
    insforgeAdmin.database.from('applications').select('*', { count: 'exact', head: true }),
    insforgeAdmin.database.from('applications').select('*', { count: 'exact', head: true }).lt('created_at', weekAgo),
    insforgeAdmin.database.from('companies').select('*', { count: 'exact', head: true }),
    insforgeAdmin.database.from('companies').select('*', { count: 'exact', head: true }).lt('created_at', weekAgo),
  ]);

  const calculateTrend = (total: number, lastWeek: number) => {
    const currentWeek = total - lastWeek;
    const prevWeek = lastWeek; // Simplified: comparing this week's growth to total before this week
    // Better: this week (now - 7d) vs previous week (7d - 14d)
    // But for a simple dashboard, this is often enough. 
    // Let's do a slightly better one:
    return currentWeek >= 10 ? 'up' : currentWeek > 0 ? 'up' : 'down';
  };

  return {
    users: { value: totalUsers || 0, trend: calculateTrend(totalUsers || 0, lastWeekUsers || 0) },
    jobs: { value: totalJobs || 0, trend: calculateTrend(totalJobs || 0, lastWeekJobs || 0) },
    applications: { value: totalApplications || 0, trend: calculateTrend(totalApplications || 0, lastWeekApplications || 0) },
    companies: { value: totalCompanies || 0, trend: calculateTrend(totalCompanies || 0, lastWeekCompanies || 0) }
  };
}

/**
 * Approves a job post.
 */
export async function approveJob(id: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { error } = await insforgeAdmin.database
    .from('jobs')
    .update({ is_approved: true, status: 'active' })
    .eq('id', id);

  if (error) throw new Error(`Approval failed: ${error.message}`);
}

/**
 * Pauses a job post.
 */
export async function pauseJob(id: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { error } = await insforgeAdmin.database
    .from('jobs')
    .update({ status: 'paused' })
    .eq('id', id);

  if (error) throw new Error(`Pause failed: ${error.message}`);
}

/**
 * Closes a job post.
 */
export async function closeJob(id: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { error } = await insforgeAdmin.database
    .from('jobs')
    .update({ status: 'closed' })
    .eq('id', id);

  if (error) throw new Error(`Close failed: ${error.message}`);
}

/**
 * Rejects a job post.
 */
export async function rejectJob(id: string, reason: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { error } = await insforgeAdmin.database
    .from('jobs')
    .update({ status: 'closed', is_approved: false, recruiter_notes: reason })
    .eq('id', id);

  if (error) throw new Error(`Rejection failed: ${error.message}`);
}

/**
 * Create a new job as admin (auto-approved).
 */
export async function createAdminJob(jobData: any) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { data, error } = await insforgeAdmin.database
    .from('jobs')
    .insert([{ ...jobData, is_approved: true, status: 'active' }])
    .select()
    .single();

  if (error) throw new Error(`Create failed: ${error.message}`);
  return data;
}

/**
 * Soft delete a job.
 */
export async function deleteJob(id: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { error } = await insforgeAdmin.database
    .from('jobs')
    .update({ status: 'deleted' })
    .eq('id', id);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Fetches all companies for selection.
 */
export async function getAllCompanies() {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { data, error } = await insforgeAdmin.database
    .from('companies')
    .select('id, name')
    .order('name');

  if (error) throw new Error(`Fetch companies failed: ${error.message}`);
  return data;
}

/**
 * Fetches a single job by ID using admin client.
 */
export async function getAdminJobById(id: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { data, error } = await insforgeAdmin.database
    .from('jobs')
    .select('*, companies(*)')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Fetch job failed: ${error.message}`);
  return data;
}

/**
 * Updates an existing job as admin.
 */
export async function updateAdminJob(id: string, jobData: any) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { data, error } = await insforgeAdmin.database
    .from('jobs')
    .update(jobData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Update failed: ${error.message}`);
  return data;
}

/**
 * Approves a recruiter profile.
 */
export async function approveRecruiter(id: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { error } = await insforgeAdmin.database
    .from('recruiter_profiles')
    .update({ is_approved: true })
    .eq('id', id);

  if (error) throw new Error(`Approval failed: ${error.message}`);
}

/**
 * Suspends a user account.
 */
export async function suspendUser(id: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { error } = await insforgeAdmin.database
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new Error(`Suspension failed: ${error.message}`);
}

/**
 * Updates application status and optionally adds notes.
 */
export async function updateApplicationStatus(id: string, status: string, notes?: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { error } = await insforgeAdmin.database
    .from('applications')
    .update({ status, recruiter_notes: notes })
    .eq('id', id);

  if (error) throw new Error(`Update failed: ${error.message}`);
}

/**
 * Shortlists an application and notifies the candidate.
 */
export async function shortlistApplication(id: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  
  const { data: app, error: fetchError } = await insforgeAdmin.database
    .from('applications')
    .select('candidate_id, jobs(title)')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`);

  const { error: updateError } = await insforgeAdmin.database
    .from('applications')
    .update({ status: 'shortlisted' })
    .eq('id', id);

  if (updateError) throw new Error(`Shortlist failed: ${updateError.message}`);

  // Notify candidate
  await insforgeAdmin.database
    .from('notifications')
    .insert([{
      user_id: app.candidate_id,
      type: 'application_shortlisted',
      title: 'Application Shortlisted!',
      message: `Great news! You've been shortlisted for ${(app.jobs as any).title}`,
      metadata: { application_id: id }
    }]);
}

/**
 * Rejects an application and notifies the candidate.
 */
export async function rejectApplication(id: string, reason: string) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  
  const { data: app, error: fetchError } = await insforgeAdmin.database
    .from('applications')
    .select('candidate_id, jobs(title)')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`);

  const { error: updateError } = await insforgeAdmin.database
    .from('applications')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', id);

  if (updateError) throw new Error(`Rejection failed: ${updateError.message}`);

  // Notify candidate
  await insforgeAdmin.database
    .from('notifications')
    .insert([{
      user_id: app.candidate_id,
      type: 'application_rejected',
      title: 'Application Update',
      message: `Update on your application for ${(app.jobs as any).title}. Unfortunately, we will not be moving forward at this time.`,
      metadata: { application_id: id, reason }
    }]);
}

/**
 * Fetches platform audit logs.
 */
export async function getAuditLogs(filters: AdminFilters = {}) {
  if (!insforgeAdmin) throw new Error('Admin client not initialized');
  const { page = 0, search } = filters;
  const start = page * 50;
  const end = (page + 1) * 50 - 1;

  let query = insforgeAdmin.database
    .from('audit_logs')
    .select('*, actor:profiles!audit_logs_actor_id_fkey(name, email)')
    .order('created_at', { ascending: false });

  if (search) {
    // Basic search on action or table_name
    query = query.or(`action.ilike.%${search}%,table_name.ilike.%${search}%`);
  }

  const { data, error } = await query.range(start, end);

  if (error) throw new Error(`Audit fetch failed: ${error.message}`);
  return data;
}
