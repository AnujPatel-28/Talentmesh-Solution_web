const { createClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
});

async function check() {
  const { data, error } = await client.database
    .from('profiles')
    .select('email, metadata, role_id');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Users found:', data.length);
  data.forEach(u => {
    console.log(`- ${u.email}: Role=${u.metadata?.role}, RoleID=${u.role_id}`);
  });
}

check();
