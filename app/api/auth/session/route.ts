import { createClient } from '@insforge/sdk';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const envEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return envEmails
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tm_access_token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    edgeFunctionToken: token,
  });

  const { data: { user }, error: userError } = await insforge.auth.getCurrentUser();

  if (userError || !user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const { data: profile } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role || (isAdminEmail(user.email) ? 'admin' : 'candidate');

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: profile?.name || user.email?.split('@')[0] || '',
      role: isAdminEmail(user.email) && !['admin', 'super_admin'].includes(role) ? 'admin' : role,
      avatar_url: profile?.avatar_url || null,
      company_id: profile?.company_id,
      created_at: profile?.created_at,
      mfa_enabled: profile?.mfa_enabled || false,
      password_set_at: profile?.password_set_at,
    },
  });
}
