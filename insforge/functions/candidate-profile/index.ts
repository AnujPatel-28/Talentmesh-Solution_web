import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const candidateProfileSchema = z.object({
  profile: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    about: z.string().optional(),
    avatar_url: z.string().url().optional().or(z.literal('')),
  }).optional(),
  candidateProfile: z.object({
    headline: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience_years: z.number().nonnegative().nullable().optional(),
    education: z.string().optional(),
    resume_url: z.string().url().optional().or(z.literal('')),
    linkedin_url: z.string().url().optional().or(z.literal('')),
    github_url: z.string().url().optional().or(z.literal('')),
    portfolio_url: z.string().url().optional().or(z.literal('')),
    salary_min: z.number().nonnegative().nullable().optional(),
    salary_max: z.number().nonnegative().nullable().optional(),
    preferred_locations: z.array(z.string()).optional(),
    is_visible: z.boolean().optional(),
  }).optional(),
});

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || Deno.env.get('SUPABASE_URL') || '';
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  const resolvedServiceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || req.headers.get('x-insforge-service-key') || '';

  const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
  const insforgeAdmin = createClient({ baseUrl, anonKey: resolvedServiceKey || anonKey, isServerMode: true });

  const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    const { data: profile, error: profileError } = await insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).single();
    if (profileError) {
      console.error('[candidate-profile] Error fetching profile:', profileError.message);
    }
    const { data: candidateProfile, error: cpError } = await insforgeAdmin.database.from('candidate_profiles').select('*').eq('id', user.id).single();
    if (cpError) {
      console.error('[candidate-profile] Error fetching candidate profile:', cpError.message);
    }

    return new Response(JSON.stringify({ 
      profile, 
      candidateProfile, 
      debug: { 
        hasServiceKey: !!resolvedServiceKey,
        profileError: profileError ? profileError.message : null,
        cpError: cpError ? cpError.message : null
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  if (req.method === 'PUT') {
    const body = await req.json();
    const validation = candidateProfileSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: validation.error.flatten() }), { status: 400, headers: corsHeaders });
    }

    const { profile: profileUpdates, candidateProfile: candidateUpdates } = validation.data;

    if (profileUpdates) {
      const { error } = await insforgeAdmin.database.from('profiles').update(profileUpdates).eq('id', user.id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    if (candidateUpdates) {
      const { error } = await insforgeAdmin.database.from('candidate_profiles').upsert({
        id: user.id,
        user_id: user.id,
        ...candidateUpdates,
        updated_at: new Date().toISOString()
      });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    const { data: profile } = await insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).single();
    let { data: candidateProfile } = await insforgeAdmin.database.from('candidate_profiles').select('*').eq('id', user.id).single();

    return new Response(JSON.stringify({ profile, candidateProfile }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
