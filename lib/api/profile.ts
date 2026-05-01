import { insforge } from '@/lib/insforge';
import type { UserProfile, CandidateProfile } from '@/types/user';

/**
 * Fetches the current user's profile with joined candidate details via Edge Function.
 */
export async function getMyProfile(): Promise<UserProfile> {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const response = await fetch(`${baseUrl}/functions/candidate-profile`, {
    method: 'GET',
    headers: {
      'x-client-info': 'talentmesh-web'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  const data = await response.json();

  // The Edge Function returns { profile, candidateProfile }
  return {
    ...data.profile,
    candidate_profiles: data.candidateProfile
  } as unknown as UserProfile;
}

/**
 * Updates the profile (base or candidate) via Edge Function.
 */
export async function updateProfile(bundle: { profile?: Partial<UserProfile>; candidateProfile?: Partial<CandidateProfile> }): Promise<UserProfile> {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const response = await fetch(`${baseUrl}/functions/candidate-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-client-info': 'talentmesh-web'
    },
    body: JSON.stringify(bundle)
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    ...data.profile,
    candidate_profiles: data.candidateProfile
  } as unknown as UserProfile;
}

/**
 * Marks onboarding as complete via Edge Function.
 */
export async function completeOnboarding(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const response = await fetch(`${baseUrl}/functions/profile-complete-onboarding`, {
    method: 'POST',
    headers: {
      'x-client-info': 'talentmesh-web'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to complete onboarding: ${response.statusText}`);
  }
}

/**
 * Logic to calculate profile strength percentage 0-100.
 * (Keeping this for client-side UI feedback if needed, but the server is now authoritative)
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

