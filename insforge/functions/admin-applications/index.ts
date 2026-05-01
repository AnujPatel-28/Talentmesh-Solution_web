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
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let query = insforge.database.from('applications').select('*, jobs(title, companies(name)), profiles(name, email)', { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: applications, count: total, error } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      return new Response(JSON.stringify({ applications, total }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'PATCH') {
       const url = new URL(req.url);
       const id = url.pathname.split('/').pop();
       const body = await req.json();

       const { data, error } = await insforge.database
         .from('applications')
         .update({ ...body, updated_at: new Date().toISOString() })
         .eq('id', id)
         .select()
         .single();

       if (error) throw error;
       return new Response(JSON.stringify({ application: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
       const url = new URL(req.url);
       const id = url.pathname.split('/').pop();

       const { error } = await insforge.database
         .from('applications')
         .delete()
         .eq('id', id);

       if (error) throw error;
       return new Response(null, { status: 204 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err: any) {
    console.error('Admin Applications Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
}
