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

  const token = authData.accessToken;
  const payload = {
    key: 'feature_flags',
    value: {
      candidateRegistration: true,
      recruiterRegistration: true,
      blogEnabled: true,
      messagingEnabled: true,
      aiMatching: true
    }
  };

  console.log('Sending PATCH request to admin-settings edge function...');
  try {
    const res = await fetch('http://localhost:3000/api/v1/remote/functions/admin-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Request failed:', err);
  }
}

run();
