import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  createServerSessionClient,
  isWhitelistedAdminEmail,
  normalizeRole,
} from '@/lib/auth/server-auth';

interface MiddlewareUser {
  id: string;
  email?: string | null;
  metadata?: Record<string, any>;
  role_id?: string | null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('tm_access_token')?.value;
  const mfaVerified = request.cookies.get('mfa_verified')?.value === 'true';

  let user: MiddlewareUser | null = null;
  let role = request.cookies.get('tm_role')?.value;
  let mfaEnabled = false;
  let completedOnboarding = false;

  if (token) {
    try {
      const insforge = createServerSessionClient(token);
      const res = await insforge.auth.getCurrentUser();
      const currentUser = res.data?.user;

      if (currentUser) {
        user = {
          id: currentUser.id,
          email: currentUser.email,
          metadata: currentUser.metadata as Record<string, any>,
        };

        const { data: profile } = await insforge.database
          .from('profiles')
          .select('role, mfa_enabled, role_id,completed_onboarding')
          .eq('id', user.id)
          .single();

        if (profile) {
          user.role_id = profile.role_id as string | null;
          completedOnboarding = profile.completed_onboarding === true;
        }

        role = normalizeRole(
          (profile?.role as string | undefined) || (user.metadata?.role as string | undefined) || role,
          user.email,
        );
        mfaEnabled = profile?.mfa_enabled === true;
      }
    } catch {
      user = null;
      role = undefined;
      mfaEnabled = false;
    }
  }

  const isAdmin = ['admin', 'super_admin'].includes(role || '');
  const hasAdminAccessCookie = request.cookies.get('tm_admin_access')?.value === 'true';
  const session = user ? { user } : null;

  const authPages = ['/login', '/signup', '/forgot-password', '/admin/login', '/auth/forgot-password'];
  if (user && authPages.includes(pathname)) {
    const dest = (isAdmin || hasAdminAccessCookie)
      ? '/dashboard/admin'
      : role === 'recruiter'
        ? '/dashboard/recruiter'
        : '/dashboard/candidate';

    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (user && isAdmin && ['/admin/forgot-password', '/admin/reset-password'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url));
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Onboarding Redirection Logic
   // const isCandidate = role === 'candidate';
    //const isRecruiter = role === 'recruiter';
    //const hasRoleId = user.role_id || user.metadata?.role_id; // Check if user has a custom role_id set
    
    // For now, let's use the presence of role_id as the indicator of completed onboarding
    // since both Candidate and Recruiter onboarding flows eventually set it.
   // if ((isCandidate || isRecruiter) && !hasRoleId && !pathname.startsWith('/onboarding')) {
     // const dest = isCandidate ? '/onboarding/candidate' : '/onboarding/recruiter/setup';
     // return NextResponse.redirect(new URL(dest, request.url));
    //}
    

   // 🔥 Correct onboarding logic
    if ((role === 'candidate' || role === 'recruiter') && !completedOnboarding && !pathname.startsWith('/onboarding')) {
    const dest = role === 'candidate'
      ? '/onboarding/candidate'
     : '/onboarding/recruiter/setup';

     return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  if (pathname.startsWith('/dashboard/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isAdmin && !hasAdminAccessCookie && !isWhitelistedAdminEmail(user.email ?? '')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (mfaEnabled && !mfaVerified) {
      return NextResponse.redirect(new URL('/auth/mfa-verify', request.url));
    }
  }

  if (pathname.startsWith('/dashboard/recruiter')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!['recruiter', 'super_admin', 'admin'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/dashboard/candidate')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAdmin || role === 'recruiter') {
      const dest = isAdmin ? '/dashboard/admin' : '/dashboard/recruiter';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  if (pathname === '/dashboard') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const dest = isAdmin
      ? '/dashboard/admin'
      : role === 'recruiter'
        ? '/dashboard/recruiter'
        : '/dashboard/candidate';

    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Security: Global Admin API Protection
  if (pathname.startsWith('/api/admin') && !isAdmin && !hasAdminAccessCookie) {
    if (user && !isWhitelistedAdminEmail(user.email ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // If no user at all, handled by the specific route or fallback to 401
  }

  // Security: Simple Rate Limiting Point (Stub)
  // In production, use Redis or a dedicated rate-limiting service/middleware
  // We can track usage per IP or Token here if needed.
  // const ip = request.ip || '127.0.0.1';
  // const rateLimitKey = `rl:${ip}:${pathname}`;

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/admin/login',
    '/auth/forgot-password',
    '/auth/setup-mfa',
    '/api/admin/:path*', // Added explicit API admin protection
    '/api/candidate-profile/:path*',
  ],
};
