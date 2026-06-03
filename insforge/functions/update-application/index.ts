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

    // Update Application
    const { data: application, error: appError } = await insforgeAdmin.database
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, jobs!inner(title, recruiter_id), profiles!inner(name, id)')
      .single();

    if (appError) {
      return new Response(JSON.stringify({ error: appError.message }), { status: 500, headers: corsHeaders });
    }

    // Log Activity
    await insforgeAdmin.database.from('activity').insert({
      user_id: application.jobs.recruiter_id,
      type: 'application_update',
      content: `Updated application for ${application.profiles.name} to ${status}`,
      metadata: { application_id: id, status }
    });

    // Insert in-app notification for the candidate
    await insforgeAdmin.database.from('notifications').insert({
      user_id: application.profiles.id,
      type: 'application_update',
      title: 'Application Update',
      message: `Your application for ${application.jobs.title} is now ${status}.`,
      is_read: false,
      metadata: { application_id: id, status, job_title: application.jobs.title },
    });

    // Send email notification (fire-and-forget)
    const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000';
    const emailServiceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || '';

    // Get candidate email
    const { data: candidateProfile } = await insforgeAdmin.database
      .from('profiles')
      .select('email, name')
      .eq('id', application.profiles.id)
      .single();

    if (candidateProfile?.email) {
      fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-key': emailServiceKey,
        },
        body: JSON.stringify({
          to: candidateProfile.email,
          template: 'application-status',
          data: {
            name: candidateProfile.name || 'Candidate',
            email: candidateProfile.email,
            jobTitle: application.jobs.title,
            status,
          },
          role: 'hr',
        }),
      }).catch((e: any) => console.error('[update-application] Email failed:', e.message));
    }

    return new Response(JSON.stringify({ success: true, application }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error('Update Application Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
