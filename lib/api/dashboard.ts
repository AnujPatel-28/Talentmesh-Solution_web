/**
 * TalentMesh Dashboard API Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * All functions are async and return typed data. Currently uses mock data with
 * simulated latency. To connect a real backend, replace the `resolve(MOCK_*)`
 * calls inside each function body with `fetch('/api/...')` calls.
 *
 * Pattern:
 *   export async function fetchXxx(params): Promise<XxxType> {
 *     const res = await fetch(`${API_BASE}/xxx`, { headers: AUTH_HEADERS });
 *     if (!res.ok) throw new Error(res.statusText);
 *     return res.json();
 *   }
 */

import type {
    CompanyDashboardData, CandidateDashboardData,
    PipelineStage, Candidate, Job, Interview, DiversityData,
    ActivityItem, CompanyKpis, CandidateKpis, CandidateProfile,
    Application, JobRecommendation, SkillGap,
} from '@/types/dashboard';

// ─── Config (swap with your real API base URL + auth) ────────────────────────
// const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.talentmesh.io/v1';
// const AUTH_HEADERS = { Authorization: `Bearer ${getToken()}` };

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ─── Mock Seed Data ───────────────────────────────────────────────────────────

const MOCK_PIPELINE_STAGES: PipelineStage[] = [
    { id: 'applied',    label: 'Applied',    count: 284, color: 'var(--medium-grey)',     bgColor: '#f1f5f9' },
    { id: 'screening',  label: 'Screening',  count: 89,  color: 'var(--dodger-blue)',     bgColor: 'var(--alice-blue)' },
    { id: 'interview',  label: 'Interview',  count: 31,  color: 'var(--brilliant-azure)', bgColor: '#dbeafe' },
    { id: 'offer',      label: 'Offer',      count: 8,   color: 'var(--ocean-deep)',       bgColor: 'var(--icy-blue)' },
    { id: 'hired',      label: 'Hired',      count: 4,   color: '#10b981',                bgColor: '#d1fae5' },
];

const MOCK_CANDIDATES: Candidate[] = [
    { id: 'c1', name: 'Priya Sharma',    avatar: 'PS', role: 'Senior Product Designer',  stage: 'interview', aiScore: 94, skillAlignment: 97, experienceFit: 91, culturalMatch: 94, skills: ['Figma','UX Research','Design Systems'], yearsExp: 6, location: 'London, UK',   appliedAt: '2026-02-23', urgent: true,  status: 'active', salary: '$120k–$140k' },
    { id: 'c2', name: 'James Okafor',    avatar: 'JO', role: 'Full-Stack Engineer',       stage: 'offer',     aiScore: 91, skillAlignment: 89, experienceFit: 95, culturalMatch: 88, skills: ['React','Node.js','PostgreSQL'],        yearsExp: 8, location: 'Lagos, NG',    appliedAt: '2026-02-24', urgent: true,  status: 'active', salary: '$130k–$160k' },
    { id: 'c3', name: 'Carlos Rivera',   avatar: 'CR', role: 'DevOps Engineer',            stage: 'interview', aiScore: 89, skillAlignment: 93, experienceFit: 84, culturalMatch: 90, skills: ['Kubernetes','AWS','Terraform'],        yearsExp: 5, location: 'Madrid, ES',   appliedAt: '2026-02-22', urgent: false, status: 'active', salary: '$115k–$135k' },
    { id: 'c4', name: 'Lin Wei',         avatar: 'LW', role: 'Data Scientist',             stage: 'screening', aiScore: 87, skillAlignment: 85, experienceFit: 89, culturalMatch: 87, skills: ['Python','PyTorch','SQL'],             yearsExp: 4, location: 'Singapore',     appliedAt: '2026-02-21', urgent: false, status: 'active', salary: '$100k–$120k' },
    { id: 'c5', name: 'Amara Diallo',    avatar: 'AD', role: 'Marketing Lead',             stage: 'applied',   aiScore: 82, skillAlignment: 81, experienceFit: 83, culturalMatch: 82, skills: ['SEO','Demand Gen','HubSpot'],          yearsExp: 7, location: 'Paris, FR',    appliedAt: '2026-02-25', urgent: false, status: 'active', salary: '$90k–$110k' },
    { id: 'c6', name: 'Sophie Müller',   avatar: 'SM', role: 'Finance Analyst',            stage: 'hired',     aiScore: 96, skillAlignment: 96, experienceFit: 97, culturalMatch: 95, skills: ['Excel','FP&A','SQL'],                 yearsExp: 5, location: 'Berlin, DE',   appliedAt: '2026-02-15', urgent: false, status: 'hired',  salary: '$95k–$115k' },
    { id: 'c7', name: 'Aiko Tanaka',     avatar: 'AT', role: 'ML Engineer',                stage: 'screening', aiScore: 88, skillAlignment: 91, experienceFit: 86, culturalMatch: 86, skills: ['TensorFlow','Python','MLOps'],         yearsExp: 3, location: 'Tokyo, JP',    appliedAt: '2026-02-20', urgent: false, status: 'active', salary: '$110k–$130k' },
];

