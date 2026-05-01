import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const candidateProfileSchema = z.object({
  profile: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  candidateProfile: z.object({
    headline: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience_years: z.number().nonnegative("Experience cannot be negative").nullable().optional(),
    education: z.string().optional(),
    resume_url: z.string().url().optional().or(z.literal('')),
    linkedin_url: z.string().url().optional().or(z.literal('')),
    github_url: z.string().url().optional().or(z.literal('')),
    portfolio_url: z.string().url().optional().or(z.literal('')),
    salary_min: z.number().nonnegative("Salary cannot be negative").nullable().optional(),
    salary_max: z.number().nonnegative("Salary cannot be negative").nullable().optional(),
    preferred_locations: z.array(z.string()).optional(),
    job_type: z.string().optional(),
  }).optional(),
});

// Helper Functions
const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'react', 'next.js', 'nextjs', 'node.js', 'node', 'python', 'java', 'c++', 'c#',
  'sql', 'postgresql', 'mongodb', 'aws', 'docker', 'kubernetes', 'tailwind', 'figma', 'graphql', 'rest',
  'html', 'css', 'vue', 'angular', 'php', 'go', 'rust', 'firebase', 'supabase', 'insforge',
];

const HEADLINE_KEYWORDS = [
  'frontend', 'backend', 'fullstack', 'developer', 'engineer', 'designer', 'manager', 'analyst', 'marketer',
  'product', 'data', 'devops', 'mobile', 'ios', 'android', 'qa', 'recruiter',
];

