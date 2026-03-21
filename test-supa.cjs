const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  const email = `test_supa_${Date.now()}@example.com`;
  console.log('Attempting raw Supabase signup for', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'StrongPassword123!',
  });
  
  console.log('Raw Supabase data response:', JSON.stringify(data, null, 2));
  console.log('Raw Supabase error response:', JSON.stringify(error, null, 2));
}

testSignup();
