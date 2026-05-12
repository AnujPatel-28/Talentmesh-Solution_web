import { createClient } from '@insforge/sdk';

const baseUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjA3OTd9.y20o7ymk12fdERo9hJpnv2rI5PjH8a9aaYnpcbTx5Yc';

const insforge = createClient({ baseUrl, anonKey });

async function run() {
  console.log('Testing SDK Sign In...');
  const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
    email: 'anujpatel30106@gmail.com',
    password: '#Nandi04',
  });

  if (authError) {
    console.error('Sign in failed:', authError);
    process.exit(1);
  }

  console.log('Sign in successful! User ID:', authData.user.id);

  console.log('Fetching Profile...');
  const { data: profile, error: profileError } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch failed:', profileError);
    process.exit(1);
  }

  console.log('Profile found:', JSON.stringify(profile, null, 2));
  
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    console.log('SUCCESS: User has admin role and can access dashboard!');
  } else {
    console.error('FAILED: User does not have admin role. Current role:', profile.role);
    process.exit(1);
  }
}

run();
