import { insforge } from '@/lib/insforge';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  candidate_profiles?: CandidateProfile;
}

export interface CandidateProfile {
  id: string;
  headline?: string;
  skills?: string[];
  experience_years?: number;
  education?: any[];
  work_history?: any[];
  resume_url?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  job_types?: string[];
  preferred_locations?: string[];
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  open_to_remote?: boolean;
  profile_strength: number;
  is_visible?: boolean;
  updated_at?: string;
}

/**
 * Fetches the current user's profile with joined candidate details.
 */
export async function getMyProfile(): Promise<UserProfile> {
  const { data: sessionData } = await insforge.auth.refreshSession();
  const sessionUser = sessionData?.user;
  if (!sessionUser) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await insforge.database
    .from('profiles')
    .select('*, candidate_profiles(*)')
    .eq('id', sessionUser.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data as unknown as UserProfile;
}

/**
 * Updates the base user profile (profiles table).
 */
export async function updateProfile(data: Partial<UserProfile>): Promise<void> {
  const { data: sessionData } = await insforge.auth.refreshSession();
  const sessionUser = sessionData?.user;
  if (!sessionUser) throw new Error('Unauthorized');

  const { error } = await insforge.database
    .from('profiles')
    .update(data)
    .eq('id', sessionUser.id);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

/**
 * Updates the candidate-specific profile details.
 */
export async function updateCandidateProfile(data: Partial<CandidateProfile>): Promise<void> {
  const { data: sessionData } = await insforge.auth.refreshSession();
  const sessionUser = sessionData?.user;
  if (!sessionUser) throw new Error('Unauthorized');

  // Calculate new strength if relevant fields have changed
  const [{ data: current }, { data: baseProfile }] = await Promise.all([
    insforge.database.from('candidate_profiles').select('*').eq('id', sessionUser.id).single(),
    insforge.database.from('profiles').select('bio').eq('id', sessionUser.id).single()
  ]);

  const mergedForStrength = { ...current, ...data, bio: baseProfile?.bio };
  const strength = calculateProfileStrength(mergedForStrength);

  const { error } = await insforge.database
    .from('candidate_profiles')
    .update({ ...data, profile_strength: strength })
    .eq('id', sessionUser.id);

  if (error) {
    throw new Error(`Failed to update candidate profile: ${error.message}`);
  }
}

/**
 * Logic to calculate profile strength percentage 0-100.
 */
export function calculateProfileStrength(profile: any): number {
  if (!profile) return 0;
  
  const rules = [
    { field: 'headline', weight: 5 },
    { field: 'bio', weight: 10 },
    { field: 'skills', weight: 15, check: (v: any) => Array.isArray(v) && v.length >= 3 },
    { field: 'experience_years', weight: 5, check: (v: any) => v != null && v >= 0 },
    { field: 'resume_url', weight: 20 },
    { field: 'education', weight: 10, check: (v: any) => Array.isArray(v) && v.length > 0 },
    { field: 'work_history', weight: 20, check: (v: any) => Array.isArray(v) && v.length > 0 },
    { field: 'job_types', weight: 10, check: (v: any) => Array.isArray(v) && v.length > 0 },
    { field: 'preferred_locations', weight: 5, check: (v: any) => Array.isArray(v) && v.length > 0 },
  ];

  let strength = 0;
  rules.forEach(rule => {
    const value = profile[rule.field];
    const isValid = rule.check ? rule.check(value) : !!value;
    if (isValid) {
      strength += rule.weight;
    }
  });

  return Math.min(strength, 100);
}
