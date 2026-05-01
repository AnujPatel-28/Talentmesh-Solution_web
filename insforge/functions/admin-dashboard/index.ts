import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { action, limit = 10 } = await req.json();
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });

    if (action === 'get-summary') {
      const [
        { count: totalJobs },
        { count: totalApplications },
        { count: totalCandidates },
        { count: totalRecruiters },
        { data: appsByStatus },
        { data: activities },
        // Alerts
        { count: pendingRecruiters },
        { count: pendingJobs },
      ] = await Promise.all([
        insforge.database.from('jobs').select('*', { count: 'exact', head: true }),
        insforge.database.from('applications').select('*', { count: 'exact', head: true }),
        insforge.database.from('candidate_profiles').select('*', { count: 'exact', head: true }),
        insforge.database.from('companies').select('*', { count: 'exact', head: true }),
        insforge.database.from('applications').select('status'),
        insforge.database.from('activity').select('*').order('created_at', { ascending: false }).limit(limit),
        insforge.database.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        insforge.database.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return new Response(JSON.stringify({
        metrics: {
          totalJobs: totalJobs || 0,
          totalApplications: totalApplications || 0,
          totalCandidates: totalCandidates || 0,
          totalRecruiters: totalRecruiters || 0,
          avgTimeToHire: '12 days',
          appsPerJob: totalJobs ? (totalApplications || 0) / (totalJobs || 0) : 0,
        },
        alerts: {
          pendingRecruiters: pendingRecruiters || 0,
          pendingJobs: pendingJobs || 0,
          reportedJobs: 0, // Placeholder
          newUsers24h: 5, // Placeholder
        },
        activities: activities || [],
        statusBreakdown: {
          applied: appsByStatus?.filter((a: any) => a.status === 'applied').length || 0,
          reviewing: appsByStatus?.filter((a: any) => a.status === 'reviewing').length || 0,
          shortlisted: appsByStatus?.filter((a: any) => a.status === 'shortlisted').length || 0,
          interview: appsByStatus?.filter((a: any) => a.status === 'interview').length || 0,
          offer: appsByStatus?.filter((a: any) => a.status === 'offer').length || 0,
          rejected: appsByStatus?.filter((a: any) => a.status === 'rejected').length || 0,
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'get-reports') {
       // Similar to above but with funnel and growth
       const [
        { count: totalJobs },
        { count: totalApplications },
        { count: totalCandidates },
        { count: totalRecruiters },
        { data: appsByStatus },
      ] = await Promise.all([
        insforge.database.from('jobs').select('*', { count: 'exact', head: true }),
        insforge.database.from('applications').select('*', { count: 'exact', head: true }),
        insforge.database.from('candidate_profiles').select('*', { count: 'exact', head: true }),
        insforge.database.from('companies').select('*', { count: 'exact', head: true }),
        insforge.database.from('applications').select('status'),
      ]);

      const funnel = {
        jobsPosted: totalJobs || 0,
        applications: totalApplications || 0,
        reviewed: appsByStatus?.filter((a: any) => a.status === 'reviewing').length || 0,
        shortlisted: appsByStatus?.filter((a: any) => a.status === 'shortlisted').length || 0,
        hired: appsByStatus?.filter((a: any) => a.status === 'offer').length || 0,
      };

      const growth = [
        { date: 'Week 1', count: 12 },
        { date: 'Week 2', count: 18 },
        { date: 'Week 3', count: 15 },
        { date: 'Week 4', count: 25 },
      ];

      return new Response(JSON.stringify({
        metrics: {
          totalJobs: totalJobs || 0,
          totalApplications: totalApplications || 0,
          totalCandidates: totalCandidates || 0,
          totalRecruiters: totalRecruiters || 0,
          avgTimeToHire: '12 days',
          appsPerJob: totalJobs ? (totalApplications || 0) / (totalJobs || 0) : 0,
        },
        funnel,
        growth,
        topSkills: [
          { name: 'React', count: 45 },
          { name: 'Node.js', count: 32 },
          { name: 'TypeScript', count: 28 },
        ],
        statusBreakdown: {
          applied: appsByStatus?.filter((a: any) => a.status === 'applied').length || 0,
          reviewing: appsByStatus?.filter((a: any) => a.status === 'reviewing').length || 0,
          shortlisted: appsByStatus?.filter((a: any) => a.status === 'shortlisted').length || 0,
          interview: appsByStatus?.filter((a: any) => a.status === 'interview').length || 0,
          offer: appsByStatus?.filter((a: any) => a.status === 'offer').length || 0,
          rejected: appsByStatus?.filter((a: any) => a.status === 'rejected').length || 0,
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err: any) {
    console.error('Admin Dashboard Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
}
