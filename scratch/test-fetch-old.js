async function testFetch() {
  const url = 'https://app.insforge.app';
  console.log(`Testing fetch to ${url}...`);
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`Response Status: ${response.status}`);
  } catch (error) {
    console.error(`Fetch failed:`, error.message);
  }
}

testFetch();
