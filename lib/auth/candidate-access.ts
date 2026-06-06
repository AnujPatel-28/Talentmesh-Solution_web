/**
 * getCandidateAccessState
 *
 * Single source of truth for candidate onboarding/access business logic.
 * Reads directly from the DB (profiles table) so it is never affected by
 * stale session tokens or cached JWT claims.
 *
 * Extend this function when you add:
 *   - profile approval flows
 *   - email-verification gates
 *   - candidate suspension
 *   - premium plan access controls
 */

import { insforge } from '@/lib/insforge';

export interface CandidateAccessState {
  /** True when the candidate has fully completed onboarding */
  completedOnboarding: boolean;
  /** The step they were last on (0 if never started) */
  onboardingStep: number;
  /** Whether the profile row exists at all */
  profileExists: boolean;
  /** Whether the DB read itself failed */
  error: string | null;
}

export async function getCandidateAccessState(
  userId: string,
): Promise<CandidateAccessState> {
  if (!userId) {
    return {
      completedOnboarding: false,
      onboardingStep: 0,
      profileExists: false,
      error: 'No userId provided',
    };
  }

  try {
    const { data, error } = await insforge.database
      .from('profiles')
      .select('completed_onboarding')
      .eq('id', userId)
      .single();

    // PGRST116 = row not found — treat as new user, not an error
    if (error && error.code !== 'PGRST116') {
      return {
        completedOnboarding: false,
        onboardingStep: 0,
        profileExists: false,
        error: error.message,
      };
    }

    if (!data) {
      // Row doesn't exist yet (brand new signup)
      return {
        completedOnboarding: false,
        onboardingStep: 0,
        profileExists: false,
        error: null,
      };
    }

    return {
      completedOnboarding: data.completed_onboarding === true,
      onboardingStep: 0,
      profileExists: true,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      completedOnboarding: false,
      onboardingStep: 0,
      profileExists: false,
      error: message,
    };
  }
}
