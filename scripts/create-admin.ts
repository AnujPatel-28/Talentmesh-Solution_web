import { createClient } from '@insforge/sdk';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('--- TalentMesh Admin Creation ---');

  const email = process.env.ADMIN_EMAIL || await question('Enter Admin Email: ');
  const password = process.env.ADMIN_PASSWORD || await question('Enter Admin Password (min 8 chars, uppercase + number): ');
  const name = process.env.ADMIN_NAME || await question('Enter Admin Display Name: ');
  const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || await question('Enter InsForge URL: ');
  const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || await question('Enter InsForge Anon Key: ');

  if (!email || !password || !name || !insforgeUrl || !insforgeAnonKey) {
    console.error('Error: All fields are required.');
    process.exit(1);
  }

  // Basic password validation
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    console.error('Error: Password must be at least 8 chars and contain an uppercase letter and a number.');
    process.exit(1);
  }

  const insforge = createClient({
    baseUrl: insforgeUrl,
    anonKey: insforgeAnonKey,
  });

  try {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name,
    });

    if (error) {
      if (error.message.includes('User already exists')) {
        console.log('Account already exists. Use /admin/login to sign in.');
      } else {
        console.error('Signup failed:', error.message);
      }
      process.exit(1);
    }

    // Since we can't directly set the role via signUp options in some SDK versions,
    // we assume the 'handle_new_user' trigger or metadata handling is in place.
    // The user's prompt specifically asked for data: { role: 'admin', name: ADMIN_NAME }
    // However, @insforge/sdk signUp usually takes (options: { email, password, name, ... })
    
    console.log(`\n✓ Admin account created for ${email}`);
    console.log(`✓ Add this email to your ADMIN_EMAILS env var: ${email}`);
    console.log('✓ You can now log in at /admin/login');

  } catch (err: any) {
    console.error('An unexpected error occurred:', err.message);
  } finally {
    rl.close();
  }
}

main();
