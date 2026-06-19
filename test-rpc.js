import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const serviceKey = process.env.INSFORGE_SERVICE_KEY;

const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: serviceKey,
  isServerMode: true
});

async function main() {
  console.log('Reading migration SQL file...');
  const query = fs.readFileSync('fix-recursion-phase1.sql', 'utf8');
  
  console.log('Running query...');
  const res = await insforge.database.rpc('exec_sql', { query });
  console.log('Migration execution result:', JSON.stringify(res, null, 2));
  
  console.log('Reloading schema...');
  const reloadRes = await insforge.database.rpc('exec_sql', { query: "NOTIFY pgrst, 'reload schema';" });
  console.log('Schema reload result:', JSON.stringify(reloadRes, null, 2));
}
main();
