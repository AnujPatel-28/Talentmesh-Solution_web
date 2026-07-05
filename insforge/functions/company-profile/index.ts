import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-insforge-service-key',
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
    const resolvedServiceKey = req.headers.get('x-insforge-service-key') || 
                               Deno.env.get('INSFORGE_SERVICE_KEY') || 
                               Deno.env.get('INSFORGE_ADMIN_KEY') || 
                               Deno.env.get('API_KEY') || 
                               anonKey;

    const insforge = createClient({ baseUrl, anonKey });
    insforge.setAccessToken(token);
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = authData.user.id;
    const insforgeAdmin = createClient({ baseUrl, anonKey: resolvedServiceKey, isServerMode: true });

    if (req.method === 'GET') {
      // 1. Get the user's company_id from profiles
      const { data: profile, error: profileErr } = await insforgeAdmin.database
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (profileErr) {
        console.error('Profile fetch error:', profileErr);
        return new Response(JSON.stringify({ company: null }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      if (!profile?.company_id) {
        // No company linked yet
        return new Response(JSON.stringify({ company: null }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // 2. Fetch company data
      const { data: company, error: compErr } = await insforgeAdmin.database
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (compErr) {
        console.error('Company fetch error:', compErr);
      }

      return new Response(JSON.stringify({ company }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await req.json();
      
      // 1. Check if user already has a company
      const { data: profile } = await insforgeAdmin.database
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      let company;
      let error;

      if (profile?.company_id) {
        // UPDATE existing company
        const result = await insforgeAdmin.database
          .from('companies')
          .update({
            name: body.name,
            industry: body.industry,
            website: body.website,
            logo_url: body.logo_url,
          })
          .eq('id', profile.company_id)
          .select()
          .single();

        company = result.data;
        error = result.error;
      } else {
        // INSERT new company
        const result = await insforgeAdmin.database
          .from('companies')
          .insert([{
            name: body.name || 'My Company',
            industry: body.industry,
            website: body.website,
            logo_url: body.logo_url,
          }])
          .select()
          .single();

        company = result.data;
        error = result.error;

        // Link the new company to the user's profile
        if (company?.id && !error) {
          await insforgeAdmin.database
            .from('profiles')
            .update({ company_id: company.id })
            .eq('id', userId);
        }
      }

      if (error) {
        console.error('Company upsert error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
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
