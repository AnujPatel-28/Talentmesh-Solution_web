import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const apiKey = process.env.INSFORGE_SERVICE_KEY!;

async function main() {
  console.log('Connecting to:', baseUrl);
  const client = createClient({ baseUrl, anonKey: apiKey });

  // Creating the table via a direct REST call to the admin endpoint if possible.
  // Since I don't know the admin endpoint, I'll try to use the CLI via run_command.
  
  console.log('Attempting to check table existence...');
  const { error } = await client.database.from('access_requests').select('id').limit(1);
  
  if (error && error.message.includes('relation "access_requests" does not exist')) {
    console.log('Table access_requests does not exist. Please run the SQL manually or via MCP.');
    console.log('SQL to run:');
    console.log(`
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_website TEXT,
    industry TEXT NOT NULL,
    company_size TEXT,
    work_email TEXT NOT NULL,
    phone_number TEXT,
    role_in_company TEXT,
    num_roles TEXT,
    hiring_categories TEXT[] DEFAULT '{}',
    hiring_timeline TEXT,
    additional_notes TEXT,
    request_type TEXT NOT NULL DEFAULT 'access_application',
    status TEXT NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
    `);
  } else if (error) {
    console.error('Error checking table:', error.message);
  } else {
    console.log('Table access_requests exists.');
  }
}

main().catch(console.error);
