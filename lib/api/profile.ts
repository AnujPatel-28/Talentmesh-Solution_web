import { insforge, invokeFunction } from '@/lib/insforge';
import type { UserProfile, CandidateProfile } from '@/types/user';

/**
 * Fetches the current user's profile with joined candidate details via Edge Function.
 */
export async function getMyProfile(token?: string): Promise<UserProfile> {
  const { data, error } = await invokeFunction('candidate-profile', {
    method: 'GET',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  // The Edge Function returns { profile, candidateProfile }
  return {
    ...data.profile,
    candidate_profiles: data.candidateProfile
  } as unknown as UserProfile;
}

/**
 * Updates the base profile details.
 */
export async function updateProfile(profileUpdates: Partial<UserProfile>): Promise<UserProfile> {
  const { data, error } = await invokeFunction('candidate-profile', {
    method: 'PUT',
    body: { profile: profileUpdates }
  });

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return {
    ...data.profile,
    candidate_profiles: data.candidateProfile
  } as unknown as UserProfile;
}

/**
 * Updates the candidate-specific profile details.
 */
export async function updateCandidateProfile(candidateUpdates: Partial<CandidateProfile>): Promise<UserProfile> {
  const { data, error } = await invokeFunction('candidate-profile', {
    method: 'PUT',
    body: { candidateProfile: candidateUpdates }
  });

  if (error) {
    throw new Error(`Failed to update candidate profile: ${error.message}`);
  }

  return {
    ...data.profile,
    candidate_profiles: data.candidateProfile
  } as unknown as UserProfile;
}

/**
 * Marks onboarding as complete via Edge Function.
 */
export async function completeOnboarding(): Promise<void> {
  const { error } = await invokeFunction('profile-complete-onboarding', {
    method: 'POST'
  });

  if (error) {
    throw new Error(`Failed to complete onboarding: ${error.message}`);
  }
}

/**
 * Logic to calculate profile strength percentage 0-100.
 */
export function calculateProfileStrength(profile: any): number {
  if (!profile) return 0;
  
  const cp = profile.candidate_profiles || profile;
  const p = profile.candidate_profiles ? profile : {};

  const rules = [
    { field: 'headline', weight: 10, source: 'cp' },
    { field: 'about', weight: 10, source: 'p' },
    { field: 'skills', weight: 15, source: 'cp', check: (v: any) => Array.isArray(v) && v.length >= 3 },
    { field: 'experience_years', weight: 10, source: 'cp', check: (v: any) => v != null && v >= 0 },
    { field: 'resume_url', weight: 20, source: 'cp' },
    { field: 'education', weight: 10, source: 'cp', check: (v: any) => v != null },
    { field: 'location', weight: 10, source: 'p' },
    { field: 'name', weight: 15, source: 'p' },
  ];

  let strength = 0;
  rules.forEach(rule => {
    const src = rule.source === 'cp' ? cp : p;
    const value = src[rule.field];
    const isValid = rule.check ? rule.check(value) : !!value;
    if (isValid) {
      strength += rule.weight;
    }
  });

  return Math.min(strength, 100);
}
