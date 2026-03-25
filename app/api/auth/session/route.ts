import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withApi } from '@/lib/api/handler';
import {
  createServerSessionClient,
  getSessionCookieOptions,
} from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  { requireAuth: true },
  async (req, { user }) => {
    // RequiresMfa is calculated based on user role and profile in withApi's getServerUser which calls resolveSessionFromToken
    // But getServerUser actually returns the User type, not AuthenticatedSession.
    // Let's check session.requiresMfa logic.
    
    return NextResponse.json({
        user,
        requiresMfa: user.role === 'admin' || user.role === 'super_admin' ? user.mfa_enabled : false
    });
  }
);

export const DELETE = withApi(
  { requireAuth: false, auditLog: true },
  async (req) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('tm_access_token')?.value;
    const response = NextResponse.json({ success: true });
    const cookieOptions = getSessionCookieOptions();

    if (token) {
      try {
        const insforge = createServerSessionClient(token);
        await insforge.auth.signOut();
      } catch {
        // Clearing cookies below is enough to end the local session.
      }
    }

    // Force deletion with both maxAge: 0 and expires: ancient date for maximum browser compatibility
    const clearOptions = { ...cookieOptions, maxAge: 0, expires: new Date(0) };

    response.cookies.set('tm_access_token', '', clearOptions);
    response.cookies.set('tm_role', '', clearOptions);
    response.cookies.set('tm_admin_access', '', clearOptions);
    response.cookies.set('mfa_verified', '', clearOptions);

    return response;
  }
);
