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
    const serviceKey = req.headers.get('x-insforge-service-key') || Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY');
    const insforge = createClient({ 
      baseUrl, 
      anonKey: serviceKey!,
      edgeFunctionToken: token,
      isServerMode: true 
    });

    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token' }), { status: 401 });
    }
    const userData = { id: user.id };

    const { data: profile } = await insforge.database
      .from('profiles')
      .select('role')
      .eq('id', userData.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '0');
      const requestedLimit = parseInt(url.searchParams.get('limit') || '20');
      const limit = Math.min(requestedLimit, 100);

      let query = insforge.database.from('audit_logs').select('*, profiles(name, email)', { count: 'exact' });

      if (search) {
        query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%,profiles.name.ilike.%${search}%`);
      }

      const { data: logs, count: total, error } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      return new Response(JSON.stringify({ logs, total }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err: any) {
    console.error('Admin Audit Logs Edge Function Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
