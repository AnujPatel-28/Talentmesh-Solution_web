import { insforge } from './lib/insforge';

async function testSignup() {
  const email = `test_new_${Date.now()}@example.com`;
  console.log('Attempting signup for', email);
  
  try {
    const { data, error } = await insforge.auth.signUp({
      email,
      password: 'StrongPassword123!',
    });
    
    console.log('Raw data response:', JSON.stringify(data, null, 2));
    console.log('Raw error response:', JSON.stringify(error, null, 2));
  } catch (err: any) {
    console.error('Exception thrown:', err.message);
  }
}

testSignup();
