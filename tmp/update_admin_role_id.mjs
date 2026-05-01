import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_INSFORGE_URL or NEXT_PUBLIC_INSFORGE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: supabaseAnonKey,
});

async function run() {
  const email = 'anujpatel30106@gmail.com';
  console.log('Updating role_id for:', email);

  const { error: updateError } = await insforge.database
    .from('profiles')
    .update({ role_id: 'admin_anuj' })
    .eq('email', email);
  
  if (updateError) {
    console.error('Error updating role_id:', updateError.message);
  } else {
    console.log('role_id updated to admin_anuj.');
  }
}

run();
