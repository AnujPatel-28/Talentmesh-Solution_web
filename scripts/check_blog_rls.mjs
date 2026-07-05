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
  console.log('Checking RLS policies for table "blog"...');
  
  const query = `
    DO $$
    DECLARE
      r RECORD;
      msg TEXT := 'POLICIES_LIST:';
    BEGIN
      FOR r IN 
        SELECT 
          policyname, 
          cmd, 
          roles::text as roles_txt, 
          qual::text as qual_txt
        FROM pg_policies 
        WHERE tablename = 'blog'
      LOOP
        msg := msg || E'\\n' || r.policyname || ' | ' || r.cmd || ' | ' || r.roles_txt || ' | ' || COALESCE(r.qual_txt, 'null');
      END LOOP;
      RAISE EXCEPTION '%', msg;
    END;
    $$;
  `;

  const { data, error } = await insforge.database.rpc('exec_sql', { query });
  console.log('Error message contains the output:');
  console.log(error?.message || data);
}

run();
