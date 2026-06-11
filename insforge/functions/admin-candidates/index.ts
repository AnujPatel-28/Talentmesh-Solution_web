import { createClient } from 'npm:@insforge/sdk';

export default async function handler(request: Request): Promise<Response> {
  const INSFORGE_URL = request.headers.get('x-insforge-url') || Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const INSFORGE_ANON_KEY = request.headers.get('x-insforge-anon-key') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || '';
  const SERVICE_KEY = request.headers.get('x-insforge-service-key') || Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('API_KEY') || INSFORGE_ANON_KEY;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders });

  const rawToken = authHeader.replace(/^Bearer\s+/i, '');

  try {
    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: SERVICE_KEY,
      isServerMode: true
    });

    let payload;
    try {
      const payloadBase64 = rawToken.split('.')[1];
      payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token format' }), { status: 401, headers: corsHeaders });
    }

    const userData = { id: payload.sub };

    const { data: profile, error: profileError } = await db.database
      .from('profiles')
      .select('role')
      .eq('id', userData.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Unauthorized, profile not found' }), { status: 401, headers: corsHeaders });
    }

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === 'GET') {
      const search = url.searchParams.get('search');
      const discoverable = url.searchParams.get('discoverable');
      const page = parseInt(url.searchParams.get('page') || '0');
      const requestedLimit = parseInt(url.searchParams.get('limit') || '20');
      const limit = Math.min(requestedLimit, 100);

      let selectClause = '*, candidate_profiles(*)';
      if (discoverable === 'true' || discoverable === 'false' || discoverable === 'missing_primary') {
        selectClause = '*, candidate_profiles!inner(*)';
      }

      let query = db.database.from('profiles')
        .select(selectClause, { count: 'exact' })
        .eq('role', 'candidate');

      if (search) query = query.ilike('name', `%${search}%`);

      if (discoverable === 'true') {
        query = query.eq('candidate_profiles.is_discoverable', true);
      } else if (discoverable === 'false') {
        query = query.eq('candidate_profiles.is_discoverable', false);
      } else if (discoverable === 'missing_primary') {
        query = query.filter('candidate_profiles.primary_resume_id', 'is', null);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;
      return new Response(JSON.stringify({ candidates: data, total: count }), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'PATCH') {
      const id = url.pathname.split('/').pop();
      if (!id || id === 'admin-candidates') {
        return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: corsHeaders });
      }
      const body = await request.json();

      const { data, error } = await db.database
        .from('profiles')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ candidate: data }), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: corsHeaders });

      // 1. Delete from candidate_profiles
      const { error: cpError } = await db.database
        .from('candidate_profiles')
        .delete()
        .eq('user_id', id);
      if (cpError) throw cpError;

      // 2. Delete from profiles
      const { error: pError } = await db.database
        .from('profiles')
        .delete()
        .eq('id', id);
      if (pError) throw pError;

      // 3. Delete the auth user using correct InsForge Admin API via fetch
      const adminUrl = `${INSFORGE_URL}/api/auth/users`;
      const deleteResp = await fetch(adminUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY!,
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ userIds: [id] })
      });

      if (!deleteResp.ok) {
        const errData = await deleteResp.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to delete user via Admin API');
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}
