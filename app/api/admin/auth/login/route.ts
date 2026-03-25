import { NextRequest, NextResponse } from 'next/server';

import {
  createPublicInsforgeClient,
  getSessionCookieOptions,
  normalizeRole,
} from '@/lib/auth/server-auth';
import { validateLogin } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const validation = validateLogin(payload);
  if (!validation.success || !validation.data) {
    return NextResponse.json(
      { error: validation.errors?.email || validation.errors?.password || 'Invalid login details.' },
      { status: 400 },
    );
  }

  const { email, password } = validation.data;
  const insforge = createPublicInsforgeClient();
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });

  if (error || !data?.accessToken || !data.user?.id || !data.user.email) {
    const message = error?.message?.includes('Invalid login credentials')
      ? 'Invalid email or password. Please try again.'
      : error?.message || 'Unable to sign in.';

    return NextResponse.json({ error: message }, { status: 401 });
  }

  const { data: profile } = await insforge.database
    .from('profiles')
    .select('role, mfa_enabled, status')
    .eq('id', data.user.id)
    .single();

  const role = normalizeRole(profile?.role, data.user.email);
  const isAdmin = role === 'admin' || role === 'super_admin';

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Access denied. You do not have administrator privileges.' },
      { status: 403 },
    );
  }

  if (profile?.status === 'suspended') {
    return NextResponse.json(
      { error: 'This administrator account is suspended. Contact support.' },
      { status: 403 },
    );
  }

  const response = NextResponse.json({
    success: true,
    requiresMfa: profile?.mfa_enabled === true,
    user: {
      id: data.user.id,
      email: data.user.email,
      role,
    },
  });
  const cookieOptions = getSessionCookieOptions();

  response.cookies.set('tm_access_token', data.accessToken, cookieOptions);
  response.cookies.set('tm_role', role, cookieOptions);
  response.cookies.set('tm_admin_access', 'true', cookieOptions);
  response.cookies.set('mfa_verified', '', { ...cookieOptions, maxAge: 0 });

  return response;
}
