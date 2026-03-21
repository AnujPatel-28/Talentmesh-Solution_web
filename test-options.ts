import { insforge } from './lib/insforge';

async function testSignup() {
  const email = `test_options_${Date.now()}@example.com`;
  console.log('Attempting signup with options for', email);
  
  try {
    const { data: authData, error: authError } = await insforge.auth.signUp({
      email,
      password: 'StrongPassword123!',
    });

    if (authError) throw new Error(authError.message);

    const data: any = { ...authData };

    if (authData?.user) {
      // Create user profile separately as expected by InsForge
      const { error: profileError } = await insforge.database
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email,
          role: 'candidate',
          full_name: 'Test'
        }]);
        
      if (profileError) throw new Error(profileError.message);
      data.profile_created = true;
    }

    const error = authError;
    
    console.log('Raw data response:', JSON.stringify(data, null, 2));
    console.log('Raw error response:', JSON.stringify(error, null, 2));
  } catch (err: any) {
    console.error('Exception thrown:', err.message);
  }
}

testSignup();
