import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const baseUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjA3OTd9.y20o7ymk12fdERo9hJpnv2rI5PjH8a9aaYnpcbTx5Yc';

const insforge = createClient({ baseUrl, anonKey });

async function run() {
  console.log('Logging in as admin user...');
  const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
    email: 'anujpatel30106@gmail.com',
    password: '#Nandi04',
  });

  if (authError) {
    console.error('Sign in failed:', authError.message);
    process.exit(1);
  }

  const token = authData.accessToken;
  console.log('Login successful. Session token acquired.');

  console.log('\n--- Test 1: Fetching Platform Settings ---');
  try {
    const res = await fetch('http://localhost:3000/api/v1/remote/functions/admin-settings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status Code:', res.status);
    const body = await res.text();
    console.log('Response Body:', body);

    if (res.status === 200) {
      console.log('✅ Test 1 Success: Settings fetched correctly.');
    } else {
      console.error('❌ Test 1 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 1 Request Error:', err);
    process.exit(1);
  }

  console.log('\n--- Test 2: Fetching Administrators List ---');
  try {
    const res = await fetch('http://localhost:3000/api/v1/remote/functions/admin-settings?section=admins', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status Code:', res.status);
    const body = await res.text();
    console.log('Response Body (truncated):', body.substring(0, 500));

    if (res.status === 200) {
      console.log('✅ Test 2 Success: Administrators list fetched correctly.');
    } else {
      console.error('❌ Test 2 Failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test 2 Request Error:', err);
    process.exit(1);
  }

  console.log('\nAll settings API endpoints verified successfully!');
}

run();
