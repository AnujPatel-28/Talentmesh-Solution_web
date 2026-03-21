import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { insforge } from '@/lib/insforge';
import { insforgeAdmin } from '@/lib/insforge-admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth state safely from cookies
  const token = request.cookies.get('tm_access_token')?.value;
  const role = request.cookies.get('tm_role')?.value;
  const isAuthenticated = !!token;

  // Protected routes
  const isAdminRoute = pathname.startsWith('/dashboard/admin');
  const isRecruiterRoute = pathname.startsWith('/dashboard/recruiter');
  const isCandidateRoute = pathname.startsWith('/dashboard/candidate');
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isAuthRoute) {
    if (role === 'admin' || role === 'super_admin') return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    if (role === 'recruiter') return NextResponse.redirect(new URL('/dashboard/recruiter', request.url));
    return NextResponse.redirect(new URL('/dashboard/candidate', request.url));
  }

  // Deep verification for critical routes
  if (isAuthenticated && (isAdminRoute || isRecruiterRoute)) {
    try {
      // 1. Get user from session
      const { data: { session } } = await insforge.auth.getCurrentSession();
      const user = session?.user;

      if (!user) {
        // Token invalid or expired
        console.error('[Middleware] Session invalid');
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('tm_access_token');
        response.cookies.delete('tm_role');
        return response;
      }

      // 2. PART A: Admin Verification
      if (isAdminRoute) {
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        if (!adminEmails.includes(user.email?.toLowerCase() || '')) {
          console.warn(`[Middleware] Unauthorized admin access attempt by ${user.email}`);
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

      // 3. PART B: Recruiter Approval Gate
      if (isRecruiterRoute && !pathname.includes('/pending-approval')) {
        // Fallback to regular client if admin client is not available (RLS is currently disabled anyway)
        const client = insforgeAdmin || insforge;
        const { data: recruiterProfile } = await client.database
          .from('recruiter_profiles')
          .select('is_approved')
          .eq('id', user.id)
          .single();

        if (!recruiterProfile?.is_approved) {
          console.log(`[Middleware] Recruiter ${user.email} not approved, redirecting to pending-approval`);
          return NextResponse.redirect(new URL('/dashboard/recruiter/pending-approval', request.url));
        }
      }
    } catch (err) {
      console.error('[Middleware] Error during verification:', err);
      // Fail open to public if error, or fail closed? Usually fail closed for security.
    }
  }

  // Basic Cross-role block (fast check using cookies)
  if (isAuthenticated && pathname.startsWith('/dashboard')) {
      if (pathname === '/dashboard') {
          if (role === 'super_admin' || role === 'admin') return NextResponse.redirect(new URL('/dashboard/admin', request.url));
          if (role === 'recruiter') return NextResponse.redirect(new URL('/dashboard/recruiter', request.url));
          return NextResponse.redirect(new URL('/dashboard/candidate', request.url));
      }

      if (isAdminRoute && role !== 'admin' && role !== 'super_admin') return NextResponse.redirect(new URL('/unauthorized', request.url));
      if (isRecruiterRoute && role !== 'recruiter') return NextResponse.redirect(new URL('/unauthorized', request.url));
      if (isCandidateRoute && role !== 'candidate') return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/login', '/signup'],
};
