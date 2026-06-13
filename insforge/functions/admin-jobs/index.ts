// @ts-nocheck — Deno edge function: npm: imports and Deno globals are valid at runtime
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

    const verifyClient = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ANON_KEY,
      edgeFunctionToken: rawToken,
      isServerMode: true
    });

    const { data: authData, error: authError } = await verifyClient.auth.getCurrentUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token' }), { status: 401, headers: corsHeaders });
    }

    const userData = { id: authData.user.id };

    const { data: profile, error: profileError } = await db.database
      .from('profiles')
      .select('role, is_active')
      .eq('id', userData.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Unauthorized, profile not found' }), { status: 401, headers: corsHeaders });
    }

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    if (profile?.is_active !== true) {
      return new Response(JSON.stringify({ error: 'Forbidden, account is suspended' }), { status: 403, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === 'GET') {
      const search = url.searchParams.get('search');
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let query = db.database.from('jobs').select('*, companies!jobs_company_id_fkey(*)', { count: 'exact' });

      if (search) query = query.ilike('title', `%${search}%`);
      if (status) {
        if (status === 'pending') {
          query = query.eq('is_approved', false).eq('status', 'active');
        } else if (status === 'active') {
          query = query.eq('is_approved', true).eq('status', 'active');
        } else if (status === 'rejected') {
          query = query.eq('is_approved', false).eq('status', 'closed');
        } else {
          query = query.eq('status', status);
        }
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      let compData = null;
      if (url.searchParams.get('includeMeta') === 'true') {
        const { data: companiesData } = await db.database.from('companies').select('id, name');
        compData = companiesData;
      }

      return new Response(JSON.stringify({ items: data, total: count, companies: compData }), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'PATCH') {
      const id = url.searchParams.get('id');
      const body = await request.json();
      if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers: corsHeaders });

      const { data, error } = await db.database.from('jobs').update(body).eq('id', id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ job: data }), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { action, id, ids, updates, ...jobData } = body;
      
      if (action === 'approve') {
        if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers: corsHeaders });
        const { error } = await db.database.from('jobs').update({ is_approved: true, status: 'active' }).eq('id', id);
        if (error) throw error;
        
        // Log to audit log
        try {
          await db.database.from('audit_log').insert([{
            entity_type: 'job',
            entity_id: id,
            action: 'approve',
            performed_by: userData.id,
            metadata: { reason: body.reason || 'Admin approved job listing' }
          }]);
        } catch (e) {
          console.warn('Failed to insert audit log entry:', e);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      if (action === 'reject') {
        if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers: corsHeaders });
        const { error } = await db.database.from('jobs').update({ is_approved: false, status: 'closed' }).eq('id', id);
        if (error) throw error;

        // Log to audit log
        try {
          await db.database.from('audit_log').insert([{
            entity_type: 'job',
            entity_id: id,
            action: 'reject',
            performed_by: userData.id,
            metadata: { reason: body.reason || 'Admin rejected job listing' }
          }]);
        } catch (e) {
          console.warn('Failed to insert audit log entry:', e);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      if (action === 'bulk-update' && ids) {
        const { error } = await db.database.from('jobs').update(updates).in('id', ids);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      if (action === 'bulk-delete' && ids) {
        const { error } = await db.database.from('jobs').delete().in('id', ids);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      // Default Create
      const { data, error } = await db.database.from('jobs').insert(jobData).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ job: data }), { status: 201, headers: corsHeaders });
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
