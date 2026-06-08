import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    let userData;
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      userData = { id: payload.sub, email: payload.email, role: payload.role };
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token format' }), { status: 401 });
    }

    if (!userData || !userData.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || 
                       Deno.env.get('INSFORGE_ADMIN_KEY') || 
                       req.headers.get('x-insforge-service-key') || 
                       Deno.env.get('INSFORGE_ANON_KEY') || 
                       Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY');

    const insforgeAdmin = createClient({
      baseUrl,
      anonKey: serviceKey!,
      isServerMode: true
    });

    // Verify user is admin or super_admin
    const { data: profiles, error: profileError } = await insforgeAdmin.database
      .from('profiles')
      .select('role')
      .eq('id', userData.id);

    if (profileError && (profileError.message || profileError.code)) throw profileError;

    const profile = profiles?.[0];
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const search = url.searchParams.get('search') || '';
      const page = parseInt(url.searchParams.get('page') || '0');
      const requestedLimit = parseInt(url.searchParams.get('limit') || '20');
      const limit = Math.min(requestedLimit, 100);

      let matchedActorIds: string[] = [];
      if (search) {
        // Query profiles matching the search string (name or email)
        const { data: matchedProfiles, error: matchError } = await insforgeAdmin.database
          .from('profiles')
          .select('id')
          .or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        
        if (matchError && (matchError.message || matchError.code)) throw matchError;
        
        if (matchedProfiles && matchedProfiles.length > 0) {
          matchedActorIds = matchedProfiles.map((p: any) => p.id);
        }
      }

      let query = insforgeAdmin.database
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (search) {
        if (matchedActorIds.length > 0) {
          query = query.or(`action.ilike.%${search}%,table_name.ilike.%${search}%,actor_id.in.(${matchedActorIds.join(',')})`);
        } else {
          query = query.or(`action.ilike.%${search}%,table_name.ilike.%${search}%`);
        }
      }

      const { data: logs, count: total, error } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error && (error.message || error.code)) throw error;

      const results = logs || [];
      const actorIdsToFetch = [...new Set(results.map((l: any) => l.actor_id).filter(Boolean))];

      let profileMap: Record<string, { name: string, email: string }> = {};
      if (actorIdsToFetch.length > 0) {
        const { data: profilesList, error: pError } = await insforgeAdmin.database
          .from('profiles')
          .select('id, name, email')
          .in('id', actorIdsToFetch);
        
        if (pError && (pError.message || pError.code)) throw pError;
        
        if (profilesList) {
          profilesList.forEach((p: any) => {
            profileMap[p.id] = { name: p.name || 'System Admin', email: p.email || '' };
          });
        }
      }

      const formattedLogs = results.map((log: any) => ({
        id: log.id,
        actor_id: log.actor_id,
        action: log.action,
        table_name: log.table_name || '',
        record_id: log.record_id || '',
        old_data: log.old_data,
        new_data: log.new_data,
        created_at: log.created_at,
        ip_address: log.ip_address || '',
        actor: profileMap[log.actor_id] || { name: 'System Admin', email: '' }
      }));

      return new Response(JSON.stringify({ logs: formattedLogs, total: total || 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err: any) {
    console.error('Admin Audit Logs Edge Function Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message || String(err), stack: err.stack }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
