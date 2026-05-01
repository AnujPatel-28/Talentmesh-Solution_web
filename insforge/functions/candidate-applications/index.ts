import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const createApplicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  coverLetter: z.string().optional(),
});

type CandidateApplicationRecord = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
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

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'You must be logged in to continue.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
  const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

  if (authError || !authData?.user || authData.user.id === 'project-admin-with-api-key') {
    return new Response(JSON.stringify({ error: 'You must be logged in to continue.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

  // Get user role
  const { data: profile } = await insforgeAdmin.database
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'recruiter') {
    return new Response(JSON.stringify({ error: 'Only candidates can perform this action.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const candidateId = authData.user.id;

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const jobId = url.searchParams.get('jobId');

      if (jobId) {
        const { data: statusData, error: statusError } = await insforgeAdmin.database
          .from('applications')
          .select('status')
          .eq('candidate_id', candidateId)
          .eq('job_id', jobId)
          .maybeSingle();

        if (statusError) {
          throw new Error(`Failed to fetch application status: ${statusError.message}`);
        }
        return new Response(JSON.stringify({ status: statusData?.status || null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      const { data, error } = await insforgeAdmin.database
        .from('applications')
        .select('id, job_id, candidate_id, status, cover_letter, applied_at, updated_at, jobs(title, location, type, salary_min, salary_max, currency, companies(name, logo_url))')
        .eq('candidate_id', candidateId)
        .order('applied_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch applications: ${error.message}`);
      }

      const applications = (data || []).map((app: any) => {
        const rawJob = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
        const mappedJob = rawJob ? {
          ...rawJob,
          companies: Array.isArray(rawJob.companies) ? rawJob.companies[0] : rawJob.companies
        } : null;
        return { ...app, jobs: mappedJob };
      });

      return new Response(JSON.stringify({ applications }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to load applications' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (req.method === 'POST') {
    try {
      const payload = await req.json();
      const validation = createApplicationSchema.safeParse(payload);

      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Invalid application payload', errors: validation.error.flatten().fieldErrors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const input = validation.data;

      const { data: job, error: jobError } = await insforgeAdmin.database
        .from('jobs')
        .select('id, title, status, is_approved, applications_count')
        .eq('id', input.jobId)
        .single();

      if (jobError || !job) {
        return new Response(JSON.stringify({ error: 'This job could not be found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      if (job.status !== 'active' || job.is_approved !== true) {
        return new Response(JSON.stringify({ error: 'This job is no longer accepting applications.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
      }

      const { data: existing } = await insforgeAdmin.database
        .from('applications')
        .select('id, status')
        .eq('candidate_id', candidateId)
        .eq('job_id', input.jobId)
        .maybeSingle();

      if (existing?.id) {
        const msg = existing.status === 'withdrawn'
          ? 'You have already applied to this job before and cannot submit a duplicate application.'
          : 'You have already applied for this job.';
        return new Response(JSON.stringify({ error: msg }), { status: 409, headers: { 'Content-Type': 'application/json' } });
      }

      const now = new Date().toISOString();
      const { data, error } = await insforgeAdmin.database
        .from('applications')
        .insert([{
          job_id: input.jobId,
          candidate_id: candidateId,
          cover_letter: input.coverLetter || null,
          status: 'applied',
          applied_at: now,
          updated_at: now,
        }])
        .select('id, job_id, candidate_id, status, cover_letter, applied_at, updated_at, jobs(title, location, type, salary_min, salary_max, currency, companies(name, logo_url))')
        .single();

      if (error || !data) {
        if ((error as any)?.code === '23505') {
          return new Response(JSON.stringify({ error: 'You have already applied for this job.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }
        throw new Error(`Application failed: ${error?.message || 'Unknown error'}`);
      }

      await insforgeAdmin.database
        .from('jobs')
        .update({ applications_count: (job.applications_count || 0) + 1 })
        .eq('id', input.jobId);

      await insforgeAdmin.database
        .from('activity')
        .insert([{
          user_id: candidateId,
          type: 'application',
          description: `Applied to ${job.title}`,
          created_at: now,
        }]);

      const rawJob = Array.isArray((data as any).jobs) ? (data as any).jobs[0] : (data as any).jobs;
      const mappedJob = rawJob ? {
        ...rawJob,
        companies: Array.isArray(rawJob.companies) ? rawJob.companies[0] : rawJob.companies
      } : null;

      const application = { ...data, jobs: mappedJob };
      return new Response(JSON.stringify({ application }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to apply' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
