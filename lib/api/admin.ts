import { insforge, invokeFunction } from '@/lib/insforge';

/**
 * lib/api/admin.ts
 * All functions now invoke InsForge Edge Functions for secure, role-verified operations.
 */

export interface AdminFilters {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'draft' | 'pending' | 'closed' | 'paused';
  search?: string;
  is_approved?: boolean;
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

/**
 * Fetches all applications with detailed job and candidate joins.
 */
export async function getAllApplications(filters: AdminFilters = {}) {
  const { data, error } = await invokeFunction(buildUrl('admin-applications', filters), {
    method: 'GET'
  });

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return data.items || [];
}

/**
 * Gets aggregated application statistics.
 */
export async function getApplicationStats() {
  const { data, error } = await invokeFunction(buildUrl('admin-dashboard', { type: 'application-stats' }), {
    method: 'GET'
  });

  if (error) throw new Error(`Stats fetch failed: ${error.message}`);
  return data.stats;
}

/**
 * Fetches all jobs regardless of status or approval.
 */
export async function getAllJobs(filters: AdminFilters = {}) {
  const { data, error } = await invokeFunction(buildUrl('admin-jobs', filters), {
    method: 'GET'
  });

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return data.items || [];
}

/**
 * Fetches all candidate profiles.
 */
export async function getAllCandidates(filters: AdminFilters = {}) {
  const { data, error } = await invokeFunction(buildUrl('admin-candidates', filters), {
    method: 'GET'
  });

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return {
    candidates: data.items || [],
    total: data.total || 0,
    page: data.page || 0,
    limit: data.limit || 20,
    totalPages: Math.ceil((data.total || 0) / (data.limit || 20))
  };
}

/**
 * Fetches all recruiter profiles.
 */
export async function getAllRecruiters(filters: AdminFilters = {}) {
  const { data, error } = await invokeFunction(buildUrl('admin-recruiters', filters), {
    method: 'GET'
  });

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return {
    recruiters: data.items || [],
    total: data.total || 0,
    page: data.page || 0,
    limit: data.limit || 20,
    totalPages: Math.ceil((data.total || 0) / (data.limit || 20))
  };
}

/**
 * Gets overview statistics for the admin dashboard with trends.
 */
export async function getPlatformStats() {
  const { data, error } = await invokeFunction(buildUrl('admin-dashboard', { type: 'platform-overview' }), {
    method: 'GET'
  });

  if (error) throw new Error(`Admin fetch failed: ${error.message}`);
  return data.stats;
}

/**
 * Approves a job post.
 */
export async function approveJob(id: string) {
  const { error } = await invokeFunction(`admin-jobs/${id}`, {
    method: 'PATCH',
    body: { is_approved: true, status: 'active' }
  });

  if (error) throw new Error(`Approval failed: ${error.message}`);
}

/**
 * Pauses a job post.
 */
export async function pauseJob(id: string) {
  const { error } = await invokeFunction(`admin-jobs/${id}`, {
    method: 'PATCH',
    body: { status: 'paused' }
  });

  if (error) throw new Error(`Pause failed: ${error.message}`);
}

/**
 * Closes a job post.
 */
export async function closeJob(id: string) {
  const { error } = await invokeFunction(`admin-jobs/${id}`, {
    method: 'PATCH',
    body: { status: 'closed' }
  });

  if (error) throw new Error(`Close failed: ${error.message}`);
}

/**
 * Rejects a job post.
 */
export async function rejectJob(id: string, reason: string) {
  const { error } = await invokeFunction(`admin-jobs/${id}`, {
    method: 'PATCH',
    body: { status: 'closed', is_approved: false, recruiter_notes: reason }
  });

  if (error) throw new Error(`Rejection failed: ${error.message}`);
}

/**
 * Create a new job as admin (auto-approved).
 */
export async function createAdminJob(jobData: any) {
  const { data, error } = await invokeFunction('admin-jobs', {
    method: 'POST',
    body: { ...jobData, is_approved: true, status: 'active' }
  });

  if (error) throw new Error(`Create failed: ${error.message}`);
  return data.job;
}

/**
 * Soft delete a job.
 */
export async function deleteJob(id: string) {
  const { error } = await invokeFunction(`admin-jobs/${id}`, {
    method: 'DELETE'
  });

  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Fetches all companies for selection.
 */
export async function getAllCompanies() {
  const { data, error } = await invokeFunction('admin-companies');

  if (error) throw new Error(`Fetch companies failed: ${error.message}`);
  return data.items || [];
}

/**
 * Fetches a single job by ID using admin context.
 */
export async function getAdminJobById(id: string) {
  const { data, error } = await invokeFunction(`admin-jobs/${id}`, {
    method: 'GET'
  });

  if (error) throw new Error(`Fetch job failed: ${error.message}`);
  return data.job;
}

/**
 * Updates an existing job as admin.
 */
export async function updateAdminJob(id: string, jobData: any) {
  const { data, error } = await invokeFunction(`admin-jobs/${id}`, {
    method: 'PATCH',
    body: jobData
  });

  if (error) throw new Error(`Update failed: ${error.message}`);
  return data.job;
}

/**
 * Approves a recruiter profile.
 */
export async function approveRecruiter(id: string) {
  const { error } = await invokeFunction('admin-recruiter', {
    method: 'POST',
    body: { action: 'approve', id }
  });

  if (error) throw new Error(`Approval failed: ${error.message}`);
}

/**
 * Suspends a user account.
 */
export async function suspendUser(id: string) {
  const { error } = await invokeFunction(`admin-candidates/${id}`, {
    method: 'PATCH',
    body: { is_active: false }
  });

  if (error) throw new Error(`Suspension failed: ${error.message}`);
}

/**
 * Updates application status and optionally adds notes.
 */
export async function updateApplicationStatus(id: string, status: string, notes?: string) {
  const { error } = await invokeFunction(`admin-applications/${id}`, {
    method: 'PATCH',
    body: { status, recruiter_notes: notes }
  });

  if (error) throw new Error(`Update failed: ${error.message}`);
}

/**
 * Shortlists an application and notifies the candidate.
 */
export async function shortlistApplication(id: string) {
  const { error } = await invokeFunction('admin-applications', {
    method: 'POST',
    body: { action: 'shortlist', id }
  });

  if (error) throw new Error(`Shortlist failed: ${error.message}`);
}

/**
 * Rejects an application and notifies the candidate.
 */
export async function rejectApplication(id: string, reason: string) {
  const { error } = await invokeFunction('admin-applications', {
    method: 'POST',
    body: { action: 'reject', id, reason }
  });

  if (error) throw new Error(`Rejection failed: ${error.message}`);
}

/**
 * Fetches platform audit logs.
 */
export async function getAuditLogs(filters: AdminFilters = {}) {
  const { data, error } = await invokeFunction(buildUrl('admin-audit-logs', filters), {
    method: 'GET'
  });

  if (error) throw new Error(`Audit fetch failed: ${error.message}`);
  return data.items || [];
}

