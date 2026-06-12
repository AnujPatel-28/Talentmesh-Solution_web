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
    const serviceKey = req.headers.get('x-insforge-service-key') || Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY');
    const insforge = createClient({ 
      baseUrl, 
      anonKey: serviceKey!,
      edgeFunctionToken: token,
      isServerMode: true 
    });

    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token' }), { status: 401 });
    }
    const userData = { id: user.id };

    const { data: profile } = await insforge.database
      .from('profiles')
      .select('role')
      .eq('id', userData.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Aggregated metrics for Admin
    const [
      { count: totalJobs },
      { count: totalApplications },
      { count: totalCandidates },
      { count: totalRecruiters },
      { count: countApplied },
      { count: countReviewing },
      { count: countShortlisted },
      { count: countInterviewing },
      { count: countOffered },
      { count: countHired },
      { count: countRejected },
    ] = await Promise.all([
      insforge.database.from('jobs').select('*', { count: 'exact', head: true }),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }),
      insforge.database.from('candidate_profiles').select('*', { count: 'exact', head: true }),
      insforge.database.from('companies').select('*', { count: 'exact', head: true }),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'applied'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'reviewing'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'interviewing'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'offered'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'hired'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);

    const funnel = {
      jobsPosted: totalJobs || 0,
      applications: totalApplications || 0,
      reviewed: countReviewing || 0,
      shortlisted: countShortlisted || 0,
      hired: countHired || 0,
    };

    const statusBreakdown = {
      applied: countApplied || 0,
      reviewing: countReviewing || 0,
      shortlisted: countShortlisted || 0,
      interview: countInterviewing || 0,
      interviewing: countInterviewing || 0,
      offer: countOffered || 0,
      offered: countOffered || 0,
      hired: countHired || 0,
      rejected: countRejected || 0,
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
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
