import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: anonKey,
  isServerMode: true
});

async function run() {
  const { data, error } = await insforge.database.from('blog').select('*');
  console.log('Result:', JSON.stringify({ count: data?.length, error, data }, null, 2));
}

run();
