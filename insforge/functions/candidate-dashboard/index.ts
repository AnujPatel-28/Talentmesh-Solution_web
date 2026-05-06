import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || 'http://localhost:3000';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user || authData.user.id === 'project-admin-with-api-key') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = authData.user.id;
    const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

    // Fetch everything in parallel
    const [profileRes, candidateProfileRes, appsRes, interviewsRes, jobsRes, activityRes] = await Promise.all([
      // 1. Profile
      insforgeAdmin.database.from('profiles').select('*').eq('id', userId).single(),
      // 2. Candidate Profile
      insforgeAdmin.database.from('candidate_profiles').select('*').eq('user_id', userId).single(),
      // 3. Applications Count
      insforgeAdmin.database.from('applications').select('*', { count: 'exact', head: true }).eq('candidate_id', userId),
      // 4. Interviews
      insforgeAdmin.database.from('interviews')
        .select('*, applications(jobs(title, companies(name)))')
        .eq('candidate_id', userId)
        .order('scheduled_at', { ascending: true }),
      // 5. Recommended Jobs (Active) - Calling our new recommendations logic
      insforgeAdmin.database.from('jobs').select('*, companies:company_profiles(name, logo_url)').eq('status', 'active').limit(5),
      // 6. Recent Activity
      insforgeAdmin.database.from('activity').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
    ]);

    // Rank jobs by skills match
    const candidateSkills = candidateProfileRes.data?.skills || [];
    const rankedJobs = (jobsRes.data || []).map(job => {
      const jobSkills = job.skills_required || [];
      const matchingSkills = jobSkills.filter((s: string) => candidateSkills.includes(s));
      const score = (matchingSkills.length / Math.max(1, jobSkills.length)) * 100;
      return { ...job, matchScore: score };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    const dashboardData = {
      profile: profileRes.data,
      candidateProfile: candidateProfileRes.data,
      appCount: appsRes.count || 0,
      interviews: interviewsRes.data || [],
      jobs: rankedJobs,
      activity: activityRes.data || [],
    };

    return new Response(JSON.stringify(dashboardData), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error('Candidate Dashboard Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
