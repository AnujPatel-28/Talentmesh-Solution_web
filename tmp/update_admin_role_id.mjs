import { createClient } from '@insforge/sdk';

const supabaseUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
const supabaseAnonKey = 'ik_1a616463854d5d7b3fef4c4bf7516aee';

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
