import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://sytk3jgv.ap-southeast.insforge.app',
  anonKey: 'ik_1a616463854d5d7b3fef4c4bf7516aee',
});

async function test() {
  console.log('Testing upsert...');
  const { data, error } = await client.database
    .from('profiles')
    .upsert({ 
      id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for test
      email: 'test@example.com',
      is_onboarded: true 
    });
    
  if (error) {
    console.error('UPSERT ERROR:', error);
  } else {
    console.log('UPSERT SUCCESS:', data);
  }
}

test();
