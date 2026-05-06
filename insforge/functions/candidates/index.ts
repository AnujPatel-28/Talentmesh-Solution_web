import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const skills = url.searchParams.get('skills')?.split(',') || [];
    const location = url.searchParams.get('location') || '';
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = 20;

    const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

    let query = insforgeAdmin.database
      .from('profiles')
      .select('*, candidate_profiles!inner(*)')
      .eq('role', 'candidate');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    // Note: Skill filtering might be complex depending on schema (array vs text)
    // For now, simple ilike check if skills is passed
    if (skills.length > 0) {
      // Assuming skills is an array column in candidate_profiles
      query = query.contains('candidate_profiles.skills', skills);
    }

    const { data: candidates, error, count } = await query
      .range(page * limit, (page + 1) * limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      data: candidates.map(c => ({
        id: c.id,
        name: c.name,
        role: c.candidate_profiles?.headline || 'Candidate',
        location: c.location,
        skills: c.candidate_profiles?.skills || [],
        match: 85 + Math.floor(Math.random() * 15), // Mock AI match until per-job logic integrated
        avatar_url: c.avatar_url
      })),
      total: count,
      hasMore: candidates.length === limit
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error('Candidates Fetch Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
