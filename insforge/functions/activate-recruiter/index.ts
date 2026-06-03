import { createClient } from 'npm:@insforge/sdk';

export default async function handler(req: Request): Promise<Response> {
  const INSFORGE_URL = req.headers.get('x-insforge-url') || Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const origin = req.headers.get('Origin') || 'http://localhost:3000';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const serviceKey = req.headers.get('x-insforge-service-key') || Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('API_KEY') || '';
    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: serviceKey,
      isServerMode: true
    });

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error } = await db.database
      .from('profiles')
      .update({ 
        status: 'active',
        completed_onboarding: true
      })
      .eq('id', userId);

    if (error) throw error;

    const { error: rpError } = await db.database
      .from('recruiter_profiles')
      .update({ is_approved: true })
      .eq('id', userId);

    if (rpError) throw rpError;

    // Send activation welcome email (fire-and-forget)
    const { data: recruiterProfile } = await db.database
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (recruiterProfile?.email) {
      const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000';
      fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-key': serviceKey,
        },
        body: JSON.stringify({
          to: recruiterProfile.email,
          template: 'recruiter-welcome',
          data: {
            name: recruiterProfile.name || 'Recruiter',
            email: recruiterProfile.email,
          },
          role: 'hr',
        }),
      }).catch((e: any) => console.error('[activate-recruiter] Email failed:', e.message));
    }

    return new Response(JSON.stringify({ success: true, message: 'Recruiter account activated' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('activate-recruiter error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
