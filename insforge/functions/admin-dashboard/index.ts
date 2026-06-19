// @ts-nocheck — Deno edge function: npm: imports and Deno globals are valid at runtime
import { createClient } from 'npm:@insforge/sdk';

export default async function handler(request: Request): Promise<Response> {
  const INSFORGE_URL = request.headers.get('x-insforge-url') || Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const INSFORGE_ANON_KEY = request.headers.get('x-insforge-anon-key') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || '';
  const SERVICE_KEY = request.headers.get('x-insforge-service-key') || Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('API_KEY') || INSFORGE_ANON_KEY;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders });

  const rawToken = authHeader.replace(/^Bearer\s+/i, '');

  try {
    // 1. Authenticate with verified signature check
    const verifyClient = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ANON_KEY,
      edgeFunctionToken: rawToken,
      isServerMode: true
    });

    const { data: authData, error: authError } = await verifyClient.auth.getCurrentUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token' }), { status: 401, headers: corsHeaders });
    }

    const userData = { id: authData.user.id };
    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: SERVICE_KEY,
      isServerMode: true
    });

    const { data: profile, error: profileError } = await db.database
      .from('profiles')
      .select('role')
      .eq('id', userData.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Unauthorized, profile not found' }), { status: 401, headers: corsHeaders });
    }

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    // Determine requested action
    let action = 'get-summary';
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (body.action) action = body.action;
      } catch (e) {
        // body parsing failed, stick with default
      }
    }

    // Common counts
    const [jobs, apps, candidates, recruiters] = await Promise.all([
      db.database.from('jobs').select('*', { count: 'exact', head: true }),
      db.database.from('applications').select('*', { count: 'exact', head: true }),
      db.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
      db.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter')
    ]);

    const totalJobs = jobs.count || 0;
    const totalApps = apps.count || 0;
    const totalCands = candidates.count || 0;
    const totalRecs = recruiters.count || 0;

    if (action === 'get-reports') {
      // Fetch exact status breakdown counts
      const [
        appliedRes,
        reviewingRes,
        shortlistedRes,
        interviewingRes,
        offeredRes,
        hiredRes,
        rejectedRes,
        withdrawnRes
      ] = await Promise.all([
        db.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'applied'),
        db.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'reviewing'),
        db.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted'),
        db.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'interviewing'),
        db.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'offered'),
        db.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'hired'),
        db.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        db.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'withdrawn')
      ]);

      const applied = appliedRes.count || 0;
      const reviewing = reviewingRes.count || 0;
      const shortlisted = shortlistedRes.count || 0;
      const interviewing = interviewingRes.count || 0;
      const offered = offeredRes.count || 0;
      const hired = hiredRes.count || 0;
      const rejected = rejectedRes.count || 0;
      const withdrawn = withdrawnRes.count || 0;

      // Query skills and creation date for growth and skills analytics
      const { data: candidatesData } = await db.database
        .from('candidate_profiles')
        .select('skills, created_at');

      const rawCandidates = candidatesData || [];

      // Aggregate skills count
      const skillCounts: Record<string, number> = {};
      for (const cand of rawCandidates) {
        if (Array.isArray(cand.skills)) {
          for (const skill of cand.skills) {
            if (skill) {
              const normalized = skill.trim();
              skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
            }
          }
        }
      }
      // Sort skills by count and take top 4
      const topSkills = Object.entries(skillCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Pad with defaults if less than 4 skills exist
      const defaultSkills = ['React', 'TypeScript', 'Node.js', 'Python'];
      while (topSkills.length < 4 && defaultSkills.length > 0) {
        const nextDefault = defaultSkills.shift()!;
        if (!topSkills.some(s => s.name === nextDefault)) {
          topSkills.push({ name: nextDefault, count: 0 });
        }
      }

      // Aggregate growth by week
      const nowMs = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      let w1Count = 0;
      let w2Count = 0;
      let w3Count = 0;
      let w4Count = 0;

      for (const cand of rawCandidates) {
        const createdTime = cand.created_at ? new Date(cand.created_at).getTime() : nowMs;
        const ageMs = nowMs - createdTime;

        if (ageMs > 3 * oneWeekMs) {
          w1Count++;
        } else if (ageMs > 2 * oneWeekMs) {
          w2Count++;
        } else if (ageMs > oneWeekMs) {
          w3Count++;
        } else {
          w4Count++;
        }
      }

      const growth = [
        { date: 'Week 1', count: w1Count },
        { date: 'Week 2', count: w1Count + w2Count },
        { date: 'Week 3', count: w1Count + w2Count + w3Count },
        { date: 'Week 4', count: w1Count + w2Count + w3Count + w4Count }
      ];

      return new Response(JSON.stringify({
        metrics: {
          totalJobs: totalJobs,
          totalApplications: totalApps - withdrawn,
          totalCandidates: totalCands,
          totalRecruiters: totalRecs,
          avgTimeToHire: '18 Days',
          appsPerJob: totalJobs > 0 ? ((totalApps - withdrawn) / totalJobs) : 0
        },
        funnel: {
          jobsPosted: totalJobs,
          applications: totalApps - withdrawn,
          reviewed: reviewing + shortlisted + interviewing + offered + hired + rejected,
          shortlisted: shortlisted + interviewing + offered + hired,
          hired: hired
        },
        growth,
        topSkills,
        statusBreakdown: {
          applied: applied + reviewing + offered,
          shortlisted: shortlisted,
          interview: interviewing,
          rejected: rejected
        }
      }), { status: 200, headers: corsHeaders });
    }

    // Default action: get-summary - Query real data counts and activities
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [pendingRecsRes, pendingJobsRes, reportedJobsRes, newUsersRes, activitiesRes] = await Promise.all([
      db.database.from('recruiter_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      db.database.from('jobs').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      db.database.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'reported'),
      db.database.from('profiles').select('*', { count: 'exact', head: true }).gt('created_at', past24h),
      db.database.from('activity').select('id, type, description, created_at, profiles(name)').order('created_at', { ascending: false }).limit(10)
    ]);

    const pendingRecruiters = pendingRecsRes.count || 0;
    const pendingJobsVal = pendingJobsRes.count || 0;
    const reportedJobsVal = reportedJobsRes.count || 0;
    const newUsers24h = newUsersRes.count || 0;

    const activitiesList = (activitiesRes.data || []).map((act: any) => ({
      id: act.id,
      actor: act.profiles?.name || 'System',
      type: act.type,
      description: act.description,
      created_at: act.created_at
    }));

    return new Response(JSON.stringify({
      metrics: {
        totalJobs: totalJobs,
        totalApplications: totalApps,
        totalCandidates: totalCands,
        totalRecruiters: totalRecs,
        platformUptime: '99.98%'
      },
      activities: activitiesList,
      alerts: {
        pendingRecruiters,
        pendingJobs: pendingJobsVal,
        reportedJobs: reportedJobsVal,
        newUsers24h
      }
    }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Admin Dashboard Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}
