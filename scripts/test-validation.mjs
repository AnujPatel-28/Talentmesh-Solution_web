import { validateCandidateProfile } from '../lib/validation/candidate.ts';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const serviceKey = process.env.INSFORGE_SERVICE_KEY;

async function run() {
  // Fetch profiles matching the email
  const email = 'anujpatel28104@gmail.com';
  console.log(`Fetching profile for ${email}...`);
  const profileRes = await fetch(`${baseUrl}/api/database/records/profiles?email=eq.${email}`, {
    headers: { 'Authorization': `Bearer ${serviceKey}` }
  });
  const profiles = await profileRes.json();
  const profile = profiles[0];
  
  if (!profile) {
    console.error("Profile not found");
    return;
  }

  // Fetch candidate profile
  const candRes = await fetch(`${baseUrl}/api/database/records/candidate_profiles?id=eq.${profile.id}`, {
    headers: { 'Authorization': `Bearer ${serviceKey}` }
  });
  const candidates = await candRes.json();
  const candidate = candidates[0];

  const validationData = {
    name: profile.name,
    phone: profile.phone,
    location: profile.location,
    about: profile.bio, // Wait, the UI has profile.about, but DB column is profile.bio.
    ...candidate
  };

  console.log("Validation input data:\n", JSON.stringify(validationData, null, 2));

  const result = validateCandidateProfile(validationData);
  console.log("Validation result success:", result.success);
  console.log("Validation errors:\n", JSON.stringify(result.errors, null, 2));
}

run();
