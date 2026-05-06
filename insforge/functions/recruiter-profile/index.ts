import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const recruiterProfileSchema = z.object({
  profile: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar_url: z.string().url().optional().or(z.literal('')),
  }).optional(),
  recruiterProfile: z.object({
    job_title: z.string().optional(),
    department: z.string().optional(),
    linkedin_url: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'Access-Control-Allow-Credentials': 'true',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
  const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

  const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    const [profileRes, recruiterRes] = await Promise.all([
      insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).single(),
      insforgeAdmin.database.from('recruiter_profiles').select('*').eq('user_id', user.id).single(),
    ]);

    return new Response(JSON.stringify({ 
      profile: profileRes.data, 
      recruiterProfile: recruiterRes.data 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const body = await req.json();
    const validation = recruiterProfileSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: validation.error.flatten() }), { status: 400, headers: corsHeaders });
    }

    const { profile: profileUpdates, recruiterProfile: recruiterUpdates } = validation.data;

    if (profileUpdates) {
      const { error } = await insforgeAdmin.database.from('profiles').update(profileUpdates).eq('id', user.id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    if (recruiterUpdates) {
      const { error } = await insforgeAdmin.database.from('recruiter_profiles').upsert({
        ...recruiterUpdates,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    const [profileRes, recruiterRes] = await Promise.all([
      insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).single(),
      insforgeAdmin.database.from('recruiter_profiles').select('*').eq('user_id', user.id).single(),
    ]);

    return new Response(JSON.stringify({ 
      profile: profileRes.data, 
      recruiterProfile: recruiterRes.data 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
