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
    DO $$
    DECLARE
      v_user_id UUID;
    BEGIN
      -- Mark verified
      UPDATE auth.users 
      SET email_verified = true 
      WHERE email = 'onboard_test_cand@example.com' 
      RETURNING id INTO v_user_id;

      IF v_user_id IS NOT NULL THEN
        -- Upsert profile
        INSERT INTO public.profiles (id, email, name, role, completed_onboarding, is_active)
        VALUES (v_user_id, 'onboard_test_cand@example.com', 'Onboarding Test Candidate', 'candidate', false, true)
        ON CONFLICT (id) DO UPDATE 
        SET 
          role = 'candidate', 
          completed_onboarding = false,
          is_active = true;
      END IF;
    END;
    $$;
  `;
  
  console.log('Verifying and setting up user profile...');
  const { data, error } = await insforge.database.rpc('exec_sql', { query });
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
}

run();
