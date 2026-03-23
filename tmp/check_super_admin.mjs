import { createClient } from '@insforge/sdk';

const supabaseUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
const supabaseAnonKey = 'ik_1a616463854d5d7b3fef4c4bf7516aee';

const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: supabaseAnonKey,
});

async function run() {
  const email = 'anujpatel30106@gmail.com';
  console.log('Checking profile for:', email);

  const { data: profile, error } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.log('Profile not found, creating one...');
    const { error: insertError } = await insforge.database
      .from('profiles')
      .insert([{
        email,
        role: 'super_admin',
        name: 'Super Admin',
        role_id: 'admin_anuj'
      }]);
    
    if (insertError) {
      console.error('Error creating profile:', insertError.message);
    } else {
      console.log('Profile created successfully as super_admin.');
    }
  } else {
    console.log('Profile found:', profile);
    if (profile.role !== 'super_admin') {
      console.log('Updating role to super_admin...');
      const { error: updateError } = await insforge.database
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('email', email);
      
      if (updateError) {
        console.error('Error updating role:', updateError.message);
      } else {
        console.log('Role updated to super_admin.');
      }
    } else {
      console.log('User is already super_admin.');
    }
  }
}

run();
