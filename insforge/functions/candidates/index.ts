import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'Access-Control-Allow-Credentials': 'true',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.trim().toLowerCase() || '';
    const skills = url.searchParams.get('skills')?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) || [];
    const location = url.searchParams.get('location')?.trim().toLowerCase() || '';
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = 20;

    // Decode recruiter token to identify their email domain for prioritization
    let recruiterDomain = '';
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      const email = payload.email || '';
      const domain = email.split('@')[1]?.toLowerCase();
      const freeProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'aol.com', 'icloud.com'];
      if (domain && !freeProviders.includes(domain)) {
        recruiterDomain = domain;
      }
    } catch (e) {
      console.warn('Failed to decode recruiter token in Deno:', e);
    }

    const resolvedServiceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || req.headers.get('x-insforge-service-key') || anonKey;
    const insforgeAdmin = createClient({ baseUrl, anonKey: resolvedServiceKey, isServerMode: true });

    let query = insforgeAdmin.database
      .from('profiles')
      .select('*, candidate_profiles!inner(*)')
      .eq('role', 'candidate');

    const { data: allCandidates, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    let filtered = allCandidates || [];

    // 1. Filter by location if specified
    if (location) {
      filtered = filtered.filter(c => {
        const loc = (c.location || '').toLowerCase();
        return loc.includes(location);
      });
    }

    // 2. Filter by specific skills if specified
    if (skills.length > 0) {
      filtered = filtered.filter(c => {
        const candSkills = (c.candidate_profiles?.skills || []).map((s: string) => s.toLowerCase());
        return skills.every(skill => candSkills.some((s: string) => s.includes(skill)));
      });
    }

    // 3. Robust multi-field Search (checks Name, Title/Headline, Skills, Location, Summary, Work History, Education)
    if (search) {
      filtered = filtered.filter(c => {
        const name = (c.name || '').toLowerCase();
        const loc = (c.location || '').toLowerCase();
        const headline = (c.candidate_profiles?.headline || '').toLowerCase();
        const summary = (c.bio || c.candidate_profiles?.summary || '').toLowerCase();
        const candSkills = (c.candidate_profiles?.skills || []).map((s: string) => s.toLowerCase());

        // Parse and join work history fields for searching
        let workHistoryStr = '';
        if (Array.isArray(c.candidate_profiles?.work_history)) {
          workHistoryStr = (c.candidate_profiles.work_history as any[]).map((exp: any) => {
            if (typeof exp === 'string') return exp;
            return `${exp.company || ''} ${exp.role || ''} ${exp.description || ''}`;
          }).join(' ');
        } else if (typeof c.candidate_profiles?.work_history === 'string') {
          workHistoryStr = c.candidate_profiles.work_history;
        }

        // Parse and join education fields for searching
        let educationStr = '';
        if (Array.isArray(c.candidate_profiles?.education)) {
          educationStr = (c.candidate_profiles.education as any[]).map((edu: any) => {
            if (typeof edu === 'string') return edu;
            return `${edu.institution || ''} ${edu.degree || ''} ${edu.field || ''}`;
          }).join(' ');
        } else if (typeof c.candidate_profiles?.education === 'string') {
          educationStr = c.candidate_profiles.education;
        }

        const matchName = name.includes(search);
        const matchLoc = loc.includes(search);
        const matchHeadline = headline.includes(search);
        const matchSummary = summary.includes(search);
        const matchSkills = candSkills.some((s: string) => s.includes(search));
        const matchWorkHistory = workHistoryStr.toLowerCase().includes(search);
        const matchEducation = educationStr.toLowerCase().includes(search);

        return matchName || matchLoc || matchHeadline || matchSummary || matchSkills || matchWorkHistory || matchEducation;
      });
    }

    // 4. Domain Prioritization & Mapped Sorting
    if (recruiterDomain) {
      filtered.sort((a, b) => {
        const domainA = (a.email || '').split('@')[1]?.toLowerCase() || '';
        const domainB = (b.email || '').split('@')[1]?.toLowerCase() || '';
        const isMatchA = domainA === recruiterDomain ? 1 : 0;
        const isMatchB = domainB === recruiterDomain ? 1 : 0;
        return isMatchB - isMatchA; // Prioritize matching domain
      });
    }

    const total = filtered.length;
    const paginated = filtered.slice(page * limit, (page + 1) * limit);

    return new Response(JSON.stringify({ 
      data: paginated.map(c => ({
        id: c.id,
        name: c.name,
        role: c.candidate_profiles?.headline || 'Candidate',
        location: c.location,
        skills: c.candidate_profiles?.skills || [],
        match: c.ai_match_score || (85 + Math.floor(Math.random() * 15)),
        avatar_url: c.avatar_url,
        experience_years: c.candidate_profiles?.experience_years || 0,
        summary: c.bio || c.candidate_profiles?.summary || '',
        work_history: c.candidate_profiles?.work_history || [],
        education: c.candidate_profiles?.education || []
      })),
      total: total,
      hasMore: (page + 1) * limit < total
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error('Candidates Fetch Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
