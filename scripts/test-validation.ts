import { validateCandidateProfile } from '../lib/validation/candidate';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const serviceKey = process.env.INSFORGE_SERVICE_KEY;

async function run() {
  const profileId = 'cf11301b-50f8-41e7-8191-46713a735c4e';
  console.log(`Fetching profile for ID ${profileId}...`);
  
  const profileRes = await fetch(`${baseUrl}/api/database/records/profiles?id=eq.${profileId}`, {
    headers: { 'Authorization': `Bearer ${serviceKey}` }
  });
  const profiles = await profileRes.json() as any[];
  const profile = profiles[0];
  
  if (!profile) {
    console.error("Profile not found");
    return;
  }

  const candRes = await fetch(`${baseUrl}/api/database/records/candidate_profiles?id=eq.${profile.id}`, {
    headers: { 'Authorization': `Bearer ${serviceKey}` }
  });
  const candidates = await candRes.json() as any[];
  const candidate = candidates[0];

  const validationData = {
    name: profile.name,
    phone: profile.phone,
    location: profile.location,
    about: profile.bio,
    ...candidate
  };

  console.log("Validation input data:\n", JSON.stringify(validationData, null, 2));

  const result = validateCandidateProfile(validationData);
  console.log("Validation result success:", result.success);
  console.log("Validation errors:\n", JSON.stringify(result.errors, null, 2));
}

run();