const MOCK_JOBS: Job[] = [
    { id: 'j1', title: 'Senior Product Designer',     department: 'Design',     type: 'full-time',  applicants: 48,  newApplicants: 7,  postedDays: 5,  status: 'active', location: 'London / Remote', salary: '$120k–140k', aiMatchRate: 71 },
    { id: 'j2', title: 'Full-Stack Engineer',          department: 'Engineering', type: 'full-time',  applicants: 93,  newApplicants: 14, postedDays: 3,  status: 'active', location: 'Remote',          salary: '$130k–160k', aiMatchRate: 58 },
    { id: 'j3', title: 'DevOps Engineer',              department: 'Engineering', type: 'hybrid',     applicants: 61,  newApplicants: 3,  postedDays: 12, status: 'active', location: 'Madrid, ES',      salary: '$115k–135k', aiMatchRate: 67 },
    { id: 'j4', title: 'Data Scientist',               department: 'Analytics',  type: 'full-time',  applicants: 44,  newApplicants: 9,  postedDays: 8,  status: 'active', location: 'Singapore',       salary: '$100k–120k', aiMatchRate: 62 },
    { id: 'j5', title: 'Head of Marketing',            department: 'Marketing',  type: 'full-time',  applicants: 22,  newApplicants: 2,  postedDays: 18, status: 'paused', location: 'Paris, FR',       salary: '$110k–130k', aiMatchRate: 54 },
    { id: 'j6', title: 'ML Infrastructure Engineer',   department: 'Engineering', type: 'remote',     applicants: 31,  newApplicants: 6,  postedDays: 6,  status: 'active', location: 'Remote',          salary: '$140k–170k', aiMatchRate: 74 },
];

const MOCK_INTERVIEWS: Interview[] = [
    { id: 'i1', candidateName: 'Priya Sharma',  candidateAvatar: 'PS', role: 'Product Designer',  date: 'Mon Feb 25', time: '10:00 AM', duration: '45 min', type: 'video',     status: 'confirmed',    aiSuggested: true,  hasConflict: false, interviewers: ['Sarah K.','Tom R.'],    meetingLink: 'https://meet.google.com/abc' },
    { id: 'i2', candidateName: 'James Okafor',  candidateAvatar: 'JO', role: 'Full-Stack Eng.',   date: 'Mon Feb 25', time: '2:00 PM',  duration: '60 min', type: 'technical', status: 'confirmed',    aiSuggested: true,  hasConflict: false, interviewers: ['Dev Team'],            meetingLink: 'https://zoom.us/j/123' },
    { id: 'i3', candidateName: 'Carlos Rivera', candidateAvatar: 'CR', role: 'DevOps Engineer',   date: 'Tue Feb 26', time: '11:00 AM', duration: '45 min', type: 'video',     status: 'rescheduling', aiSuggested: false, hasConflict: true,  interviewers: ['Mike L.'],             meetingLink: undefined },
    { id: 'i4', candidateName: 'Lin Wei',       candidateAvatar: 'LW', role: 'Data Scientist',    date: 'Wed Feb 27', time: '3:30 PM',  duration: '60 min', type: 'panel',     status: 'scheduled',    aiSuggested: true,  hasConflict: false, interviewers: ['Anna D.','Chris P.'], meetingLink: 'https://teams.microsoft.com/l/456' },
    { id: 'i5', candidateName: 'Aiko Tanaka',   candidateAvatar: 'AT', role: 'ML Engineer',       date: 'Thu Feb 28', time: '9:00 AM',  duration: '90 min', type: 'technical', status: 'scheduled',    aiSuggested: true,  hasConflict: false, interviewers: ['ML Team'],             meetingLink: 'https://meet.google.com/xyz' },
];

