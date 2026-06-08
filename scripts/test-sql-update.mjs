import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const baseUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
const serviceKey = process.env.INSFORGE_SERVICE_KEY;

const insforge = createClient({
  baseUrl,
  anonKey: serviceKey,
  isServerMode: true
});

async function run() {
  console.log('Executing SQL UPDATE via exec_sql RPC...');
  const sql = `
    UPDATE public.platform_settings
    SET value = '{"candidateRegistration": false, "recruiterRegistration": true, "blogEnabled": true, "messagingEnabled": true, "aiMatching": true}'::jsonb
    WHERE key = 'feature_flags';
  `;

  try {
    const { data, error } = await insforge.database.rpc('exec_sql', { query: sql });
    if (error) {
      console.error('SQL Update failed:', error.message || error);
    } else {
      console.log('✅ SQL Update succeeded! Data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
