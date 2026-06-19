// @ts-nocheck
import { createClient } from 'npm:@insforge/sdk';

// ─── No Zod: manual validation to avoid npm:zod version conflicts in Deno ───

/** Allowed keys for the profiles table update */
const PROFILE_ALLOWED_KEYS = new Set(['name', 'phone', 'location', 'bio', 'avatar_url']);

/** Allowed keys for the candidate_profiles table update */
const CP_ALLOWED_KEYS = new Set([
  'headline', 'skills', 'experience_years', 'education', 'work_history',
  'resume_url', 'linkedin_url', 'github_url', 'portfolio_url',
  'salary_min', 'salary_max', 'preferred_locations', 'is_visible',
  'job_types', 'open_to_remote', 'currency', 'profile_strength',
  'is_discoverable', 'primary_resume_id',
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isOptionalString(v: unknown): boolean {
  return v === null || v === undefined || typeof v === 'string';
}

function isOptionalNumber(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'number' && isFinite(v));
}

function isOptionalBool(v: unknown): boolean {
  return v === null || v === undefined || typeof v === 'boolean';
}

function isOptionalStringArray(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (!Array.isArray(v)) return false;
  return v.every((item) => typeof item === 'string');
}

function isOptionalUrl(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (typeof v !== 'string') return false;
  try { new URL(v); return true; } catch { return false; }
}

/**
 * Accepts null | undefined | '' | a safe relative storage key | an absolute https:// URL.
 * Rejects path traversal (..), leading slashes, non-path characters, and strings over 500 chars.
 * Storage keys look like: "user-uuid/upload-uuid_filename.png"
 */
function isOptionalStoragePath(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (typeof v !== 'string') return false;
  // Reject unreasonably long values before any further processing
  if (v.length > 500) return false;
  // Accept absolute http(s) URLs for backward compatibility (case-insensitive)
  if (/^https?:\/\//i.test(v)) {
    try { new URL(v); return true; } catch { return false; }
  }
  // Reject path traversal and leading slashes
  if (v.includes('..') || v.startsWith('/') || v.startsWith('\\')) return false;
  // Allow only safe characters: alphanumeric, dot, underscore, dash, forward slash
  return /^[a-zA-Z0-9._/-]+$/.test(v);
}

function isEducationValid(v: unknown): boolean {
  // Accepts: string, null, undefined, or array of education entry objects
  if (v === null || v === undefined || typeof v === 'string') return true;
  if (!Array.isArray(v)) return false;
  return v.every((e) => {
    if (!isPlainObject(e)) return false;
    // degree is required and must be a non-empty string
    if (typeof e.degree !== 'string' || e.degree.trim() === '') return false;
    // id is required
    if (typeof e.id !== 'string') return false;
    return true;
  });
}

function isWorkHistoryValid(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (!Array.isArray(v)) return false;
  return v.every((e) => {
    if (!isPlainObject(e)) return false;
    if (typeof e.title !== 'string' || e.title.trim() === '') return false;
    if (typeof e.company !== 'string' || e.company.trim() === '') return false;
    if (typeof e.id !== 'string') return false;
    return true;
  });
}

type ValidationError = { field: string; message: string };

function validateProfileBody(body: unknown): { errors: ValidationError[]; profile: Record<string, unknown> | null; candidateProfile: Record<string, unknown> | null } {
  const errors: ValidationError[] = [];

  if (!isPlainObject(body)) {
    return { errors: [{ field: 'body', message: 'Body must be an object' }], profile: null, candidateProfile: null };
  }

  let profile: Record<string, unknown> | null = null;
  let candidateProfile: Record<string, unknown> | null = null;

  // ─── Validate profile ───
  if (body.profile !== undefined && body.profile !== null) {
    if (!isPlainObject(body.profile)) {
      errors.push({ field: 'profile', message: 'profile must be an object' });
    } else {
      const p = body.profile;
      if (!isOptionalString(p.name)) errors.push({ field: 'profile.name', message: 'name must be a string' });
      if (!isOptionalString(p.phone)) errors.push({ field: 'profile.phone', message: 'phone must be a string' });
      if (!isOptionalString(p.location)) errors.push({ field: 'profile.location', message: 'location must be a string' });
      if (!isOptionalString(p.bio)) errors.push({ field: 'profile.bio', message: 'bio must be a string' });
      if (!isOptionalStoragePath(p.avatar_url)) errors.push({ field: 'profile.avatar_url', message: 'avatar_url must be a valid storage path or URL' });

      // Extract only allowed keys
      profile = {};
      for (const key of PROFILE_ALLOWED_KEYS) {
        if (key in p) profile[key] = p[key];
      }
    }
  }

  // ─── Validate candidateProfile ───
  if (body.candidateProfile !== undefined && body.candidateProfile !== null) {
    if (!isPlainObject(body.candidateProfile)) {
      errors.push({ field: 'candidateProfile', message: 'candidateProfile must be an object' });
    } else {
      const cp = body.candidateProfile;
      if (!isOptionalString(cp.headline)) errors.push({ field: 'candidateProfile.headline', message: 'headline must be a string' });
      if (!isOptionalString(cp.currency)) errors.push({ field: 'candidateProfile.currency', message: 'currency must be a string' });
      if (!isOptionalNumber(cp.experience_years)) errors.push({ field: 'candidateProfile.experience_years', message: 'experience_years must be a number' });
      if (!isOptionalNumber(cp.salary_min)) errors.push({ field: 'candidateProfile.salary_min', message: 'salary_min must be a number' });
      if (!isOptionalNumber(cp.salary_max)) errors.push({ field: 'candidateProfile.salary_max', message: 'salary_max must be a number' });
      if (!isOptionalBool(cp.is_visible)) errors.push({ field: 'candidateProfile.is_visible', message: 'is_visible must be a boolean' });
      if (!isOptionalBool(cp.is_discoverable)) errors.push({ field: 'candidateProfile.is_discoverable', message: 'is_discoverable must be a boolean' });
      if (!isOptionalString(cp.primary_resume_id)) errors.push({ field: 'candidateProfile.primary_resume_id', message: 'primary_resume_id must be a string' });
      if (!isOptionalBool(cp.open_to_remote)) errors.push({ field: 'candidateProfile.open_to_remote', message: 'open_to_remote must be a boolean' });
      if (!isOptionalStringArray(cp.skills)) errors.push({ field: 'candidateProfile.skills', message: 'skills must be an array of strings' });
      if (!isOptionalStringArray(cp.preferred_locations)) errors.push({ field: 'candidateProfile.preferred_locations', message: 'preferred_locations must be an array of strings' });
      if (!isOptionalStringArray(cp.job_types)) errors.push({ field: 'candidateProfile.job_types', message: 'job_types must be an array of strings' });
      if (!isOptionalStoragePath(cp.resume_url)) errors.push({ field: 'candidateProfile.resume_url', message: 'resume_url must be a valid storage path or URL' });
      if (!isOptionalUrl(cp.linkedin_url)) errors.push({ field: 'candidateProfile.linkedin_url', message: 'linkedin_url must be a URL' });
      if (!isOptionalUrl(cp.github_url)) errors.push({ field: 'candidateProfile.github_url', message: 'github_url must be a URL' });
      if (!isOptionalUrl(cp.portfolio_url)) errors.push({ field: 'candidateProfile.portfolio_url', message: 'portfolio_url must be a URL' });
      if (!isEducationValid(cp.education)) errors.push({ field: 'candidateProfile.education', message: 'education must be a string or array of education entries' });
      if (!isWorkHistoryValid(cp.work_history)) errors.push({ field: 'candidateProfile.work_history', message: 'work_history must be an array of work experience entries' });

      // Extract only allowed keys
      candidateProfile = {};
      for (const key of CP_ALLOWED_KEYS) {
        if (key in cp) candidateProfile[key] = cp[key];
      }
    }
  }

  return { errors, profile, candidateProfile };
}

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || 
                Deno.env.get('INSFORGE_URL') || 
                Deno.env.get('INSFORGE_BASE_URL') || 
                Deno.env.get('SUPABASE_URL') || '';

const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || 
                Deno.env.get('INSFORGE_ANON_KEY') || 
                Deno.env.get('ANON_KEY') || 
                Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'Access-Control-Allow-Credentials': 'true',
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const resolvedServiceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || 
                             Deno.env.get('API_KEY') || 
                             Deno.env.get('INSFORGE_ADMIN_KEY') || 
                             Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 
                             req.headers.get('x-insforge-service-key') || '';

  const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
  const insforgeAdmin = createClient({ baseUrl, anonKey: resolvedServiceKey || anonKey, isServerMode: true });

  console.log('[candidate-profile] DEBUG env:', {
    hasBaseUrl: !!baseUrl,
    hasAnonKey: !!anonKey,
    hasServiceKey: !!resolvedServiceKey,
    method: req.method,
  });

  const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
  if (authError || !user) {
    console.error('[candidate-profile] Auth failed:', authError?.message);
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  console.log('[candidate-profile] Authenticated user:', user.id);

  // ─── GET ─────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: profile, error: profileError } = await insforgeAdmin.database
      .from('profiles').select('*').eq('id', user.id).single();
    if (profileError) console.error('[candidate-profile] Error fetching profile:', profileError.message);

    const { data: candidateProfile, error: cpError } = await insforgeAdmin.database
      .from('candidate_profiles').select('*').eq('id', user.id).single();
    if (cpError) console.error('[candidate-profile] Error fetching candidate profile:', cpError.message);

    return new Response(JSON.stringify({
      profile,
      candidateProfile,
      debug: {
        hasServiceKey: !!resolvedServiceKey,
        profileError: profileError ? profileError.message : null,
        cpError: cpError ? cpError.message : null
      }
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // ─── PUT ─────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    let body: unknown;
    try {
      body = await req.json();
      console.log('[candidate-profile] PUT request received for user:', user.id);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
    }

    const { errors, profile: profileUpdates, candidateProfile: candidateUpdates } = validateProfileBody(body);
    console.log('[candidate-profile] Validation result — errors count:', errors.length);

    if (errors.length > 0) {
      console.error('[candidate-profile] Validation FAILED:', JSON.stringify(errors));
      return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), { status: 400, headers: corsHeaders });
    }

    if (profileUpdates && Object.keys(profileUpdates).length > 0) {
      console.log('[candidate-profile] Updating profiles table for user:', user.id);
      const { error } = await insforgeAdmin.database.from('profiles').update({
        ...profileUpdates,
        completed_onboarding: true,
      }).eq('id', user.id);
      if (error) {
        console.error('[candidate-profile] DB update profiles FAILED:', error.message, '| code:', (error as any).code);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
      console.log('[candidate-profile] profiles update SUCCESS');
    }

    if (candidateUpdates && Object.keys(candidateUpdates).length > 0) {
      const { error } = await insforgeAdmin.database.from('candidate_profiles').upsert({
        id: user.id,
        ...candidateUpdates,
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.error('[candidate-profile] Error upserting candidate profile:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
    }

    const { data: profile } = await insforgeAdmin.database.from('profiles').select('*').eq('id', user.id).single();
    const { data: candidateProfile } = await insforgeAdmin.database.from('candidate_profiles').select('*').eq('id', user.id).single();

    return new Response(JSON.stringify({ profile, candidateProfile }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
