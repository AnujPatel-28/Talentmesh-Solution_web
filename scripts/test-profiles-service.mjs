import { createClient } from '@supabase/supabase-js';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const INSFORGE_SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY;

if (!INSFORGE_URL || !INSFORGE_SERVICE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(INSFORGE_URL, INSFORGE_SERVICE_KEY);

async function run() {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', '%admin%')
    .limit(5);

  console.log("Profiles with admin in email:", profile, error);
  
  const { data: all, error: allErr } = await supabase
    .from('profiles')
    .select('email, role, completed_onboarding')
    .limit(10);
    
  console.log("All profiles:", all, allErr);
}

run();
