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
  const email = "gaureepatel397@gmail.com";
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
    console.log("Profile does not exist.");
  } else {
    console.log("Profile exists:", profile);
  }
}

main().catch(console.error);
