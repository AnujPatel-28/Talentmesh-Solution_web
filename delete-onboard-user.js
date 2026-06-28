const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const INSFORGE_SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY;

if (!INSFORGE_URL || !INSFORGE_SERVICE_KEY) {
  console.error("Missing env variables");
  process.exit(1);
}

async function main() {
  const email = "onboard_test_cand@example.com";
  console.log("Deleting user via PostgREST RPC:", email);

  // SQL to delete user from auth.users (cascades to public.profiles due to foreign key cascade)
  const query = `
    DELETE FROM auth.users WHERE email = '${email}';
  `;

  // PostgREST RPC url on the remote database
  const rpcUrl = `${INSFORGE_URL.replace(/\/$/, '')}/rest/v1/rpc/exec_sql`;
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': INSFORGE_SERVICE_KEY,
      'Authorization': `Bearer ${INSFORGE_SERVICE_KEY}`
    },
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    console.error("Failed to run SQL:", res.status, await res.text());
  } else {
    console.log("SQL executed successfully! Deleted user:", email);
  }
}

main().catch(console.error);