const MOCK_DIVERSITY: DiversityData = {
    gender: [
        { label: 'Women',       pct: 44, count: 125, color: 'var(--dodger-blue)' },
        { label: 'Men',         pct: 51, count: 145, color: 'var(--ocean-deep)' },
        { label: 'Non-binary',  pct: 5,  count: 14,  color: 'var(--cool-sky-2)' },
    ],
    ethnicity: [
        { label: 'Asian',            pct: 31, count: 88,  color: 'var(--dodger-blue)' },
        { label: 'Black / African',  pct: 22, count: 62,  color: 'var(--brilliant-azure)' },
        { label: 'Hispanic / Latino',pct: 18, count: 51,  color: 'var(--cobalt-blue)' },
        { label: 'White',            pct: 24, count: 68,  color: 'var(--ocean-deep)' },
        { label: 'Other',            pct: 5,  count: 15,  color: 'var(--sky-blue)' },
    ],
    education: [
        { label: "Bachelor's", pct: 48, count: 136, color: 'var(--dodger-blue)' },
        { label: "Master's",   pct: 36, count: 102, color: 'var(--ocean-deep)' },
        { label: 'PhD',        pct: 9,  count: 26,  color: 'var(--brilliant-azure)' },
        { label: 'Self-taught',pct: 7,  count: 20,  color: 'var(--cool-sky-2)' },
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

const MOCK_ACTIVITY: ActivityItem[] = [
    { id: 'a1', type: 'application', title: 'New Application',     description: 'Priya Sharma applied to Senior Product Designer', timeAgo: '5m ago',   actor: 'Priya Sharma',  actorAvatar: 'PS', meta: '94% AI match' },
    { id: 'a2', type: 'interview',   title: 'Interview Confirmed', description: 'James Okafor confirmed Monday 2PM slot',          timeAgo: '12m ago',  actor: 'James Okafor', actorAvatar: 'JO', meta: 'Full-Stack Eng.' },
    { id: 'a3', type: 'offer',       title: 'Offer Sent',          description: 'Offer letter sent to James Okafor',              timeAgo: '1h ago',   actor: 'HR Team',       actorAvatar: 'HR', meta: '$145k package' },
    { id: 'a4', type: 'job_posted',  title: 'Job Posted',          description: 'ML Infrastructure Engineer role went live',      timeAgo: '2h ago',   actor: 'Tom Reid',      actorAvatar: 'TR', meta: '6 applicants' },
    { id: 'a5', type: 'hire',        title: 'Hire Confirmed',      description: 'Sophie Müller accepted offer — starts Mar 1',   timeAgo: '1d ago',   actor: 'Sophie Müller', actorAvatar: 'SM', meta: 'Finance Analyst' },
    { id: 'a6', type: 'message',     title: 'Candidate Message',   description: 'Carlos Rivera asked to reschedule interview',    timeAgo: '3h ago',   actor: 'Carlos Rivera', actorAvatar: 'CR', meta: 'Reschedule needed' },
];

const MOCK_COMPANY_KPIS: CompanyKpis = {
    activeJobs: 12, totalApplicants: 284, interviewsToday: 8, avgTimeToHire: 14, offerAcceptRate: 88, openOffers: 3,
    trends: { activeJobs: 2, totalApplicants: 18, interviewsToday: 3, avgTimeToHire: -3 },
};

// ─── Candidate Mock Data ──────────────────────────────────────────────────────

const MOCK_CANDIDATE_PROFILE: CandidateProfile = {
    name: 'Raj Mehta', role: 'Senior Frontend Engineer', avatar: 'RM',
    profileStrength: 78, views7d: 147, aiKarma: 920,
    completionItems: [
        { label: 'Add work samples / portfolio', done: false },
        { label: 'Complete skill assessments',   done: false },
        { label: 'Add your LinkedIn URL',         done: true },
        { label: 'Upload resume (PDF)',            done: true },
        { label: 'Verify email address',          done: true },
    ],
};

const MOCK_APPLICATIONS: Application[] = [
    { id: 'ap1', jobTitle: 'Senior Frontend Engineer', company: 'Stripe',    companyInitials: 'ST', companyColor: '#7C3AED', stage: 'Interview',  stageIndex: 2, appliedDate: 'Feb 14', lastUpdate: '2d ago',  aiMatchScore: 92, nextAction: 'Technical interview Thu 10AM', status: 'active',   salary: '$150k–$180k', type: 'full-time', location: 'Remote' },
    { id: 'ap2', jobTitle: 'Staff Engineer',            company: 'Figma',    companyInitials: 'FG', companyColor: '#059669', stage: 'Screening',  stageIndex: 1, appliedDate: 'Feb 18', lastUpdate: '5d ago',  aiMatchScore: 87, nextAction: 'Awaiting recruiter response',  status: 'active',   salary: '$170k–$200k', type: 'full-time', location: 'San Francisco' },
    { id: 'ap3', jobTitle: 'React Lead',                company: 'Linear', companyInitials: 'LI', companyColor: '#0D47A1', stage: 'Offer',      stageIndex: 3, appliedDate: 'Feb 10', lastUpdate: '1d ago',  aiMatchScore: 95, nextAction: 'Review offer — expires Feb 28',  status: 'offered',  salary: '$160k–$190k', type: 'full-time', location: 'Remote' },
    { id: 'ap4', jobTitle: 'Principal Engineer',        company: 'Vercel',   companyInitials: 'VR', companyColor: '#374151', stage: 'Applied',    stageIndex: 0, appliedDate: 'Feb 22', lastUpdate: '3d ago',  aiMatchScore: 84, nextAction: 'Application under review',     status: 'active',   salary: '$180k–$220k', type: 'remote',    location: 'Remote' },
    { id: 'ap5', jobTitle: 'Frontend Architect',        company: 'Shopify',  companyInitials: 'SH', companyColor: '#16A34A', stage: 'Applied',    stageIndex: 0, appliedDate: 'Feb 25', lastUpdate: '6h ago',  aiMatchScore: 80, nextAction: 'Application submitted',        status: 'active',   salary: '$140k–$170k', type: 'full-time', location: 'Toronto / Remote' },
    { id: 'ap6', jobTitle: 'Tech Lead',                 company: 'Notion',   companyInitials: 'NO', companyColor: '#6B7280', stage: 'Rejected',   stageIndex: 1, appliedDate: 'Feb 5',  lastUpdate: '10d ago', aiMatchScore: 76, nextAction: 'Application closed',           status: 'rejected', salary: '$130k–$155k', type: 'hybrid',    location: 'New York' },
];

const MOCK_RECOMMENDATIONS: JobRecommendation[] = [
    { id: 'r1', title: 'Senior React Engineer',  company: 'OpenAI',  companyInitials: 'OA', companyColor: '#10B981', location: 'Remote',       type: 'full-time', salary: '$180k–$220k', matchScore: 96, postedDays: 1,  skills: ['React','TypeScript','Next.js'], reason: 'Matches 96% of your skills & target salary',    saved: false },
    { id: 'r2', title: 'Staff Frontend Eng.',    company: 'Notion',  companyInitials: 'NO', companyColor: '#6B7280', location: 'New York',     type: 'hybrid',    salary: '$160k–$195k', matchScore: 91, postedDays: 2,  skills: ['React','Node.js','Design Sys'], reason: 'Culture fit 94% — team uses your stack',         saved: true },
    { id: 'r3', title: 'Frontend Architect',     company: 'Loom',    companyInitials: 'LO', companyColor: '#7C3AED', location: 'Remote',       type: 'remote',    salary: '$155k–$185k', matchScore: 88, postedDays: 3,  skills: ['React','Webpack','Perf Opt.'],  reason: '3 mutual connections work here',                  saved: false },
    { id: 'r4', title: 'Lead Engineer',          company: 'Linear',  companyInitials: 'LI', companyColor: '#0D47A1', location: 'San Francisco',type: 'full-time', salary: '$175k–$210k', matchScore: 85, postedDays: 5,  skills: ['TypeScript','GraphQL','AWS'],   reason: 'Fast-growing — 3x hires in your target range',   saved: false },
];

const MOCK_SKILL_GAPS: SkillGap[] = [
    { skill: 'System Design',     current: 70, required: 90, category: 'Architecture', priority: 'critical', resources: 'Grokking System Design' },
    { skill: 'TypeScript',        current: 85, required: 95, category: 'Languages',   priority: 'high',     resources: 'TypeScript Deep Dive' },
    { skill: 'AWS / Cloud',       current: 45, required: 80, category: 'DevOps',      priority: 'high',     resources: 'AWS Developer Path' },
    { skill: 'GraphQL',           current: 60, required: 75, category: 'APIs',        priority: 'medium',   resources: 'How to GraphQL' },
    { skill: 'Performance Optim.',current: 75, required: 85, category: 'Frontend',    priority: 'medium',   resources: 'Web Vitals Mastery' },
    { skill: 'Leadership',        current: 55, required: 70, category: 'Soft Skills', priority: 'medium',   resources: 'Tech Lead handbook' },
];

const MOCK_CANDIDATE_KPIS: CandidateKpis = {
    totalApplications: 24, interviewsScheduled: 3, profileViews: 147, responseRate: 62,
    savedJobs: 18, offersReceived: 1,
    trends: { totalApplications: 6, interviewsScheduled: 2, profileViews: 23, responseRate: 8 },
};

const MOCK_CANDIDATE_ACTIVITY: ActivityItem[] = [
    { id: 'ca1', type: 'interview',   title: 'Interview Scheduled', description: 'Technical interview at Stripe confirmed for Thu 10AM', timeAgo: '1h ago',   actor: 'Stripe',  actorAvatar: 'ST', meta: '90 min coding round' },
    { id: 'ca2', type: 'offer',       title: 'Offer Received! 🎉',  description: 'Linear sent you an offer: $175k + equity',           timeAgo: '1d ago',   actor: 'Linear',  actorAvatar: 'LI', meta: 'Expires Feb 28' },
    { id: 'ca3', type: 'application', title: 'Application Viewed',  description: 'Your application at Figma was viewed by recruiter',  timeAgo: '2d ago',   actor: 'Figma',   actorAvatar: 'FG', meta: 'Screening stage' },
    { id: 'ca4', type: 'message',     title: 'New Message',         description: 'Vercel recruiter sent you a connection request',     timeAgo: '3d ago',   actor: 'Vercel',  actorAvatar: 'VR', meta: 'Respond to advance' },
    { id: 'ca5', type: 'reject',      title: 'Application Update',  description: 'Notion moved forward with another candidate',        timeAgo: '10d ago',  actor: 'Notion',  actorAvatar: 'NO', meta: 'Tech Lead role' },
];

const MOCK_CANDIDATE_INTERVIEWS: Interview[] = [
    { id: 'ci1', candidateName: 'Raj Mehta', candidateAvatar: 'RM', role: 'Senior Frontend Engineer @ Stripe', date: 'Thu Feb 27', time: '10:00 AM', duration: '90 min', type: 'technical', status: 'confirmed',  aiSuggested: false, hasConflict: false, interviewers: ['Stripe Eng Team'], meetingLink: 'https://meet.google.com/stripe' },
    { id: 'ci2', candidateName: 'Raj Mehta', candidateAvatar: 'RM', role: 'Staff Frontend Eng. @ Figma',       date: 'Fri Feb 28', time: '2:00 PM',  duration: '45 min', type: 'video',     status: 'scheduled', aiSuggested: true,  hasConflict: false, interviewers: ['Figma Recruiter'],   meetingLink: 'https://zoom.us/j/figma' },
    { id: 'ci3', candidateName: 'Raj Mehta', candidateAvatar: 'RM', role: 'Principal Engineer @ Vercel',       date: 'Mon Mar 3',  time: '11:30 AM', duration: '60 min', type: 'video',     status: 'scheduled', aiSuggested: true,  hasConflict: false, interviewers: ['Vercel CTO'],        meetingLink: undefined },
];

import { apiFetch } from './client';

// ─── Public API Functions ─────────────────────────────────────────────────────

export async function fetchCompanyDashboard(companyId: string): Promise<CompanyDashboardData> {
    return apiFetch(`/dashboard/company/${companyId}`);
}

export async function fetchCandidateDashboard(candidateId: string): Promise<CandidateDashboardData> {
    return apiFetch(`/dashboard/candidate/${candidateId}`);
}

export async function confirmInterview(interviewId: string): Promise<{ success: boolean }> {
    await delay(300);
    console.log(`[API] Confirming interview ${interviewId}`);
    return { success: true };
}

export async function saveJob(jobId: string, saved: boolean): Promise<{ success: boolean }> {
    await delay(200);
    console.log(`[API] ${saved ? 'Saving' : 'Unsaving'} job ${jobId}`);
    return { success: true };
}

export async function updateApplicationStage(appId: string, stage: string): Promise<{ success: boolean }> {
    await delay(300);
    console.log(`[API] Moving application ${appId} to ${stage}`);
    return { success: true };
}
