const { insforge } = require('./lib/insforge');

async function checkAdmin() {
  const email = 'anujpatel30106@gmail.com';
  console.log(`Checking profile for: ${email}`);
  
  const { data, error } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return;
  }

  console.log('Profile found:', JSON.stringify(data, null, 2));
}

checkAdmin();
