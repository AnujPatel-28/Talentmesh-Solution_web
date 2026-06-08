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
  console.log('Attempting SDK UPDATE on platform_settings...');
  const { data, error } = await insforge.database
    .from('platform_settings')
    .update({
      value: {
        candidateRegistration: false,
        recruiterRegistration: true,
        blogEnabled: true,
        messagingEnabled: true,
        aiMatching: true
      },
      updated_at: new Date().toISOString()
    })
    .eq('key', 'feature_flags');

  console.log('Update Result data:', data);
  console.log('Update Result error:', error);

  console.log('Checking if value changed in database...');
  const { data: checkData } = await insforge.database
    .from('platform_settings')
    .select('*')
    .eq('key', 'feature_flags')
    .single();

  console.log('Final feature_flags value:', JSON.stringify(checkData, null, 2));
}

run();
