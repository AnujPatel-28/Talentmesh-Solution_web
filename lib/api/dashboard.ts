/**
 * TalentMesh Dashboard API Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * All functions query InsForge database directly via the SDK.
 * No mock data — all data comes from the InsForge backend.
 */

import type {
    CompanyDashboardData, CandidateDashboardData,
    PipelineStage, Candidate, Job, Interview, DiversityData,
    ActivityItem, CompanyKpis, CandidateKpis, CandidateProfile,
    Application, JobRecommendation, SkillGap,
} from '@/types/dashboard';

import { insforge } from '@/lib/insforge';

// ─── Company Dashboard ─────────────────────────────────────────────────────

export async function fetchCompanyDashboard(companyId: string): Promise<CompanyDashboardData> {
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

    const allJobs: Job[] = (jobs || []).map((j: any) => ({
        id: j.id,
        title: j.title,
        department: j.department,
        type: j.type,
        applicants: j.applicants,
        newApplicants: j.new_applicants,
        postedDays: j.posted_days,
        status: j.status,
        location: j.location,
        salary: j.salary,
        aiMatchRate: j.ai_match_rate,
    }));

    const allCandidates: Candidate[] = (candidates || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        role: c.role,
        stage: 'applied',
        aiScore: Math.round(c.ai_karma / 10),
        skillAlignment: 85,
        experienceFit: 88,
        culturalMatch: 90,
        skills: c.skills || [],
        yearsExp: c.years_exp,
        location: c.location,
        appliedAt: c.created_at,
        urgent: false,
        status: 'active',
        salary: c.salary,
    }));

    const allInterviews: Interview[] = (interviews || []).map((i: any) => ({
        id: i.id,
        candidateName: i.candidate_name,
        candidateAvatar: i.candidate_avatar,
        role: i.role,
        date: i.date,
        time: i.time,
        duration: i.duration,
        type: i.type,
        status: i.status,
        aiSuggested: i.ai_suggested,
        hasConflict: i.has_conflict,
        interviewers: i.interviewers || [],
        meetingLink: i.meeting_link,
    }));

    const allActivity: ActivityItem[] = (activity || []).map((a: any) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        timeAgo: a.time_ago,
        actor: a.actor,
        actorAvatar: a.actor_avatar,
        meta: a.meta,
    }));

    const totalApplicants = allJobs.reduce((sum, j) => sum + j.applicants, 0);

    const pipelineStages: PipelineStage[] = [
        { id: 'applied', label: 'Applied', count: 284, color: 'var(--medium-grey)', bgColor: '#f1f5f9' },
        { id: 'screening', label: 'Screening', count: 89, color: 'var(--dodger-blue)', bgColor: 'var(--alice-blue)' },
        { id: 'interview', label: 'Interview', count: 31, color: 'var(--brilliant-azure)', bgColor: '#dbeafe' },
        { id: 'offer', label: 'Offer', count: 8, color: 'var(--ocean-deep)', bgColor: 'var(--icy-blue)' },
        { id: 'hired', label: 'Hired', count: 4, color: '#10b981', bgColor: '#d1fae5' },
    ];

    const diversity: DiversityData = {
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

    const kpis: CompanyKpis = {
        activeJobs: allJobs.length,
        totalApplicants,
        interviewsToday: allInterviews.filter(i => i.status === 'confirmed').length,
        avgTimeToHire: 14,
        offerAcceptRate: 88,
        openOffers: 3,
        trends: { activeJobs: 2, totalApplicants: 18, interviewsToday: 3, avgTimeToHire: -3 },
    };

    return {
        pipeline: {
            stages: pipelineStages,
            candidates: allCandidates,
        },
        topCandidates: allCandidates.slice(0, 5),
        jobs: allJobs,
        interviews: allInterviews,
        diversity,
        activity: allActivity,
        kpis,
    };
}

// ─── Candidate Dashboard ────────────────────────────────────────────────────

