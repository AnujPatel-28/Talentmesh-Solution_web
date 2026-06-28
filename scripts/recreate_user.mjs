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
  const email = 'onboard_test_cand@example.com';
  
  console.log('Recreating user:', email);
  
  // Create User
  const { data: authData, error: authError } = await insforge.auth.signUp({
    email,
    password: 'StrongPassword123!',
    name: 'Onboarding Test Candidate',
  });
  
  console.log('Auth response:', JSON.stringify({ authData, authError }, null, 2));
}

run();
