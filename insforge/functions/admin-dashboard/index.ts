import { createClient } from 'npm:@insforge/sdk';

const INSFORGE_URL = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const INSFORGE_ANON_KEY = Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('API_KEY') || INSFORGE_ANON_KEY;

export default async function handler(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: SERVICE_KEY,
      isServerMode: true
    });

    // Run all counts in parallel
    const [jobs, apps, candidates, recruiters] = await Promise.all([
      db.database.from('jobs').select('*', { count: 'exact', head: true }),
      db.database.from('applications').select('*', { count: 'exact', head: true }),
      db.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
      db.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter')
    ]);

    return new Response(JSON.stringify({
      metrics: {
        totalJobs: jobs.count || 0,
        totalApplications: apps.count || 0,
        totalCandidates: candidates.count || 0,
        totalRecruiters: recruiters.count || 0,
        platformUptime: '99.98%'
      },
      activities: [],
      alerts: { pendingRecruiters: 0, pendingJobs: 0, reportedJobs: 0 }
    }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}
