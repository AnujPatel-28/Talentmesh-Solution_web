import { createClient } from 'npm:@insforge/sdk';

const INSFORGE_URL = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const INSFORGE_ANON_KEY = Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;
const INSFORGE_ADMIN_KEY = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('API_KEY');

export default async function handler(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders });

  try {
    const userRes = await fetch(`${INSFORGE_URL}/api/auth/user`, {
      headers: { 
        'Authorization': authHeader,
        'apikey': INSFORGE_ANON_KEY
      }
    });

    if (!userRes.ok) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const userData = await userRes.json();
    if (userData.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });

    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ADMIN_KEY || INSFORGE_ANON_KEY,
      isServerMode: true
    });

    const url = new URL(request.url);

    if (request.method === 'GET') {
      const search = url.searchParams.get('search');
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let query = db.database.from('jobs').select('*, companies!jobs_company_id_fkey(*)', { count: 'exact' });

      if (search) query = query.ilike('title', `%${search}%`);
      if (status) query = query.eq('status', status);

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;
      return new Response(JSON.stringify({ jobs: data, total: count }), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'PATCH') {
      const id = url.searchParams.get('id');
      const body = await request.json();
      if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers: corsHeaders });

      const { data, error } = await db.database.from('jobs').update(body).eq('id', id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ job: data }), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers: corsHeaders });
      const { error } = await db.database.from('jobs').delete().eq('id', id);
      if (error) throw error;
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}