function isFilled(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

function titleCase(value: string): string {
  return value.split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function sanitizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  if (typeof value === 'string') return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  return [];
}

function sanitizeOptionalNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDefaultCandidateProfile() {
  return {
    headline: '', skills: [], experience_years: null, education: '', resume_url: '',
    linkedin_url: '', github_url: '', portfolio_url: '', salary_min: null, salary_max: null,
    currency: 'INR', preferred_locations: [], job_type: '', open_to_remote: true, is_visible: true,
    profile_strength: 0,
  };
}

function calculateCandidateProfileStrength(profile: any, candidateProfile: any): number {
  let score = 0;
  if (isFilled(profile.name)) score += 10;
  if (isFilled(profile.phone)) score += 10;
  if (isFilled(profile.location)) score += 10;
  if (sanitizeStringArray(candidateProfile.skills).length >= 3) score += 20;
  if (candidateProfile.experience_years !== null && candidateProfile.experience_years !== undefined) score += 15;
  if (isFilled(candidateProfile.resume_url)) score += 20;
  if (isFilled(candidateProfile.linkedin_url)) score += 10;
  if (isFilled(candidateProfile.headline)) score += 15;
  return Math.min(score, 100);
}

function deriveResumeAutoFill(resumeUrl: string) {
  if (!resumeUrl) return { headline: '', skills: [] };
  const decoded = decodeURIComponent(resumeUrl).toLowerCase();
  const rawFileName = decoded.split('/').pop()?.split('?')[0] ?? '';
  const cleaned = rawFileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\d+/g, ' ').replace(/\b(resume|cv|profile|updated|final|latest|copy)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter(Boolean);
  const headlineTokens = words.filter((word) => HEADLINE_KEYWORDS.includes(word));
  const skillMatches = SKILL_KEYWORDS.filter((skill) => decoded.includes(skill));
  return {
    headline: headlineTokens.length > 0 ? titleCase(headlineTokens.slice(0, 4).join(' ')) : '',
    skills: skillMatches.map((skill) => titleCase(skill.replace('.js', ''))),
  };
}

function applyResumeAutofill(candidateProfile: any) {
  if (!candidateProfile.resume_url) return candidateProfile;
  const derived = deriveResumeAutoFill(candidateProfile.resume_url);
  return {
    ...candidateProfile,
    headline: candidateProfile.headline || derived.headline,
    skills: candidateProfile.skills?.length > 0 ? candidateProfile.skills : derived.skills,
  };
}

function normalizeCandidateProfile(input: any) {
  return {
    headline: typeof input.headline === 'string' ? input.headline.trim() : '',
    skills: sanitizeStringArray(input.skills),
    experience_years: sanitizeOptionalNumber(input.experience_years),
    education: typeof input.education === 'string' ? input.education.trim() : '',
    resume_url: typeof input.resume_url === 'string' ? input.resume_url.trim() : '',
    linkedin_url: typeof input.linkedin_url === 'string' ? input.linkedin_url.trim() : '',
    github_url: typeof input.github_url === 'string' ? input.github_url.trim() : '',
    portfolio_url: typeof input.portfolio_url === 'string' ? input.portfolio_url.trim() : '',
    salary_min: sanitizeOptionalNumber(input.salary_min),
    salary_max: sanitizeOptionalNumber(input.salary_max),
    currency: typeof input.currency === 'string' ? input.currency.trim() : 'INR',
    preferred_locations: sanitizeStringArray(input.preferred_locations),
    job_type: typeof input.job_type === 'string' ? input.job_type.trim() : '',
    open_to_remote: typeof input.open_to_remote === 'boolean' ? input.open_to_remote : true,
    is_visible: typeof input.is_visible === 'boolean' ? input.is_visible : true,
    profile_strength: sanitizeOptionalNumber(input.profile_strength) ?? 0,
  };
}

function getStringValue(record: Record<string, unknown> | null, key: string): string {
  const value = record?.[key];
  return typeof value === 'string' ? value : '';
}

function getNullableStringValue(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === 'string' && value ? value : null;
}

async function findCandidateProfile(insforge: any, userId: string) {
  const byUserId = await insforge.from('candidate_profiles').select('*').eq('user_id', userId).single();
  if (!byUserId.error) return { record: byUserId.data, key: 'user_id' };
  const byId = await insforge.from('candidate_profiles').select('*').eq('id', userId).single();
  return { record: byId.data || null, key: 'id' };
}

function buildResponse(profileRow: Record<string, unknown>, candidateRow: Record<string, unknown> | null) {
  const normalizedCandidate = normalizeCandidateProfile({ ...getDefaultCandidateProfile(), ...candidateRow });
  return {
    profile: {
      id: getStringValue(profileRow, 'id'),
      email: getStringValue(profileRow, 'email'),
      name: getStringValue(profileRow, 'name'),
      phone: getStringValue(profileRow, 'phone'),
      location: getStringValue(profileRow, 'location'),
      role_id: getNullableStringValue(profileRow, 'role_id'),
      public_id: getStringValue(profileRow, 'public_id') || undefined,
      is_onboarded: profileRow?.is_onboarded === true,
    },
    candidateProfile: normalizedCandidate,
  };
}

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 204,
      headers: corsHeaders 
    });
  }

  console.log(`[candidate-profile] ${req.method} request received`);

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
  const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

  if (authError || !authData?.user || authData.user.id === 'project-admin-with-api-key') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const user = authData.user;
  const role = (user.metadata?.role as string) || 'candidate'; // default to candidate if missing
  const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

  if (req.method === 'GET') {
    try {
      let profileRow;
      const { data: existingProfile } = await insforgeAdmin.database.from('profiles').select('*').eq('email', user.email).single();

      if (!existingProfile) {
        const { error: insertError } = await insforgeAdmin.database.from('profiles').upsert({
          id: user.id,
          email: user.email,
          role: role,
          name: user.profile?.name || (user.metadata?.full_name as string) || '',
          is_onboarded: false,
        });

        if (insertError) {
          return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: newProfile } = await insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).single();
        profileRow = newProfile;
      } else {
        if (existingProfile.role !== role) {
          const { data: updatedProfile } = await insforgeAdmin.database.from('profiles').update({ role: role }).eq('id', user.id).select().single();
          profileRow = updatedProfile || existingProfile;
        } else {
          profileRow = existingProfile;
        }
      }

      await insforgeAdmin.database.from('candidate_profiles').upsert({ id: user.id });

      const lookup = await findCandidateProfile(insforgeAdmin.database, user.id);
      const bundle = buildResponse(profileRow, lookup.record);

      const autofilled = applyResumeAutofill(bundle.candidateProfile);
      if (autofilled.headline !== bundle.candidateProfile.headline) {
        const nextStrength = calculateCandidateProfileStrength(bundle.profile, autofilled);
        await insforgeAdmin.database.from('candidate_profiles').update({
          headline: autofilled.headline,
          skills: autofilled.skills,
          profile_strength: nextStrength
        }).eq(lookup.key, user.id);
        bundle.candidateProfile = { ...autofilled, profile_strength: nextStrength };
      }

      return new Response(JSON.stringify(bundle), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err: any) {
      console.error(`[candidate-profile] GET error:`, err);
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  if (req.method === 'PUT') {
    try {
      const payload = await req.json();
      const validation = candidateProfileSchema.safeParse(payload);
      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Invalid payload', errors: validation.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const body = validation.data;
      const { data: profileRow } = await insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).single();
      if (!profileRow) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const lookup = await findCandidateProfile(insforgeAdmin.database, user.id);
      const existingBundle = buildResponse(profileRow, lookup.record);

      const nextProfile = {
        name: body.profile?.name?.trim() || existingBundle.profile.name,
        phone: body.profile?.phone?.trim() || existingBundle.profile.phone,
        location: body.profile?.location?.trim() || existingBundle.profile.location,
      };

      const mergedCandidate = applyResumeAutofill(normalizeCandidateProfile({ ...existingBundle.candidateProfile, ...body.candidateProfile }));
      const profileStrength = calculateCandidateProfileStrength(nextProfile, mergedCandidate);

      const { error: profileError } = await insforgeAdmin.database
        .from('profiles')
        .update({ ...nextProfile, is_onboarded: true })
        .eq('id', user.id);
        
      if (profileError) {
        return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const candidatePayload = { ...mergedCandidate, profile_strength: profileStrength };

      if (lookup.record) {
        await insforgeAdmin.database.from('candidate_profiles').update(candidatePayload).eq(lookup.key, user.id);
      } else {
        await insforgeAdmin.database.from('candidate_profiles').insert([{ [lookup.key]: user.id, ...candidatePayload }]);
      }

      return new Response(JSON.stringify({
        profile: { ...existingBundle.profile, ...nextProfile },
        candidateProfile: { ...mergedCandidate, profile_strength: profileStrength }
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err: any) {
      console.error(`[candidate-profile] GET error:`, err);
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
