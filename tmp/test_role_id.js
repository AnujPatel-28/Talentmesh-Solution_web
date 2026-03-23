const { createClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
});

async function addColumn() {
  console.log('Attempting to add role_id column via RPC or raw SQL proxy...');
  // Since we don't have a direct raw SQL tool that works right now, 
  // let's try to just update a user with role_id anyway to see if it works 
  // (maybe it WAS added but my schema check missed it).
  
  const { error } = await client.database
    .from('profiles')
    .update({ role_id: 'admin_anuj' })
    .eq('email', 'anujpatel30106@gmail.com');
    
  if (error) {
    if (error.message.includes('column "role_id" of relation "profiles" does not exist')) {
        console.error('Column role_id does NOT exist.');
    } else {
        console.error('Other Error:', error.message);
    }
  } else {
    console.log('Success! role_id column exists and was updated.');
  }
}

addColumn();