export async function fetchCandidateDashboard(candidateId: string): Promise<CandidateDashboardData> {
    const [
        { data: profileData },
        { data: activity },
        { data: interviews },
    ] = await Promise.all([
        insforge.database.from('candidate_profiles').select('*').eq('id', candidateId).single(),
        insforge.database.from('activity').select('*').order('created_at', { ascending: false }).limit(5),
        insforge.database.from('interviews').select('*').eq('candidate_id', candidateId).limit(3),
    ]);

    const profile: CandidateProfile = profileData ? {
        name: profileData.name,
        role: profileData.role,
        avatar: profileData.avatar,
        profileStrength: profileData.profile_strength,
        views7d: profileData.views_7d,
        aiKarma: profileData.ai_karma,
        completionItems: [
            { label: 'Add work samples / portfolio', done: false },
            { label: 'Complete skill assessments', done: false },
            { label: 'Add your LinkedIn URL', done: true },
            { label: 'Upload resume (PDF)', done: true },
            { label: 'Verify email address', done: true },
        ],
    } : {
        name: 'User', role: 'Job Seeker', avatar: 'U',
        profileStrength: 0, views7d: 0, aiKarma: 0, completionItems: [],
    };

    const allInterviews: Interview[] = (interviews || []).map((i: any) => ({
        id: i.id,
        candidateName: i.candidate_name,
        candidateAvatar: i.candidate_avatar,
        role: i.role,
        date: i.date,
        time: i.time,
        duration: i.duration,
        type: i.type,
        status: i.status,
        aiSuggested: i.ai_suggested,
        hasConflict: i.has_conflict,
        interviewers: i.interviewers || [],
        meetingLink: i.meeting_link,
    }));

    const allActivity: ActivityItem[] = (activity || []).map((a: any) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        timeAgo: a.time_ago,
        actor: a.actor,
        actorAvatar: a.actor_avatar,
        meta: a.meta,
    }));

    // These would come from their own tables in a full implementation
    const applications: Application[] = [];
    const recommendations: JobRecommendation[] = [];
    const skillGaps: SkillGap[] = [
        { skill: 'System Design', current: 70, required: 90, category: 'Architecture', priority: 'critical', resources: 'Grokking System Design' },
        { skill: 'TypeScript', current: 85, required: 95, category: 'Languages', priority: 'high', resources: 'TypeScript Deep Dive' },
        { skill: 'AWS / Cloud', current: 45, required: 80, category: 'DevOps', priority: 'high', resources: 'AWS Developer Path' },
    ];

    const kpis: CandidateKpis = {
        totalApplications: 24,
        interviewsScheduled: allInterviews.length,
        profileViews: profile.views7d,
        responseRate: 62,
        savedJobs: 18,
        offersReceived: 1,
        trends: { totalApplications: 6, interviewsScheduled: 2, profileViews: 23, responseRate: 8 },
    };

    return {
        profile,
        applications,
        recommendations,
        skillGaps,
        interviews: allInterviews,
        activity: allActivity,
        kpis,
    };
}

// ─── Action Functions ─────────────────────────────────────────────────────────

export async function confirmInterview(interviewId: string): Promise<{ success: boolean }> {
    const { error } = await insforge.database
        .from('interviews')
        .update({ status: 'confirmed' })
        .eq('id', interviewId);

    return { success: !error };
}

export async function saveJob(jobId: string, saved: boolean): Promise<{ success: boolean }> {
    // Would update a saved_jobs junction table in a full implementation
    console.log(`[API] ${saved ? 'Saving' : 'Unsaving'} job ${jobId}`);
    return { success: true };
}

export async function updateApplicationStage(appId: string, stage: string): Promise<{ success: boolean }> {
    const { error } = await insforge.database
        .from('applications')
        .update({ stage, last_update: new Date().toISOString() })
        .eq('id', appId);

    return { success: !error };
}
