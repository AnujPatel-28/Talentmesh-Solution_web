const { createClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
});

async function findAdmin() {
  const { data, error } = await client.database
    .from('profiles')
    .select('email, role, name');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const admins = data.filter(u => 
    ['anujpatel30106@gmail.com', 'admin@talentmesh.ai', 'hello@talentmesh.ai'].includes(u.email)
  );
  
  console.log('Target Users found:', JSON.stringify(admins, null, 2));
}

findAdmin();
