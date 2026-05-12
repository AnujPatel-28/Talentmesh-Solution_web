import { createClient } from '@insforge/sdk';
import { insforge } from '@/lib/insforge';
import { UserProfile } from '@/types/user';

export async function getMyProfile(token?: string): Promise<UserProfile | null> {
  try {
    // 🔥 Fix: InsForge SDK uses edgeFunctionToken for authenticated requests
    // We match the URL logic from @/lib/insforge to handle proxy correctly
    const client = token ? createClient({
      baseUrl: typeof window !== 'undefined' 
        ? `${window.location.origin}/api/v1/remote` 
        : process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      edgeFunctionToken: token,
      isServerMode: true
    }) : insforge;


    const { data: { user }, error: userError } = await client.auth.getCurrentUser();
    
    if (userError || !user) {
      console.warn('No user found in getMyProfile, userError:', userError);
      return null;
    }

    const { data, error } = await client.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();


    if (error) {
      console.error('Database error in getMyProfile:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Unexpected error in getMyProfile:', err);
    return null;
  }
}

