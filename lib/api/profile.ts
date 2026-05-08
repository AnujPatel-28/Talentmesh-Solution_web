import { insforge } from '@/lib/insforge';
import { UserProfile } from '@/types/user';

export async function getMyProfile(token?: string): Promise<UserProfile | null> {
  try {
    const { data: { user }, error: userError } = await insforge.auth.getCurrentUser();
    
    if (userError || !user) return null;

    const { data, error } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    console.error('Error in getMyProfile:', err);
    return null;
  }
}
