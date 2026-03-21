import { createClient } from '@insforge/sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_INSFORGE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_INSFORGE_ANON_KEY');
}

// Client containing the anon key, safe for both client and server pages
export const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: supabaseAnonKey,
});

/**
 * Helper to fetch the current active session
 */
export async function getSession() {
  const { data, error } = await insforge.auth.getCurrentSession();
  if (error) {
    console.error('Error fetching session:', error.message);
    return null;
  }
  return data?.session || null;
}

/**
 * Helper to fetch the current user
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}
