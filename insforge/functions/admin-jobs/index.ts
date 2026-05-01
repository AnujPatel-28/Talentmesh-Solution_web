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
      const includeMeta = url.searchParams.get('includeMeta') === 'true';

      let query = insforge.database.from('jobs').select('*, companies(name, logo_url)', { count: 'exact' });

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: jobs, count: total, error: jobsError } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (jobsError) throw jobsError;

      let companies: any[] = [];
      if (includeMeta) {
        const { data: companyData, error: companyError } = await insforge.database
          .from('companies')
          .select('id, name');
        if (companyError) throw companyError;
        companies = companyData;
      }

      return new Response(JSON.stringify({ 
        items: jobs, 
        total, 
        page, 
        limit,
        companies 
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.action === 'bulk-delete') {
        const { error } = await insforge.database
          .from('jobs')
          .delete()
          .in('id', body.ids);
        if (error) throw error;
        return new Response(null, { status: 204 });
      }

      if (body.action === 'bulk-update') {
        const { error } = await insforge.database
          .from('jobs')
          .update({ ...body.updates, updated_at: new Date().toISOString() })
          .in('id', body.ids);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      const { data: authData, error: userError } = await insforge.auth.getCurrentUser();
      const user = authData?.user;
      if (userError || !user) throw new Error('Unauthorized');

      const { data, error } = await insforge.database.from('jobs').insert([{
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ job: data }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'PATCH') {
       const url = new URL(req.url);
       const id = url.pathname.split('/').pop();
       const body = await req.json();

       const { data, error } = await insforge.database
         .from('jobs')
         .update({ ...body, updated_at: new Date().toISOString() })
         .eq('id', id)
         .select()
         .single();

       if (error) throw error;
       return new Response(JSON.stringify({ job: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
       const url = new URL(req.url);
       const id = url.pathname.split('/').pop();

       const { error } = await insforge.database
         .from('jobs')
         .delete()
         .eq('id', id);

       if (error) throw error;
       return new Response(null, { status: 204 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err: any) {
    console.error('Admin Jobs Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
}
