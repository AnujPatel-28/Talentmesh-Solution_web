import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const serviceKey = process.env.INSFORGE_SERVICE_KEY;

const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: serviceKey,
  isServerMode: true
});

async function run() {
  const query = `
    DELETE FROM public.profiles WHERE email = 'onboard_test_cand@example.com';
    DELETE FROM auth.users WHERE email = 'onboard_test_cand@example.com';
  `;
  const { data, error } = await insforge.database.rpc('exec_sql', { query });
  console.log('Result:', data, error);
}

run();
