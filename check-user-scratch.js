const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const INSFORGE_SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!INSFORGE_URL || !INSFORGE_SERVICE_KEY || !ANON_KEY) {
  console.error("Missing env variables");
  process.exit(1);
}

async function main() {
  const email = "onboard_test_cand@example.com";
  console.log("Checking user profile for:", email);

  // 1. Fetch profile
  const profileUrl = `${INSFORGE_URL.replace(/\/$/, '')}/api/database/records/profiles?email=eq.${email}`;
  const profileRes = await fetch(profileUrl, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${INSFORGE_SERVICE_KEY}`
    }
  });

  if (!profileRes.ok) {
    console.error("Failed to fetch profile:", profileRes.status, await profileRes.text());
    return;
  }

  const profiles = await profileRes.json();
  const profile = profiles[0];

  if (!profile) {
    console.log("Profile does not exist. Creating fresh user via auth signup...");
    
    // InsForge signup endpoint
    const signupUrl = `${INSFORGE_URL.replace(/\/$/, '')}/api/auth/signup`;
    const signupRes = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password: 'StrongPassword123!',
        options: {
          data: {
            name: 'Onboarding Test Candidate'
          }
        }
      })
    });

    if (!signupRes.ok) {
      console.error("Failed to sign up user:", signupRes.status, await signupRes.text());
      return;
    }

    const signupData = await signupRes.json();
    console.log("Signup success response:", signupData);

    const userId = signupData.user?.id || signupData.id;
    if (!userId) {
      console.error("Could not determine user ID from response");
      return;
    }

    // Upsert profile
    console.log("Creating profile for user:", userId);
    const upsertUrl = `${INSFORGE_URL.replace(/\/$/, '')}/api/database/records/profiles`;
    const upsertRes = await fetch(upsertUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${INSFORGE_SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: userId,
        email,
        name: 'Onboarding Test Candidate',
        role: 'candidate',
        completed_onboarding: false,
      })
    });

    if (!upsertRes.ok) {
      console.error("Failed to upsert profile:", upsertRes.status, await upsertRes.text());
    } else {
      console.log("Successfully created fresh candidate user!");
    }
  } else {
    console.log("Profile exists:", profile);
    if (profile.completed_onboarding) {
      console.log("User has completed onboarding. Resetting status to false...");
      const updateUrl = `${INSFORGE_URL.replace(/\/$/, '')}/api/database/records/profiles?id=eq.${profile.id}`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${INSFORGE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          completed_onboarding: false
        })
      });

      if (!updateRes.ok) {
        console.error("Failed to update profile:", updateRes.status, await updateRes.text());
      } else {
        console.log("Successfully reset completed_onboarding to false!");
      }
    } else {
      console.log("User is already in non-onboarded state. Ready for E2E onboarding test!");
    }
  }
}

main().catch(console.error);
