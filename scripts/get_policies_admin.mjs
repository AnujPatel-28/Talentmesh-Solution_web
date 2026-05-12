import { createClient } from '@insforge/sdk';

const baseUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
const serviceKey = 'ik_1a616463854d5d7b3fef4c4bf7516aee'; // SERVICE KEY from .env.local

const insforge = createClient({ baseUrl, anonKey: serviceKey });

async function run() {
  console.log('Fetching ALL policies for profiles...');
  const { data, error } = await insforge.database.rpc('get_policies_for_table', { t_name: 'profiles' });

  if (error) {
    // If RPC doesn't exist, use raw SQL via a custom RPC if available, or just try to select from pg_policies
    console.log('RPC failed, trying raw select from pg_policies...');
    const { data: policies, error: sqlError } = await insforge.database
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
    
    if (sqlError) {
      console.error('Failed to fetch policies:', sqlError);
      process.exit(1);
    }
    console.log('Policies:', JSON.stringify(policies, null, 2));
  } else {
    console.log('Policies (via RPC):', JSON.stringify(data, null, 2));
  }
}

run();
