import { createClient } from '@insforge/sdk';
import { User } from '@/types/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_INSFORGE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_INSFORGE_ANON_KEY');
}

// Client containing the anon key, safe for both client and server pages
//changing this line 
export const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: supabaseAnonKey,
});

/**
 * Helper to fetch the current active session
 */
export async function getSession() {
  const { data, error } = await insforge.auth.refreshSession();
  if (error) {
    console.error('Error fetching session:', error.message);
    return null;
  }
  return data || null;
}

/**
 * Helper to fetch the current user
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Helper to fetch the full user profile on the server
 */
export async function getServerUser(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data: profile, error } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching server user profile:', error?.message);
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: profile.name || '',
      role: profile.role as any,
      avatar_url: profile.avatar_url || null,
      company_id: profile.company_id,
      created_at: profile.created_at,
    };
  } catch (err) {
    console.error('Unexpected error in getServerUser:', err);
    return null;
  }
}
