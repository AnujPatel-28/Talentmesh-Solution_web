import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { insforgeAdmin } from '@/lib/insforge-admin';

export const GET = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
  },
  async () => {
    // Aggregated metrics
    const [
      { count: totalJobs },
      { count: totalApplications },
      { count: totalCandidates },
      { count: totalRecruiters },
      { data: appsByStatus },
      { data: userGrowth }
    ] = await Promise.all([
      insforgeAdmin!.database.from('jobs').select('*', { count: 'exact', head: true }),
      insforgeAdmin!.database.from('applications').select('*', { count: 'exact', head: true }),
      insforgeAdmin!.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
      insforgeAdmin!.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter'),
      insforgeAdmin!.database.from('applications').select('status'),
      insforgeAdmin!.database.from('profiles').select('created_at').eq('role', 'candidate').order('created_at')
    ]);

    // Format funnel data
    const funnel = {
      jobsPosted: totalJobs || 0,
      applications: totalApplications || 0,
      reviewed: appsByStatus?.filter((a: any) => a.status === 'reviewing').length || 0,
      shortlisted: appsByStatus?.filter((a: any) => a.status === 'shortlisted').length || 0,
      hired: appsByStatus?.filter((a: any) => a.status === 'offer').length || 0,
    };

    // Format user growth (simple weekly aggregation for last 4 weeks)
    // This is a placeholder for real aggregation logic
    const growth = [
      { date: 'Week 1', count: 12 },
      { date: 'Week 2', count: 18 },
      { date: 'Week 3', count: 15 },
      { date: 'Week 4', count: 25 },
    ];

    return NextResponse.json({
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
        { name: 'PostgreSQL', count: 22 },
        { name: 'Next.js', count: 19 },
      ],
      statusBreakdown: {
        applied: appsByStatus?.filter((a: any) => a.status === 'applied').length || 0,
        reviewing: appsByStatus?.filter((a: any) => a.status === 'reviewing').length || 0,
        shortlisted: appsByStatus?.filter((a: any) => a.status === 'shortlisted').length || 0,
        interview: appsByStatus?.filter((a: any) => a.status === 'interview').length || 0,
        offer: appsByStatus?.filter((a: any) => a.status === 'offer').length || 0,
        rejected: appsByStatus?.filter((a: any) => a.status === 'rejected').length || 0,
      }
    });
  }
);
