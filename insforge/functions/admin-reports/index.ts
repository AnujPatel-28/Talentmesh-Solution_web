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
      { count: countWithdrawn },
    ] = await Promise.all([
      insforge.database.from('jobs').select('*', { count: 'exact', head: true }),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }),
      insforge.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
      insforge.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'applied'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'reviewing'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'interviewing'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'offered'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'hired'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      insforge.database.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'withdrawn'),
    ]);

    const activeApps = (totalApplications || 0) - (countWithdrawn || 0);

    const funnel = {
      jobsPosted: totalJobs || 0,
      applications: activeApps,
      reviewed: (countReviewing || 0) + (countShortlisted || 0) + (countInterviewing || 0) + (countOffered || 0) + (countHired || 0) + (countRejected || 0),
      shortlisted: (countShortlisted || 0) + (countInterviewing || 0) + (countOffered || 0) + (countHired || 0),
      hired: countHired || 0,
    };

    const statusBreakdown = {
      applied: (countApplied || 0) + (countReviewing || 0) + (countOffered || 0),
      reviewing: countReviewing || 0,
      shortlisted: countShortlisted || 0,
      interview: countInterviewing || 0,
      interviewing: countInterviewing || 0,
      offer: countOffered || 0,
      offered: countOffered || 0,
      hired: countHired || 0,
      rejected: countRejected || 0,
    };

    // Query skills for growth and skills analytics
    const { data: candidatesData } = await insforge.database
      .from('candidate_profiles')
      .select('skills');

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

    return new Response(JSON.stringify({
      metrics: {
        totalJobs: totalJobs || 0,
        totalApplications: activeApps,
        totalCandidates: totalCandidates || 0,
        totalRecruiters: totalRecruiters || 0,
        avgTimeToHire: '12 days',
        appsPerJob: totalJobs ? activeApps / totalJobs : 0,
      },
      funnel,
      statusBreakdown,
      topSkills
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Admin Reports Edge Function Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
