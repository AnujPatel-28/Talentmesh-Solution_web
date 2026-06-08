import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'Access-Control-Allow-Credentials': 'true',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'id and status required' }), { status: 400, headers: corsHeaders });
    }

    const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

    // Extract actor ID from JWT token
    let actorId;
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      actorId = payload.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid token format' }), { status: 401, headers: corsHeaders });
    }

    // Resolve actor role/type
    const { data: profile } = await insforgeAdmin.database
      .from('profiles')
      .select('role')
      .eq('id', actorId)
      .single();

    let actorType = 'recruiter';
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      actorType = 'admin';
    } else if (profile?.role === 'candidate') {
      actorType = 'candidate';
    }

    // Invoke update_application_status RPC
    const { data: rpcResult, error: rpcError } = await insforgeAdmin.database
      .rpc('update_application_status', {
        p_application_id: id,
        p_status: status,
        p_actor_id: actorId,
        p_actor_type: actorType
      });

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), { status: 500, headers: corsHeaders });
    }

    const { success, no_op, application } = rpcResult;

    // Fetch full application details to return to the UI (backward compatibility)
    const { data: updatedApp } = await insforgeAdmin.database
      .from('applications')
      .select('*, jobs!inner(title, recruiter_id), profiles!inner(name, id)')
      .eq('id', id)
      .single();

    // Send email notification (fire-and-forget) if not a no-op
    if (success && !no_op && application && application.candidate_email) {
      const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000';
      const emailServiceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || '';

      fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-key': emailServiceKey,
        },
        body: JSON.stringify({
          to: application.candidate_email,
          template: 'application-status',
          data: {
            name: application.candidate_name || 'Candidate',
            email: application.candidate_email,
            jobTitle: application.job_title,
            status,
          },
          role: 'hr',
        }),
      }).catch((e: any) => console.error('[update-application] Email failed:', e.message));
    }

    return new Response(JSON.stringify({ success: true, application: updatedApp }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error('Update Application Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
