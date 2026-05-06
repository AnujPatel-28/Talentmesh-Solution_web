import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const search = url.searchParams.get('search');
      const status = url.searchParams.get('status');
      const isApproved = url.searchParams.get('is_approved');
      const page = parseInt(url.searchParams.get('page') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let query = insforge.database.from('jobs').select('*, companies:company_profiles(name, logo_url)', { count: 'exact' });

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (isApproved !== null) {
        query = query.eq('is_approved', isApproved === 'true');
      }

      const { data: jobs, count: total, error: jobsError } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (jobsError) throw jobsError;

      return new Response(JSON.stringify({ items: jobs, total, page, limit }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.action === 'approve') {
        const { error } = await insforge.database
          .from('jobs')
          .update({ is_approved: true, status: 'active', updated_at: new Date().toISOString() })
          .eq('id', body.id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      if (body.action === 'bulk-delete') {
        const { error } = await insforge.database.from('jobs').delete().in('id', body.ids);
        if (error) throw error;
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      const { data, error } = await insforge.database.from('jobs').insert([{
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ job: data }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
