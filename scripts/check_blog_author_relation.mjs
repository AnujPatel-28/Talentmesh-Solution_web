import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const serviceKey = process.env.INSFORGE_SERVICE_KEY;

const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: serviceKey,
  isServerMode: true
});

async function run() {
  console.log('Verifying blog.author_id -> profiles relationship...');
  const { data, error } = await insforge.database
    .from('blog')
    .select('id, title, author_id, author:profiles(name)')
    .limit(1);
    
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
}

run();
