import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const token = req.headers.get('Authorization')?.split(' ')[1];
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { type, companyId, candidateId } = await req.json();
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });

    if (type === 'company') {
      const [
        { data: jobs },
        { data: candidates },
        { data: interviews },
        { data: activity },
      ] = await Promise.all([
        insforge.database.from('jobs').select('*, company_profiles(*)').order('created_at', { ascending: false }),
        insforge.database.from('candidate_profiles').select('*').order('ai_karma', { ascending: false }).limit(10),
        insforge.database.from('interviews').select('*').order('created_at', { ascending: false }).limit(5),
        insforge.database.from('activity').select('*').order('created_at', { ascending: false }).limit(6),
      ]);

      const allJobs = jobs || [];
      const allInterviews = interviews || [];
      const totalApplicants = allJobs.reduce((sum: number, j: any) => sum + (j.applicants || 0), 0);

      // Business logic moved to server
      const pipelineStages = [
        { id: 'applied', label: 'Applied', count: 284, color: 'var(--medium-grey)', bgColor: '#f1f5f9' },
        { id: 'screening', label: 'Screening', count: 89, color: 'var(--dodger-blue)', bgColor: 'var(--alice-blue)' },
        { id: 'interview', label: 'Interview', count: 31, color: 'var(--brilliant-azure)', bgColor: '#dbeafe' },
        { id: 'offer', label: 'Offer', count: 8, color: 'var(--ocean-deep)', bgColor: 'var(--icy-blue)' },
        { id: 'hired', label: 'Hired', count: 4, color: '#10b981', bgColor: '#d1fae5' },
      ];

      const diversity = {
        gender: [
          { label: 'Women', pct: 44, count: 125, color: 'var(--dodger-blue)' },
          { label: 'Men', pct: 51, count: 145, color: 'var(--ocean-deep)' },
          { label: 'Non-binary', pct: 5, count: 14, color: 'var(--cool-sky-2)' },
        ],
        ethnicity: [
          { label: 'Asian', pct: 31, count: 88, color: 'var(--dodger-blue)' },
          { label: 'Black / African', pct: 22, count: 62, color: 'var(--brilliant-azure)' },
          { label: 'Hispanic / Latino', pct: 18, count: 51, color: 'var(--cobalt-blue)' },
          { label: 'White', pct: 24, count: 68, color: 'var(--ocean-deep)' },
          { label: 'Other', pct: 5, count: 15, color: 'var(--sky-blue)' },
        ],
        education: [
          { label: "Bachelor's", pct: 48, count: 136, color: 'var(--dodger-blue)' },
          { label: "Master's", pct: 36, count: 102, color: 'var(--ocean-deep)' },
          { label: 'PhD', pct: 9, count: 26, color: 'var(--brilliant-azure)' },
          { label: 'Self-taught', pct: 7, count: 20, color: 'var(--cool-sky-2)' },
        ],
        goalTarget: 80,
        goalAchieved: 67,
        inclusionScore: 74,
        insight: [
          'Gender balance within ±5% of industry benchmark',
          'Hispanic/Latino pipeline is 4% below target — outreach recommended',
          'Self-taught hires show +12% higher retention vs. degree holders',
        ],
      };

      const kpis = {
        activeJobs: allJobs.length,
        totalApplicants,
        interviewsToday: allInterviews.filter((i: any) => i.status === 'confirmed').length,
        avgTimeToHire: 14,
        offerAcceptRate: 88,
        openOffers: 3,
        trends: { activeJobs: 2, totalApplicants: 18, interviewsToday: 3, avgTimeToHire: -3 },
      };

      return new Response(JSON.stringify({
        jobs: allJobs,
        candidates: candidates || [],
        interviews: allInterviews,
        activity: activity || [],
        pipelineStages,
        diversity,
        kpis
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (type === 'candidate') {
      const [
        { data: profile },
        { data: activity },
        { data: interviews },
        { data: applications },
      ] = await Promise.all([
        insforge.database.from('candidate_profiles').select('*').eq('id', candidateId).single(),
        insforge.database.from('activity').select('*').order('created_at', { ascending: false }).limit(5),
        insforge.database.from('interviews').select('*').eq('candidate_id', candidateId).limit(3),
        insforge.database.from('applications').select('*, jobs(*)').eq('candidate_id', candidateId).limit(10),
      ]);

      const kpis = {
        totalApplications: 24,
        interviewsScheduled: (interviews || []).length,
        profileViews: profile?.views_7d || 0,
        responseRate: 62,
        savedJobs: 18,
        offersReceived: 1,
        trends: { totalApplications: 6, interviewsScheduled: 2, profileViews: 23, responseRate: 8 },
      };

      return new Response(JSON.stringify({
        profile: profile || null,
        activity: activity || [],
        interviews: interviews || [],
        applications: applications || [],
        kpis
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid dashboard type' }), { status: 400 });
  } catch (err) {
    console.error('Dashboard Edge Function Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
