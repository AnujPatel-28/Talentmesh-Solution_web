// @ts-nocheck
import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const recruiterProfileSchema = z.object({
  profile: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar_url: z.string().optional().or(z.literal('')),
  }).optional(),
  recruiterProfile: z.object({
    job_title: z.string().optional(),
    department: z.string().optional(),
    linkedin_url: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-insforge-service-key',
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

  const resolvedServiceKey = req.headers.get('x-insforge-service-key') || 
                             Deno.env.get('INSFORGE_SERVICE_KEY') || 
                             Deno.env.get('INSFORGE_ADMIN_KEY') || 
                             Deno.env.get('API_KEY') || 
                             anonKey;

  const insforge = createClient({ baseUrl, anonKey });
  insforge.setAccessToken(token);
  const insforgeAdmin = createClient({ baseUrl, anonKey: resolvedServiceKey });

  const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    const { data: profile } = await insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).maybeSingle();
    let { data: recruiterProfile } = await insforgeAdmin.database
      .from('recruiter_profiles')
      .select('*, companies(name)')
      .eq('id', user.id)
      .maybeSingle();

    return new Response(JSON.stringify({ 
      profile: profile, 
      recruiterProfile: recruiterProfile 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid or missing JSON body' }), { status: 400, headers: corsHeaders });
    }

    // 1. Handle complete_onboarding action
    if (body.action === 'complete_onboarding') {
      const { error } = await insforgeAdmin.database
        .from('profiles')
        .update({ completed_onboarding: true })
        .eq('id', user.id);
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. Handle onboarding setup form inputs at the root level: { name, companyName, jobTitle, department }
    let profileUpdates: any = {};
    let recruiterUpdates: any = {};

    if (body.name) {
      profileUpdates.name = body.name;
    }

    if (body.jobTitle) {
      recruiterUpdates.job_title = body.jobTitle;
    }

    if (body.department) {
      recruiterUpdates.department = body.department;
    }

    if (body.companyName) {
      // Find or create company
      const { data: existingCompany } = await insforgeAdmin.database
        .from('companies')
        .select('id')
        .eq('name', body.companyName)
        .maybeSingle();

      let companyId;
      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error: createError } = await insforgeAdmin.database
          .from('companies')
          .insert([{ name: body.companyName }])
          .select('id')
          .single();
        
        if (createError) {
          return new Response(JSON.stringify({ error: 'Failed to create company: ' + createError.message }), { status: 500, headers: corsHeaders });
        }
        companyId = newCompany.id;
      }
      recruiterUpdates.company_id = companyId;
    }

    // 3. Handle nesting format if it's sent as { profile: {...}, recruiterProfile: {...} }
    if (body.profile) {
      profileUpdates = { ...profileUpdates, ...body.profile };
    }
    if (body.recruiterProfile) {
      recruiterUpdates = { ...recruiterUpdates, ...body.recruiterProfile };
    }

    // 4. Perform database updates
    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await insforgeAdmin.database.from('profiles').update(profileUpdates).eq('id', user.id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    if (Object.keys(recruiterUpdates).length > 0) {
      // Make sure the recruiter_profiles row exists
      const { data: existingRec } = await insforgeAdmin.database.from('recruiter_profiles').select('id').eq('id', user.id).maybeSingle();
      if (!existingRec) {
        const { error } = await insforgeAdmin.database.from('recruiter_profiles').insert([{ id: user.id, ...recruiterUpdates }]);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      } else {
        const { error } = await insforgeAdmin.database.from('recruiter_profiles').update({
          ...recruiterUpdates,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
    }

    const { data: profileRes } = await insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).single();
    let { data: recruiterProfile } = await insforgeAdmin.database.from('recruiter_profiles').select('*').eq('id', user.id).single();

    return new Response(JSON.stringify({ 
      profile: profileRes, 
      recruiterProfile: recruiterProfile 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
