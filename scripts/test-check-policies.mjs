const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://localhost:3000';

async function run() {
  const url = `${baseUrl}/api/check-policies`;
  console.log('Fetching', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
}

run();
