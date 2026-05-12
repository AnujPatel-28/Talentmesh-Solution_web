import { createClient } from 'npm:@insforge/sdk';

const INSFORGE_URL = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const INSFORGE_ANON_KEY = Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;

export default async function handler(request: Request): Promise<Response> {
  // Use request origin, fallback to localhost:3000 (never use '*' with credentials)
  const origin = request.headers.get('origin') || request.headers.get('Origin') || 'http://localhost:3000';
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  console.log(`[auth-session] Request from origin: ${origin}`);

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    console.error('[auth-session] Missing auth header');
    return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: corsHeaders });
  }

  try {
    // Validate session via direct REST call
    const userRes = await fetch(`${INSFORGE_URL}/api/auth/user`, {
      headers: { 
        'Authorization': authHeader,
        'apikey': INSFORGE_ANON_KEY
      }
    });

    if (!userRes.ok) {
      const errorText = await userRes.text();
      console.error(`[auth-session] Auth failed: ${userRes.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: 'Unauthorized', status: userRes.status }), { status: 401, headers: corsHeaders });
    }

    const userData = await userRes.json();
    console.log(`[auth-session] User validated: ${userData.id}`);

    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ANON_KEY,
      isServerMode: true
    });

    // Fetch full profile data
    const { data: profile, error: profileError } = await db.database
      .from('profiles')
      .select('*, recruiter_profiles(*), candidate_profiles(*)')
      .eq('id', userData.id)
      .single();

    if (profileError) {
       console.error(`[auth-session] Profile fetch error: ${profileError.message}`);
       throw profileError;
    }

    return new Response(JSON.stringify({
      user: {
        id: userData.id,
        email: userData.email,
        role: profile.role,
        name: profile.name,
        profile: profile
      }
    }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error(`[auth-session] Server error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}
