import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || 'http://localhost:3000';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-insforge-service-key',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const serviceKey =
      req.headers.get('x-insforge-service-key') ||
      Deno.env.get('INSFORGE_SERVICE_KEY') ||
      Deno.env.get('INSFORGE_ADMIN_KEY') ||
      anonKey;

    // Service-role client for DB ops (bypasses RLS)
    const insforge = createClient({
      baseUrl,
      anonKey: serviceKey!,
      edgeFunctionToken: token,
      isServerMode: true,
    });

    // Verify caller is authenticated
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized, invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is admin
    const { data: profile } = await insforge.database
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    // Extract optional /:id path segment
    const pathParts = url.pathname.replace(/\/+$/, '').split('/');
    const lastSegment = pathParts[pathParts.length - 1];
    const id = lastSegment && lastSegment !== 'admin-applications' ? lastSegment : null;

    // ── GET — List applications ──────────────────────────────────────────────
    if (req.method === 'GET') {
      const search = url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || 'all';
      const page = parseInt(url.searchParams.get('page') || '0');
      const requestedLimit = parseInt(url.searchParams.get('limit') || '20');
      const limit = Math.min(requestedLimit, 100);

      let query = insforge.database
        .from('applications')
        .select(
          '*, jobs(title, companies(name)), profiles(name, email, phone, location, candidate_profiles(headline, experience_years, skills, resume_url, education, linkedin_url, github_url, portfolio_url))',
          { count: 'exact' }
        );

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply search filter across candidate name and job title
      if (search) {
        query = query.or(
          `profiles.name.ilike.%${search}%,jobs.title.ilike.%${search}%`
        );
      }

      const { data: applications, count: total, error } = await query
        .order('applied_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      return new Response(
        JSON.stringify({ applications: applications ?? [], total: total ?? 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── PATCH /:id — Update status ───────────────────────────────────────────
    if (req.method === 'PATCH') {
      const body = await req.json();
      const targetId = id || url.searchParams.get('id') || body.id;

      if (!targetId) {
        return new Response(
          JSON.stringify({ error: 'Missing application id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      delete body.id;
      delete body.created_at;
      delete body.updated_at;

      const nextStatus: string | undefined = body.status;

      if (nextStatus) {
        // Invoke update_application_status RPC
        const { data: rpcResult, error: rpcError } = await insforge.database
          .rpc('update_application_status', {
            p_application_id: targetId,
            p_status: nextStatus,
            p_actor_id: user.id,
            p_actor_type: 'admin'
          });

        if (rpcError) {
          if (rpcError.message?.includes('withdrawn')) {
            return new Response(
              JSON.stringify({ error: 'Cannot update a withdrawn application.' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return new Response(
            JSON.stringify({ error: rpcError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { success, no_op, application } = rpcResult;

        // Fetch full application details to return to the UI (backward compatibility)
        const { data: updatedApp } = await insforge.database
          .from('applications')
          .select('*, jobs(title, companies(name)), profiles(name, email, phone, location, candidate_profiles(headline, experience_years, skills, resume_url, education, linkedin_url, github_url, portfolio_url))')
          .eq('id', targetId)
          .single();

        // Send email notification (fire-and-forget) if not a no-op
        if (success && !no_op && application && application.candidate_email) {
          const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000';
          fetch(`${siteUrl}/api/email/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-service-key': serviceKey || '',
            },
            body: JSON.stringify({
              to: application.candidate_email,
              template: 'application-status',
              data: {
                name: application.candidate_name || 'Candidate',
                email: application.candidate_email,
                jobTitle: application.job_title,
                status: nextStatus,
              },
              role: 'hr',
            }),
          }).catch((e: any) =>
            console.error('[admin-applications] Email send failed:', e.message)
          );
        }

        return new Response(
          JSON.stringify({ application: updatedApp }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Non-status PATCH (generic field update, no notifications needed)
      const { data, error } = await insforge.database
        .from('applications')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', targetId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
          JSON.stringify({ application: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── DELETE /:id ──────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const targetId = id || url.searchParams.get('id');

      if (!targetId) {
        return new Response(
          JSON.stringify({ error: 'Missing application id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await insforge.database
        .from('applications')
        .delete()
        .eq('id', targetId);

      if (error) throw error;

      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[admin-applications] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
