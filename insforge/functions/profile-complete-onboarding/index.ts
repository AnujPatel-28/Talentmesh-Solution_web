import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const insforge = createClient({ baseUrl, anonKey });

    let userId: string | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        userId = body.userId || null;
      } catch {
        // Body may be empty
      }
    }

    if (!userId) {
      const token = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
      
      const client = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
      const { data, error } = await client.auth.getCurrentUser();
      
      if (error || !data?.user) {
        return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
      userId = data.user.id;
    }

    const { error: updateError } = await insforge.database
      .from('profiles')
      .update({ completed_onboarding: true, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Failed to complete onboarding' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
