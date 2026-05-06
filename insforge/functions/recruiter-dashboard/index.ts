import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = authData.user.id;
    const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

    // Parallel fetching
    const [jobsRes, appsRes, candidatesRes] = await Promise.all([
      insforgeAdmin.database.from('jobs').select('*, companies:company_profiles(*)').eq('recruiter_id', userId).order('created_at', { ascending: false }),
      insforgeAdmin.database.from('applications').select('*, jobs!inner(*), profiles:candidate_profiles(*)').eq('jobs.recruiter_id', userId),
      insforgeAdmin.database.from('profiles').select('*, candidate_profiles(*)').eq('role', 'candidate').limit(10)
    ]);

    const jobs = jobsRes.data || [];
    const apps = appsRes.data || [];
    
    // Pipeline stats
    const pipeline = [
      { label: 'Applied', count: apps.filter(a => a.status === 'applied').length, color: '#3b82f6' },
      { label: 'Reviewing', count: apps.filter(a => a.status === 'reviewing').length, color: '#6366f1' },
      { label: 'Shortlisted', count: apps.filter(a => a.status === 'shortlisted').length, color: '#7c3aed' },
      { label: 'Interviewing', count: apps.filter(a => a.status === 'interviewing').length, color: '#f59e0b' },
      { label: 'Offered', count: apps.filter(a => a.status === 'offered').length, color: '#10b981' },
    ];

    const stats = {
      openJobs: jobs.filter(j => j.status === 'active').length,
      totalApplicants: apps.length,
      interviewsThisWeek: apps.filter(a => a.status === 'interviewing').length, // Simple proxy
      hires: apps.filter(a => a.status === 'hired').length
    };

    const dashboardData = {
      stats,
      pipeline,
      recentJobs: jobs.slice(0, 5).map(j => ({
        id: j.id,
        title: j.title,
        status: j.status,
        applicants: j.applications_count || 0,
        new_applicants: 0 // Would need timestamp comparison
      })),
      topCandidates: (candidatesRes.data || []).slice(0, 5).map(c => ({
        id: c.id,
        name: c.name,
        role: c.candidate_profiles?.headline || 'Candidate',
        skills: c.candidate_profiles?.skills || [],
        match: 85 + Math.floor(Math.random() * 10) // Mock match for now until Feature 05 used
      }))
    };

    return new Response(JSON.stringify(dashboardData), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error('Recruiter Dashboard Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
