import { createClient } from '@insforge/sdk';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
const serviceKey = process.env.INSFORGE_SERVICE_KEY || '';

if (!baseUrl || !serviceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

async function run() {
  console.log("=== Testing profiles update ===");
  try {
    const url = `${baseUrl}/api/database/records/profiles?id=eq.cf11301b-50f8-41e7-8191-46713a735c4e`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        onboarding_step: 4
      })
    });
    const data = await res.json();
    console.log("onboarding_step update result:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Exception updating onboarding_step:", e);
  }
}

run();

