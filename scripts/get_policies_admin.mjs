import { createClient } from '@insforge/sdk';

const baseUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
const serviceKey = 'ik_1a616463854d5d7b3fef4c4bf7516aee'; // SERVICE KEY from .env.local

const insforge = createClient({ baseUrl, anonKey: serviceKey });

async function run() {
  console.log('Fetching ALL policies for platform_settings...');
  const { data, error } = await insforge.database.rpc('get_policies_for_table', { t_name: 'platform_settings' });

  if (error) {
    console.log('RPC failed, trying raw query via exec_sql...');
    const { data: resCode, error: sqlError } = await insforge.database.rpc('exec_sql', { 
      query: "SELECT * FROM pg_policies WHERE tablename = 'platform_settings'" 
    });
    
    if (sqlError || !resCode.success) {
      console.error('Failed to fetch policies:', sqlError || resCode.error);
      process.exit(1);
    }
    console.log('Policies:', JSON.stringify(resCode.data, null, 2));
  } else {
    console.log('Policies (via RPC):', JSON.stringify(data, null, 2));
  }
}

run();
