import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://sytk3jgv.ap-southeast.insforge.app';
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'ik_1a616463854d5d7b3fef4c4bf7516aee';

const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
});

async function main() {
  // Let's authenticate as a test user or just see if anon query fails with recursion
  // The error in the screenshot happened for an authenticated candidate.
  // "Failed to fetch applications: infinite recursion detected in policy for relation "jobs""
  // Actually, we can test just by making the query with the anon key. 
  // If we receive "infinite recursion", it means anon triggers it too. If not, we might need a session.
  
  console.log('Testing nested select...');
  const res1 = await insforge.database.from('applications').select('*, jobs(id)').limit(1);
  console.log('Nested Select Error:', res1.error?.message || 'Success');

  console.log('Testing separate selects...');
  const res2 = await insforge.database.from('applications').select('*').limit(1);
  console.log('Applications Select Error:', res2.error?.message || 'Success');

  const res3 = await insforge.database.from('jobs').select('*').limit(1);
  console.log('Jobs Select Error:', res3.error?.message || 'Success');
}

main().catch(console.error);
