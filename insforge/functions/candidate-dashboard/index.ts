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

    const callerId = authData.user.id;
    let targetUserId = callerId;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.candidate_id) {
          targetUserId = body.candidate_id;
        }
      } catch (e) {
        // Ignore json parse error
      }
    }

    // Use user-scoped client if querying own data to prevent UUID casting errors on auth.uid() in RLS
    const dbClient = targetUserId === callerId 
      ? createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true }) 
      : createClient({ baseUrl, anonKey: serviceKey });

    // Fetch everything in parallel
    const [profileRes, candidateProfileRes, appsRes, interviewsRes, jobsRes, activityRes] = await Promise.all([
      // 1. Profile
      dbClient.database.from('profiles').select('*').eq('id', targetUserId).single(),
      // 2. Candidate Profile
      dbClient.database.from('candidate_profiles').select('*').eq('id', targetUserId).single(),
      // 3. Applications Count
      dbClient.database.from('applications').select('*', { count: 'exact', head: true }).eq('candidate_id', targetUserId),
      // 4. Interviews
      dbClient.database.from('interviews')
        .select('*, applications(jobs(title, companies(name)))')
        .eq('candidate_id', targetUserId)
        .order('scheduled_at', { ascending: true }),
      // 5. Recommended Jobs (Active) - Calling our new recommendations logic
      dbClient.database.from('jobs').select('*, companies(name, logo_url)').eq('status', 'active').limit(5),
      // 6. Recent Activity
      dbClient.database.from('activity').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(5)
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
