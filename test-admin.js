const { createClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
});

async function checkAdmin() {
  const email = 'anujpatel30106@gmail.com';
  
  // 1. Get user by email (we'll query profiles since we lack service role key for auth.users)
  const { data: profile, error } = await insforge.database
    .from('profiles')
    .select('*')
    .ilike('email', email)
    .single();

  console.log('Profile lookup:', { profile, error });
}

checkAdmin();
