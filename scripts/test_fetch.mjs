import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = `${process.env.NEXT_PUBLIC_INSFORGE_URL}/api/database/rpc/exec_sql`;
const key = process.env.INSFORGE_SERVICE_KEY;

async function run() {
  const query = "SELECT current_database(), current_user;";
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({ query })
  });

  const text = await response.text();
  console.log('HTTP Status:', response.status);
  console.log('Raw Response:', text);
}

run();
