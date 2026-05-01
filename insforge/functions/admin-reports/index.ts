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
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });

    // Aggregated metrics for Admin
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
      insforge.database.from('company_profiles').select('*', { count: 'exact', head: true }),
      insforge.database.from('applications').select('status'),
    ]);

    const funnel = {
      jobsPosted: totalJobs || 0,
      applications: totalApplications || 0,
      reviewed: appsByStatus?.filter((a: any) => a.status === 'reviewing').length || 0,
      shortlisted: appsByStatus?.filter((a: any) => a.status === 'shortlisted').length || 0,
      hired: appsByStatus?.filter((a: any) => a.status === 'offer').length || 0,
    };

    const statusBreakdown = {
      applied: appsByStatus?.filter((a: any) => a.status === 'applied').length || 0,
      reviewing: appsByStatus?.filter((a: any) => a.status === 'reviewing').length || 0,
      shortlisted: appsByStatus?.filter((a: any) => a.status === 'shortlisted').length || 0,
      interview: appsByStatus?.filter((a: any) => a.status === 'interview').length || 0,
      offer: appsByStatus?.filter((a: any) => a.status === 'offer').length || 0,
      rejected: appsByStatus?.filter((a: any) => a.status === 'rejected').length || 0,
    };

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
      statusBreakdown,
      topSkills: [
        { name: 'React', count: 45 },
        { name: 'Node.js', count: 32 },
        { name: 'TypeScript', count: 28 },
      ]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Admin Reports Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
}
