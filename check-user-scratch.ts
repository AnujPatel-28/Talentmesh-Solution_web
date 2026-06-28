import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const INSFORGE_SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY;

if (!INSFORGE_URL || !INSFORGE_SERVICE_KEY) {
  console.error("Missing env variables");
  process.exit(1);
}

const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_SERVICE_KEY,
  isServerMode: true,
});

async function main() {
  const email = "onboard_test_cand@example.com";
  console.log("Checking user profile for:", email);

  const { data: profile, error } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error("Database error:", error);
    return;
  }

  if (!profile) {
    console.log("Profile does not exist. Creating fresh user...");
    const { data: authData, error: authError } = await insforge.auth.signUp({
      email,
      password: 'StrongPassword123!',
      name: 'Onboarding Test Candidate',
    });

    if (authError) {
      console.error("Signup error:", authError);
      return;
    }

    const userId = authData?.user?.id;
    console.log("Created user with ID:", userId);

    const { error: profileError } = await insforge.database
      .from('profiles')
      .upsert({
        id: userId,
        email,
        name: 'Onboarding Test Candidate',
        role: 'candidate',
        completed_onboarding: false,
      });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
    } else {
      console.log("Upserted fresh candidate profile!");
    }
  } else {
    console.log("Profile exists:", profile);
    if (profile.completed_onboarding) {
      console.log("User has completed onboarding. Resetting status to false...");
      const { error: updateError } = await insforge.database
        .from('profiles')
        .update({ completed_onboarding: false })
        .eq('id', profile.id);

      if (updateError) {
        console.error("Update error:", updateError);
      } else {
        console.log("Successfully reset completed_onboarding to false!");
      }
    }
  }
}

main().catch(console.error);
