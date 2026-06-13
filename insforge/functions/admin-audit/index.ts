// @ts-nocheck — Deno edge function: npm: imports and Deno globals are valid at runtime
import { createClient } from 'npm:@insforge/sdk';

export default async function handler(request: Request): Promise<Response> {
  const INSFORGE_URL = request.headers.get('x-insforge-url') || Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const INSFORGE_ANON_KEY = request.headers.get('x-insforge-anon-key') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || '';
  const SERVICE_KEY = request.headers.get('x-insforge-service-key') || Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('API_KEY') || INSFORGE_ANON_KEY;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-request-id, x-trace-id',
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

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    const body = await request.json();
    const { 
      actor_id, 
      entity_type, 
      entity_id, 
      action, 
      before, 
      after, 
      reason 
    } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action is required' }), { status: 400, headers: corsHeaders });
    }

    // Capture requester IP from headers
    const ipAddress = request.headers.get('x-real-ip') || 
                      request.headers.get('x-forwarded-for') || 
                      '';

    // Map to public.audit_logs columns
    const logData = {
      actor_id: actor_id || userData.id,
      action: action,
      table_name: entity_type || '',
      record_id: entity_id || '',
      old_data: before || null,
      new_data: reason ? { ...(after || {}), reason } : (after || null),
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    };

    const { data, error } = await db.database
      .from('audit_logs')
      .insert([logData])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, log: data }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Admin Audit Function Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500, headers: corsHeaders });
  }
}
