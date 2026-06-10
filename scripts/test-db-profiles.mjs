import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
const serviceKey = process.env.INSFORGE_SERVICE_KEY || '';

const client = createClient({ baseUrl, anonKey: serviceKey, isServerMode: true });

async function main() {
  console.log("Testing direct DB connection...");
  const { data: profiles, error } = await client.database.from('profiles').select('*').limit(5);
  if (error) {
    console.error("Fetch profiles error:", error);
  } else {
    console.log("Profiles count in DB:", profiles?.length);
  }

  const { data: tables, error: tablesError } = await client.database.rpc('exec_sql', {
    query: "SELECT * FROM non_existent_table;"
  });
  console.log("Error output from exec_sql RPC:", tables, tablesError);
}

main();
