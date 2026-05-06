import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  try {
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = authData.user.id;
    const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

    if (req.method === 'GET') {
      const { data: company, error } = await insforgeAdmin.database
        .from('company_profiles')
        .select('*')
        .eq('recruiter_id', userId)
        .single();

      return new Response(JSON.stringify({ company }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await req.json();
      
      const { data: company, error } = await insforgeAdmin.database
        .from('company_profiles')
        .upsert({
          ...body,
          recruiter_id: userId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'recruiter_id' })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }

      // Atomic update: ensure recruiter profile is linked to this company
      if (company?.id) {
        await insforgeAdmin.database
          .from('profiles')
          .update({ company_id: company.id })
          .eq('id', userId);
      }

      return new Response(JSON.stringify({ company }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (err: any) {
    console.error('Company Profile Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
