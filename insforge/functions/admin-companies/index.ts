import { createClient } from 'npm:@insforge/sdk';

// Environment variables from Deno environment
const INSFORGE_URL = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const INSFORGE_ANON_KEY = Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;
const INSFORGE_ADMIN_KEY = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('API_KEY'); // Service role key for RLS bypass

export default async function handler(request: Request): Promise<Response> {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: corsHeaders });
  }

  try {
    // 1. Validate the user session via direct REST call (bypass SDK refresh issues)
    const userRes = await fetch(`${INSFORGE_URL}/api/auth/user`, {
      headers: { 
        'Authorization': authHeader,
        'apikey': INSFORGE_ANON_KEY
      }
    });

    if (!userRes.ok) {
      const errData = await userRes.json();
      return new Response(JSON.stringify({ error: 'Unauthorized', details: errData }), { status: 401, headers: corsHeaders });
    }

    const userData = await userRes.json();
    
    // Ensure the user is an admin
    if (userData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: corsHeaders });
    }

    // 2. Initialize Database Client with Admin Key to bypass RLS
    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ADMIN_KEY || INSFORGE_ANON_KEY, // Use service role key if available
      isServerMode: true
    });

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Handle GET: List companies
    if (request.method === 'GET') {
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      
      let query = db.database.from('companies').select('*', { count: 'exact' });
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;
      
      return new Response(JSON.stringify({ companies: data, total: count }), { status: 200, headers: corsHeaders });
    }

    // Handle POST: Create company
    if (request.method === 'POST') {
      const body = await request.json();
      
      if (!body.name) {
        return new Response(JSON.stringify({ error: 'Company name is required' }), { status: 400, headers: corsHeaders });
      }

      const { data, error } = await db.database
        .from('companies')
        .insert([{
          name: body.name,
          logo_url: body.logo_url || null,
          website: body.website || null,
          industry: body.industry || null,
          size: body.size || null,
          description: body.description || null,
          location: body.location || null,
          is_verified: body.is_verified === true,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      return new Response(JSON.stringify({ company: data }), { status: 201, headers: corsHeaders });
    }

    // Handle PATCH: Update company
    if (request.method === 'PATCH') {
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers: corsHeaders });
      
      const body = await request.json();
      const { data, error } = await db.database
        .from('companies')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ company: data }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (error: any) {
    console.error('[admin-companies] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}
