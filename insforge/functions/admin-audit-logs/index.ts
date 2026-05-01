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
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '20');

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
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
}
