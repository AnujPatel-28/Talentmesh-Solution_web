import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const apiKey = process.env.INSFORGE_SERVICE_KEY!;

async function main() {
  console.log('Connecting to:', baseUrl);
  const client = createClient({ baseUrl, anonKey: apiKey });

  // Use raw SQL via the SDK if possible, but the SDK might not have it.
  // Actually, the InsForge SDK for DB usually uses PostgREST.
  // To run raw SQL, we usually need the admin API or a special endpoint.
  
  // Wait, if I can't use raw SQL via SDK, I'll use fetch to the internal SQL endpoint if it exists.
  // Most BaaS have a way.
  
  // However, I can try to see if the table exists by trying a select.
  const { error } = await client.database.from('access_requests').select('id').limit(1);
  
  if (error) {
    console.log('Table access_requests does not seem to exist or error:', error.message);
  } else {
    console.log('Table access_requests already exists.');
  }
}

main().catch(console.error);
