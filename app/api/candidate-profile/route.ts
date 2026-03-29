import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import {
  applyResumeAutofill,
  calculateCandidateProfileStrength,
  getDefaultCandidateProfile,
  normalizeCandidateProfile,
  type CandidateSettingsBundle,
} from '@/lib/candidate-profile';
import { getServerInsforgeClient } from '@/lib/server-insforge';
import { candidateProfileSchema } from '@/lib/validation/candidate-profile';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

async function findCandidateProfile(insforge: any, userId: string) {
  const byUserId = await insforge.database.from('candidate_profiles').select('*').eq('user_id', userId).single();
  if (!byUserId.error) return { record: byUserId.data, key: 'user_id' };

  const byId = await insforge.database.from('candidate_profiles').select('*').eq('id', userId).single();
  return { record: byId.data || null, key: 'id' };
}

function buildResponse(profileRow: Record<string, unknown>, candidateRow: Record<string, unknown> | null): CandidateSettingsBundle {
  const normalizedCandidate = normalizeCandidateProfile({
    ...getDefaultCandidateProfile(),
    ...candidateRow,
  });

  return {
    profile: {
      id: getStringValue(profileRow, 'id'),
      email: getStringValue(profileRow, 'email'),
      name: getStringValue(profileRow, 'name'),
      phone: getStringValue(profileRow, 'phone'),
      location: getStringValue(profileRow, 'location'),
      role_id: getNullableStringValue(profileRow, 'role_id'),
      public_id: getStringValue(profileRow, 'public_id') || undefined,
      is_onboarded: profileRow?.completed_onboarding === true,
    },
    candidateProfile: normalizedCandidate,
  };
}

export const GET = withApi(
  { requireAuth: true },
  async (req, { user }) => {
    const insforge = await getServerInsforgeClient();
    if (!insforge) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//added
    let profileRow;

    // 1. Try to fetch profile
    const { data: existingProfile } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('email', user.email)
      .single();

   // if (!existingProfile) {
      // 🔥 AUTO CREATE PROFILE
      /*const { error: insertError } = await insforge.database
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        role: 'candidate',
        name: '',
        completed_onboarding: false,
      });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

  // 🔄 Fetch newly created profile
  const { data: newProfile } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  profileRow = newProfile;*/
    // Check if profile already exists by EMAIL
if (!existingProfile) {
  // Check if profile already exists by EMAIL
  const { data: existingByEmail } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('email', user.email)
    .single();

  if (existingByEmail) {
    profileRow = existingByEmail;
  } else {
    // Create profile
    const { error: insertError } = await insforge.database
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: user.role, // Use the role from getServerUser() instead of hardcoded 'candidate'
        name: user.name || '',
        completed_onboarding: false,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { data: newProfile } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    profileRow = newProfile;
  }
} else {
  // Sync role if it changed in Auth but hasn't updated in DB yet
  if (existingProfile.role !== user.role) {
    const { data: updatedProfile } = await insforge.database
      .from('profiles')
      .update({ role: user.role })
      .eq('id', user.id)
      .select()
      .single();
    profileRow = updatedProfile || existingProfile;
  } else {
    profileRow = existingProfile;
  }
}

// ✅🔥 ADD THIS HERE (VERY IMPORTANT)
await insforge.database
  .from('candidate_profiles')
  .upsert({
    id: user.id,
  });

 

    const lookup = await findCandidateProfile(insforge, user.id);
    const bundle = buildResponse(profileRow, lookup.record);

    // Sync resume autofill if needed
    const autofilled = applyResumeAutofill(bundle.candidateProfile);
    if (autofilled.headline !== bundle.candidateProfile.headline) {
      const nextStrength = calculateCandidateProfileStrength(bundle.profile, autofilled);
      await insforge.database.from('candidate_profiles').update({
        headline: autofilled.headline,
        skills: autofilled.skills,
        profile_strength: nextStrength
      }).eq(lookup.key, user.id);
      bundle.candidateProfile = { ...autofilled, profile_strength: nextStrength };
    }

    return NextResponse.json(bundle);
  }
);

export const PUT = withApi(
  {
    schema: { body: candidateProfileSchema },
    requireAuth: true,
    auditLog: true
  },
  async (req, { body, user }) => {
    const insforge = await getServerInsforgeClient();
    if (!insforge) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });

    const { data: profileRow } = await insforge.database.from('profiles').select('*').eq('id', user.id).single();
    if (!profileRow) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const lookup = await findCandidateProfile(insforge, user.id);
    const existingBundle = buildResponse(profileRow, lookup.record);

    const nextProfile = {
      name: body.profile?.name?.trim() || existingBundle.profile.name,
      phone: body.profile?.phone?.trim() || existingBundle.profile.phone,
      location: body.profile?.location?.trim() || existingBundle.profile.location,
    };

    const mergedCandidate = applyResumeAutofill(normalizeCandidateProfile({
      ...existingBundle.candidateProfile,
      ...body.candidateProfile,
    }));

    const profileStrength = calculateCandidateProfileStrength(nextProfile, mergedCandidate);

    // Update profile
    const { error: profileError } = await insforge.database
    .from('profiles')
    // chnaging this line 
    // .update(nextProfile)
    .update({
      ...nextProfile,
      completed_onboarding: true, //added this line
    
     })
    
    .eq('id', user.id);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    const candidatePayload = {
      ...mergedCandidate,
      profile_strength: profileStrength
    };

    if (lookup.record) {
      await insforge.database.from('candidate_profiles').update(candidatePayload).eq(lookup.key, user.id);
    } else {
      await insforge.database.from('candidate_profiles').insert([{
        [lookup.key]: user.id,
        ...candidatePayload
      }]);
    }

    return NextResponse.json({
      profile: { ...existingBundle.profile, ...nextProfile },
      candidateProfile: { ...mergedCandidate, profile_strength: profileStrength }
    });
  }
);
