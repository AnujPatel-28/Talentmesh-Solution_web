import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

async function run() {
  console.log('Testing remote blogs Edge Function with Anon Key...');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const url = `${supabaseUrl}/functions/blogs?limit=100`;
    console.log('Calling URL:', url);
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${anonKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    console.log('Status:', res.status);
    const body = await res.json();
    console.log('Body:', JSON.stringify(body, null, 2));
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Error:', err.message || err);
  }
}

run();
