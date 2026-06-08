import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const baseUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjA3OTd9.y20o7ymk12fdERo9hJpnv2rI5PjH8a9aaYnpcbTx5Yc';

const insforge = createClient({ baseUrl, anonKey });

async function run() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
    email: 'anujpatel30106@gmail.com',
    password: '#Nandi04',
  });

  if (authError) {
    console.error('Sign in failed:', authError.message);
    process.exit(1);
  }

  // Create client representing the authenticated admin user
  const userClient = createClient({
    baseUrl,
    anonKey,
    edgeFunctionToken: authData.accessToken,
    isServerMode: true
  });

  console.log('Checking is_admin status...');
  const isAdminResult = await userClient.database.rpc('is_admin');
  console.log('Is Admin Result:', isAdminResult.data, 'Error:', isAdminResult.error);

  console.log('Attempting direct database SELECT from platform_settings...');
  const selectResult = await userClient.database
    .from('platform_settings')
    .select('*');

  console.log('Select Result data:', selectResult.data);
  console.log('Select Result error:', selectResult.error);
  if (selectResult.error) {
    console.log('Select error keys:', Object.keys(selectResult.error));
    console.log('Select error properties:', Object.getOwnPropertyNames(selectResult.error));
    console.log('Select error message:', selectResult.error.message);
  }

  console.log('Attempting direct database upsert on platform_settings...');
  const upsertResult = await userClient.database
    .from('platform_settings')
    .upsert({
      key: 'feature_flags',
      value: {
        candidateRegistration: false, // Changed from true to test update
        recruiterRegistration: true,
        blogEnabled: true,
        messagingEnabled: true,
        aiMatching: true
      },
      updated_at: new Date().toISOString()
    });

  console.log('Upsert Result data:', upsertResult.data);
  console.log('Upsert Result error:', upsertResult.error);

  console.log('\nFetching settings again to check if update took effect...');
  const checkResult = await userClient.database
    .from('platform_settings')
    .select('*')
    .eq('key', 'feature_flags')
    .single();

  console.log('Final feature_flags value:', JSON.stringify(checkResult.data, null, 2));
}

run();
