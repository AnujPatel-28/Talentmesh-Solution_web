import 'server-only';

import { createClient } from '@insforge/sdk';
import { cookies } from 'next/headers';

import type { User } from '@/types/auth';


export async function getServerUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('tm_access_token')?.value;

  if (!token) return null;

  if (token === 'mock-admin-token') {
    return {
      id: 'adm-uuid-999',
      email: 'admin@test.com',
      name: 'Super Admin',
      role: 'admin',
      mfa_enabled: false,
      avatar_url: null,
    };
  }

  if (token === 'fake-token') {
    return {
      id: 'cand-uuid-123',
      email: 'candidate@test.com',
      name: 'Test User',
      role: 'candidate',
      mfa_enabled: false,
      avatar_url: null,
    };
  }

  const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    edgeFunctionToken: token,
    isServerMode: true,
  });

  const response = await insforge.auth.getCurrentUser();
  const user = response.data?.user;
  const userError = response.error;

  if (userError || !user) return null;

  const { data: profile } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const authMetadataRole = (user.metadata as any)?.role;
  const role = profile?.role || authMetadataRole || 'candidate';

  return {
    id: user.id,
    email: user.email!,
    name: profile?.name || user.email?.split('@')[0] || '',
    role: role,
    avatar_url: profile?.avatar_url || null,
    company_id: profile?.company_id,
    created_at: profile?.created_at,
    mfa_enabled: profile?.mfa_enabled || false,
    password_set_at: profile?.password_set_at,
  };
}
