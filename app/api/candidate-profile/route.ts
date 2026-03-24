import { NextResponse } from 'next/server';

import {
  applyResumeAutofill,
  calculateCandidateProfileStrength,
  getDefaultCandidateProfile,
  normalizeCandidateProfile,
  type CandidateSettingsBundle,
} from '@/lib/candidate-profile';
import { getServerInsforgeClient } from '@/lib/server-insforge';

type CandidateLookup = {
  record: Record<string, unknown> | null;
  key: 'user_id' | 'id';
};

type AuthenticatedContext = {
  insforge: NonNullable<Awaited<ReturnType<typeof getServerInsforgeClient>>>;
  user: {
    id: string;
    email?: string | null;
  };
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function getStringValue(record: Record<string, unknown> | null, key: string): string {
  const value = record?.[key];
  return typeof value === 'string' ? value : '';
}

function getNullableStringValue(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === 'string' && value ? value : null;
}

async function getAuthenticatedContext() {
  const insforge = await getServerInsforgeClient();

  if (!insforge) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: userData, error } = await insforge.auth.getCurrentUser();
  if (error || !userData?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const userId = userData.user.id;
  if (!isUuid(userId)) {
    return {
      error: NextResponse.json(
        { error: 'Authenticated user is missing a valid UUID.' },
        { status: 401 },
      ),
    };
  }

  return {
    context: {
      insforge,
      user: {
        id: userId,
        email: userData.user.email,
      },
    } satisfies AuthenticatedContext,
  };
}

async function findCandidateProfile(
  insforge: NonNullable<Awaited<ReturnType<typeof getServerInsforgeClient>>>,
  userId: string,
): Promise<CandidateLookup> {
  if (!userId) {
    throw new Error('Cannot query candidate profile without a valid authenticated user ID.');
  }

  const byUserId = await insforge.database
    .from('candidate_profiles')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (!byUserId.error) {
    return { record: byUserId.data?.[0] ?? null, key: 'user_id' };
  }

  const byId = await insforge.database
    .from('candidate_profiles')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (byId.error) {
    throw new Error(byId.error.message);
  }

  return { record: byId.data?.[0] ?? null, key: 'id' };
}

function buildResponse(profileRow: Record<string, unknown>, candidateRow: Record<string, unknown> | null): CandidateSettingsBundle {
  const fallbackJobType =
    typeof candidateRow?.job_type === 'string'
      ? candidateRow.job_type
      : Array.isArray(candidateRow?.job_types) && candidateRow.job_types.length > 0
        ? String(candidateRow.job_types[0])
        : candidateRow?.open_to_remote === true
          ? 'Remote'
          : '';

  const normalizedCandidate = normalizeCandidateProfile({
    ...getDefaultCandidateProfile(),
    ...candidateRow,
    job_type: fallbackJobType,
  });

  return {
    profile: {
      id: getStringValue(profileRow, 'id'),
      email: getStringValue(profileRow, 'email'),
      name: getStringValue(profileRow, 'name'),
      phone: getStringValue(profileRow, 'phone'),
      location: getStringValue(profileRow, 'location'),
      role_id: getNullableStringValue(profileRow, 'role_id'),
    },
    candidateProfile: normalizedCandidate,
  };
}

async function syncResumeAutofill(
  insforge: NonNullable<Awaited<ReturnType<typeof getServerInsforgeClient>>>,
  userId: string,
  lookup: CandidateLookup,
  bundle: CandidateSettingsBundle,
) {
  const autofilled = applyResumeAutofill(bundle.candidateProfile);
  const shouldPersist =
    autofilled.headline !== bundle.candidateProfile.headline ||
    autofilled.skills.join('|') !== bundle.candidateProfile.skills.join('|');

  if (!shouldPersist) {
    return bundle;
  }

  const nextStrength = calculateCandidateProfileStrength(bundle.profile, autofilled);
  const payload: Record<string, unknown> = {
    headline: autofilled.headline,
    skills: autofilled.skills,
    profile_strength: nextStrength,
  };

  if (lookup.record) {
    await insforge.database
      .from('candidate_profiles')
      .update(payload)
      .eq(lookup.key, userId);
  }

  return {
    ...bundle,
    candidateProfile: {
      ...autofilled,
      profile_strength: nextStrength,
    },
  };
}

export async function GET() {
  try {
    const auth = await getAuthenticatedContext();
    if (auth.error) {
      return auth.error;
    }

    const { insforge, user } = auth.context;
    const { data: profileRow, error: profileError } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: profileError?.message ?? 'Profile not found' }, { status: 404 });
    }

    const lookup = await findCandidateProfile(insforge, user.id);
    const bundle = buildResponse(profileRow, lookup.record);
    const completedBundle = await syncResumeAutofill(insforge, user.id, lookup, bundle);

    return NextResponse.json(completedBundle);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await getAuthenticatedContext();
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json() as {
      profile?: Partial<CandidateSettingsBundle['profile']>;
      candidateProfile?: Partial<CandidateSettingsBundle['candidateProfile']>;
    };
    const profileInput = body?.profile ?? {};
    const candidateInput = body?.candidateProfile ?? {};

    const { insforge, user } = auth.context;
    const { data: profileRow, error: profileError } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: profileError?.message ?? 'Profile not found' }, { status: 404 });
    }

    const lookup = await findCandidateProfile(insforge, user.id);
    const existingBundle = buildResponse(profileRow, lookup.record);

    const nextProfile = {
      name: typeof profileInput.name === 'string' ? profileInput.name.trim() : existingBundle.profile.name,
      phone: typeof profileInput.phone === 'string' ? profileInput.phone.trim() : existingBundle.profile.phone,
      location: typeof profileInput.location === 'string' ? profileInput.location.trim() : existingBundle.profile.location,
    };

    const mergedCandidate = applyResumeAutofill(normalizeCandidateProfile({
      ...existingBundle.candidateProfile,
      ...candidateInput,
    }));

    const profileStrength = calculateCandidateProfileStrength(
      {
        name: nextProfile.name,
        phone: nextProfile.phone,
        location: nextProfile.location,
      },
      mergedCandidate,
    );

    const { error: updateProfileError } = await insforge.database
      .from('profiles')
      .update(nextProfile)
      .eq('id', user.id);

    if (updateProfileError) {
      return NextResponse.json({ error: updateProfileError.message }, { status: 400 });
    }

    const candidatePayload: Record<string, unknown> = {
      headline: mergedCandidate.headline,
      skills: mergedCandidate.skills,
      experience_years: mergedCandidate.experience_years,
      education: mergedCandidate.education,
      resume_url: mergedCandidate.resume_url,
      salary_min: mergedCandidate.salary_min,
      salary_max: mergedCandidate.salary_max,
      preferred_locations: mergedCandidate.preferred_locations,
      job_type: mergedCandidate.job_type,
      profile_strength: profileStrength,
    };

    if (!isUuid(user.id)) {
      return NextResponse.json(
        { error: 'Cannot save onboarding data without a valid authenticated user UUID.' },
        { status: 400 },
      );
    }

    let saveCandidateError: { message: string } | null = null;

    if (lookup.record) {
      const { error } = await insforge.database
        .from('candidate_profiles')
        .update(candidatePayload)
        .eq(lookup.key, user.id);
      saveCandidateError = error;
    } else {
      const insertPayload =
        lookup.key === 'user_id'
          ? { user_id: user.id, ...candidatePayload }
          : { id: user.id, ...candidatePayload };

      if (
        ('user_id' in insertPayload && !isUuid(insertPayload.user_id)) ||
        ('id' in insertPayload && !isUuid(insertPayload.id))
      ) {
        return NextResponse.json(
          { error: 'Refusing to insert candidate profile without a valid authenticated UUID.' },
          { status: 400 },
        );
      }

      const { error } = await insforge.database
        .from('candidate_profiles')
        .insert([insertPayload]);
      saveCandidateError = error;
    }

    if (saveCandidateError) {
      return NextResponse.json({ error: saveCandidateError.message }, { status: 400 });
    }

    return NextResponse.json({
      profile: {
        ...existingBundle.profile,
        ...nextProfile,
      },
      candidateProfile: {
        ...mergedCandidate,
        profile_strength: profileStrength,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
