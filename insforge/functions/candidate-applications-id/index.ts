import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'You must be logged in to continue.' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const reqBaseUrl = req.headers.get('x-insforge-url') || baseUrl;
  const reqAnonKey = req.headers.get('x-insforge-anon-key') || anonKey;
  const reqServiceKey = req.headers.get('x-insforge-service-key') || serviceKey || reqAnonKey;

  const insforge = createClient({ baseUrl: reqBaseUrl, anonKey: reqAnonKey });
  insforge.setAccessToken(token);
  const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

  if (authError || !authData?.user || authData.user.id === 'project-admin-with-api-key') {
    return new Response(
      JSON.stringify({ error: 'You must be logged in to continue.' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const insforgeAdmin = createClient({ baseUrl: reqBaseUrl, anonKey: reqServiceKey, isServerMode: true });

  // Check caller role — only candidates can use this endpoint
  const { data: profile } = await insforgeAdmin.database
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'recruiter') {
    return new Response(
      JSON.stringify({ error: 'Only candidates can access this endpoint.' }),
      { status: 403, headers: corsHeaders }
    );
  }

  const candidateId = authData.user.id;
  const url = new URL(req.url);
  const applicationId = url.searchParams.get('id');

  if (!applicationId) {
    return new Response(
      JSON.stringify({ error: 'Application ID is required' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // ── GET — Fetch single application for this candidate ──────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await insforgeAdmin.database
        .from('applications')
        .select(
          'id, status, applied_at, updated_at, cover_letter, ' +
          'jobs(title, location, type, salary_min, salary_max, currency, companies(name, logo_url))'
        )
        .eq('id', applicationId)
        .eq('candidate_id', candidateId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Application not found.' }),
          { status: 404, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({ application: data }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Failed to fetch application' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // ── PATCH — Withdraw application ─────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const body = await req.json();
      if (body.status !== 'withdrawn') {
        return new Response(
          JSON.stringify({ error: "Only 'withdrawn' status updates are allowed via this endpoint." }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: existing, error: existingError } = await insforgeAdmin.database
        .from('applications')
        .select('id, status')
        .eq('id', applicationId)
        .eq('candidate_id', candidateId)
        .single();

      if (existingError || !existing) {
        return new Response(
          JSON.stringify({ error: 'Application not found.' }),
          { status: 404, headers: corsHeaders }
        );
      }

      // Already withdrawn — idempotent
      if (existing.status === 'withdrawn') {
        return new Response(
          JSON.stringify({ id: applicationId, status: 'withdrawn' }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Explicit allow-list for withdrawable statuses
      const WITHDRAWABLE_STATUSES = ['applied', 'reviewing', 'shortlisted', 'interviewing', 'offered'];
      if (!WITHDRAWABLE_STATUSES.includes(existing.status)) {
        return new Response(
          JSON.stringify({ error: `Cannot withdraw an application with status '${existing.status}'.` }),
          { status: 409, headers: corsHeaders }
        );
      }

      const { data: rpcResult, error: rpcError } = await insforgeAdmin.database
        .rpc('update_application_status', {
          p_application_id: applicationId,
          p_status: 'withdrawn',
          p_actor_id: candidateId,
          p_actor_type: 'candidate',
          p_metadata: {}
        });

      if (rpcError || !rpcResult?.success) {
        throw new Error(`Failed to withdraw application: ${rpcError?.message || 'Unknown RPC error'}`);
      }

      return new Response(
        JSON.stringify({ id: applicationId, status: 'withdrawn' }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Failed to withdraw application' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Fallback — TypeScript requires all code paths to return a Response.
  // In practice this is unreachable: earlier guards already return for
  // any method that is not GET or PATCH.
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  );
}
