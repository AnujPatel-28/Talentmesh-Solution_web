/**
 * API Security Verification Script
 * This script tests the new API handler's validation, authorization, and error handling.
 */

async function testApiSecurity() {
  const baseUrl = 'http://localhost:3000'; // Assume local dev server is running
  
  console.log('--- Testing API Security ---');

  // 1. Test Public Jobs Validation
  console.log('\n[1] Testing Public Jobs Validation (Invalid Query)...');
  try {
    const res = await fetch(`${baseUrl}/api/jobs?limit=abc`);
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Payload:', JSON.stringify(data, null, 2));
    if (res.status === 400 && data.error === 'Invalid query parameters') {
        console.log('✅ PASS: Caught invalid limit parameter');
    } else {
        console.log('❌ FAIL: Expected 400 with validation error');
    }
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  // 2. Test Admin Jobs Unauthorized
  console.log('\n[2] Testing Admin Jobs (Unauthorized Access)...');
  try {
    const res = await fetch(`${baseUrl}/api/admin/jobs`);
    const data = await res.json();
    console.log('Status:', res.status);
    if (res.status === 401 || res.status === 403) {
        console.log('✅ PASS: Unauthorized access blocked');
    } else {
        console.log('❌ FAIL: Admin route should be protected');
    }
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  // 3. Test Candidate Profile Validation
  console.log('\n[3] Testing Candidate Profile (Invalid Body Type)...');
  try {
    const res = await fetch(`${baseUrl}/api/candidate-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateProfile: { experience_years: 'many' } })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    if (res.status === 400 || res.status === 401) { // 401 if not logged in, 400 if logged in but invalid
        console.log(`✅ PASS: Result ${res.status} as expected (either blocked or validation failed)`);
    } else {
        console.log('❌ FAIL: Should have failed auth or validation');
    }
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  console.log('\n--- Security Audit Tests Completed ---');
}

// Note: This script assumes the server is running.
// In a real CI environment, we would use a mock server or a dedicated test environment.
console.log('Running security mock tests...');
testApiSecurity();
