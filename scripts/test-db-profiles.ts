import { createClient } from '@insforge/sdk';

async function testFetch() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';
  const serviceKey = process.env.INSFORGE_SERVICE_KEY || '';

  console.log("Testing direct DB fetch using service key to see if profile exists...");
  const adminClient = createClient({ baseUrl, anonKey: serviceKey });
  
  const { data: users, error: err } = await adminClient.database.from('profiles').select('*').limit(5);
  console.log("Profiles in DB:", users, err);

  const { data: authUsers, error: authErr } = await (adminClient.auth as any).admin?.listUsers() || { data: null, error: null };
  console.log("Auth users:", authUsers?.users?.map((u: any) => ({ id: u.id, email: u.email })) || authErr);

}

testFetch();
