// @ts-nocheck
import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || Deno.env.get('INSFORGE_BASE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || 
                   Deno.env.get('API_KEY') || 
                   Deno.env.get('INSFORGE_ADMIN_KEY') || 
                   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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

    if (callerId !== targetUserId) {
      const adminClient = createClient({ baseUrl, anonKey: serviceKey });
      const { data: callerProfile } = await adminClient.database
        .from('profiles')
        .select('role')
        .eq('id', callerId)
        .single();
      
      const isAdmin = callerProfile?.role === 'admin' || callerProfile?.role === 'super_admin';
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
      }
    }

    // Always use admin client for data reads so service-key-only columns (e.g. avatar_url) are visible.
    // Access control is enforced at the function level (callerId/targetUserId check above).
    const adminClient = createClient({ baseUrl, anonKey: serviceKey || anonKey });

    // Use user-scoped client only for auth verification
    const dbClient = adminClient;

    // Fetch everything in parallel
    const [profileRes, candidateProfileRes, appsRes, interviewsRes, jobsRes, activityRes] = await Promise.all([
      // 1. Profile
      dbClient.database.from('profiles').select('*').eq('id', targetUserId).single(),
      // 2. Candidate Profile
      dbClient.database.from('candidate_profiles').select('*').eq('id', targetUserId).single(),
      // 3. Active Applications Count
      dbClient.database.from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', targetUserId)
        .in('status', ['applied', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'hired']),
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

    const profile = profileRes.data;

    console.log("DASHBOARD_PROFILE", {
      userId: callerId,
      profileId: profile?.id,
      avatarUrl: profile?.avatar_url,
      email: profile?.email
    });

    console.log("PROFILE_QUERY_RESULT", profile);

    console.log("DASHBOARD_USER_ID_VERIFICATION", {
      authUserId: callerId,
      profileId: profile?.id,
      isEqual: callerId === profile?.id
    });


    // Rank jobs by skills match
    const candidateSkills = candidateProfileRes.data?.skills || [];
    const rankedJobs = (jobsRes.data || []).map((job: any) => {
      const jobSkills = job.skills_required || [];
      const matchingSkills = jobSkills.filter((s: string) => candidateSkills.includes(s));
      const score = (matchingSkills.length / Math.max(1, jobSkills.length)) * 100;
      return { ...job, matchScore: score, match_score: score };
    }).sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));

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
