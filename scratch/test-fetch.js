// No import needed for Node 18+

async function testFetch() {
  const url = 'https://sytk3jgv.ap-southeast.insforge.app';
  console.log(`Testing fetch to ${url}...`);
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Headers:`, response.headers.raw());
  } catch (error) {
    console.error(`Fetch failed:`, error.message);
    if (error.cause) {
      console.error(`Cause:`, error.cause.message);
    }
  }
}

testFetch();
