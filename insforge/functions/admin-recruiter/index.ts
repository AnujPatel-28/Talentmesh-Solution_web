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
    const { action, requestId } = await req.json();
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });

    // Verify admin role (simplified for now, ideally check user profile)
    // const { data: profile } = await insforge.auth.getUser();

    if (action === 'list') {
      const { data, error } = await insforge.database
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'approve') {
      if (!requestId) {
        return new Response(JSON.stringify({ error: 'Missing requestId' }), { status: 400 });
      }

      // 1. Get request details
      const { data: request, error: fetchError } = await insforge.database
        .from('access_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) throw new Error('Request not found');

      // 2. Update request status
      const { error: updateError } = await insforge.database
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 3. Create recruiter profile or user if needed
      // (This logic would be more complex in a real app, e.g. inviting the user)

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err: any) {
    console.error('Admin Recruiter Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
}
