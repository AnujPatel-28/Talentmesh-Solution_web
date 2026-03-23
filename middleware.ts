import { createClient } from '@insforge/sdk'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper: check if email is in admin whitelist
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const envEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'anujpatel30106@gmail.com';
  const list = envEmails
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0)
  return list.includes(email.toLowerCase())
}

function normalizeRole(role: string | undefined, email: string | null | undefined): string | undefined {
  if (isAdminEmail(email) && !['admin', 'super_admin'].includes(role || '')) {
    return 'admin'
  }

  return role
}

// Helper: get InsForge client for edge runtime
function getInsforge(request: NextRequest) {
  const token = request.cookies.get('tm_access_token')?.value
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    edgeFunctionToken: token, // This authenticates the SDK requests automatically using the header
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const insforge = getInsforge(request)

  // ── Get session ──────────────────────────────────────────────
  // We use getCurrentUser() because edgeFunctionToken verifies directly via headers
  const { data: { user } } = await insforge.auth.getCurrentUser()
<<<<<<< HEAD
  const role = request.cookies.get('tm_role')?.value || (user?.metadata?.role as string | undefined)
  const roleId = request.cookies.get('tm_role_id')?.value || ''
=======
>>>>>>> 04ac0dec89ba27ffdf447ffa504124b6e2c58b6c
  
  // Role resolution: prefer the fast cookie, fall back to DB if missing
  let role: string | undefined = request.cookies.get('tm_role')?.value ||
    (user?.metadata?.role as string | undefined);

  // If cookie is absent but user is authenticated, fetch role from profiles table
  if (user && !role) {
    try {
      const { data: profile } = await insforge.database
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role) {
        role = profile.role as string;
      }
    } catch {
      // ignore — fall through with no role
    }
  }

  role = normalizeRole(role, user?.email)

  // For backwards compatibility with the existing code checking `session` below
  const session = user ? { user } : null

  // ── REDIRECT ALREADY-LOGGED-IN USERS AWAY FROM AUTH PAGES ───
<<<<<<< HEAD
  if (user && ['/login', '/signup', '/forgot-password', '/admin/login'].includes(pathname)) {
    // Only redirect admins to admin dashboard if they are on /admin/login
    if (pathname === '/admin/login' && (role === 'super_admin' || role === 'admin')) {
        const dest = `/dashboard/admin/${roleId}`;
        return NextResponse.redirect(new URL(dest, request.url));
    }
    
    // Normal auth redirect for other pages
    const dest = role === 'super_admin' ? `/dashboard/admin/${roleId}`
               : role === 'recruiter' ? `/dashboard/recruiter/${roleId}`
               : `/dashboard/candidate/${roleId}`
=======
  if (user && ['/login', '/signup', '/auth/forgot-password'].includes(pathname)) {
    console.log(`[Middleware DEBUG] User is logged in. Email: ${user.email}, Role: ${role}, Pathname: ${pathname}`);
    const dest = ['super_admin', 'admin'].includes(role || '') ? '/dashboard/admin'
               : role === 'recruiter' ? '/dashboard/recruiter'
               : '/dashboard/candidate'
    console.log(`[Middleware DEBUG] Redirecting authenticated user away from auth page to: ${dest}`);
>>>>>>> 04ac0dec89ba27ffdf447ffa504124b6e2c58b6c
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // ── ADMIN AUTH PAGES (/admin/forgot-password, /admin/reset-password) ──
  // If an already-authenticated admin hits these, redirect to their dashboard
  if (user && ['super_admin', 'admin'].includes(role || '') &&
    ['/admin/forgot-password', '/admin/reset-password'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url))
  }

  // ── PROTECT ALL DASHBOARD ROUTES ─────────────────────────────
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── SUPER ADMIN ROUTES (/dashboard/admin) ────────────────────
<<<<<<< HEAD
  if (pathname.includes('/dashboard/admin')) {
=======
  if (pathname.startsWith('/dashboard/admin')) {
    console.log(`[Middleware DEBUG] Incoming request to /dashboard/admin. User: ${user?.email}, Role: ${role}`);
    
>>>>>>> 04ac0dec89ba27ffdf447ffa504124b6e2c58b6c
    // Check 1: must be logged in
    if (!user) {
      console.log(`[Middleware DEBUG] Rejecting: Not logged in`);
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const adminEmailAllowed = isAdminEmail(user.email ?? '')
    const hasAdminRole = ['super_admin', 'admin'].includes(role || '')

    // Admin dashboard access follows the login UX: whitelisted admin email is enough.
    if (!adminEmailAllowed && !hasAdminRole) {
      console.log(`[Middleware DEBUG] Rejecting: Email ${user.email} and role ${role} are both not admin-authorized`);
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // This prevents blocking admin login when MFA is not set up yet
    const mfaVerified = request.cookies.get('mfa_verified')?.value === 'true';
    try {
      const { data: adminProfile } = await insforge.database
        .from('profiles')
        .select('mfa_enabled')
        .eq('id', user.id)
        .single();
      const mfaEnabled = adminProfile?.mfa_enabled === true;
      if (mfaEnabled && !mfaVerified) {
        return NextResponse.redirect(new URL('/auth/mfa-verify', request.url));
      }
    } catch {
      // If DB lookup fails, skip MFA check rather than blocking the admin
    }
  }

  // ── RECRUITER ROUTES (/dashboard/recruiter) ──────────────────
  if (pathname.includes('/dashboard/recruiter')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (!['recruiter', 'super_admin'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    // Note: is_approved check is done in the page Server Component, not middleware
    // (avoids extra DB call on every request)
  }

  // ── CANDIDATE ROUTES (/dashboard/candidate) ──────────────────
  if (pathname.includes('/dashboard/candidate')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
<<<<<<< HEAD
    if (role === 'super_admin' || role === 'recruiter') {
      const dest = role === 'super_admin' ? `/dashboard/admin/${roleId}` : `/dashboard/recruiter/${roleId}`;
      return NextResponse.redirect(new URL(dest, request.url))
=======
    if (['super_admin', 'admin', 'recruiter'].includes(role || '')) {
      return NextResponse.redirect(new URL('/dashboard/' + (['super_admin', 'admin'].includes(role || '') ? 'admin' : 'recruiter'), request.url))
>>>>>>> 04ac0dec89ba27ffdf447ffa504124b6e2c58b6c
    }
  }

  // ── ROOT /dashboard → ROLE-BASED REDIRECT ────────────────────
  if (pathname === '/dashboard') {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
<<<<<<< HEAD
    const dest = role === 'super_admin' ? `/dashboard/admin/${roleId}`
               : role === 'recruiter' ? `/dashboard/recruiter/${roleId}`
               : `/dashboard/candidate/${roleId}`
=======
    const dest = ['super_admin', 'admin'].includes(role || '') ? '/dashboard/admin'
               : role === 'recruiter' ? '/dashboard/recruiter'
               : '/dashboard/candidate'
>>>>>>> 04ac0dec89ba27ffdf447ffa504124b6e2c58b6c
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // ── AUTH SETUP PAGES ─────────────────────────────────────────
  // /auth/setup-mfa: only for authenticated users
  if (pathname === '/auth/setup-mfa' && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  // /auth/mfa-verify: only for users who have completed password login
  if (pathname === '/auth/mfa-verify' && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/admin/login',
    '/auth/setup-mfa',
    '/auth/mfa-verify',
    '/admin/forgot-password',
    '/admin/reset-password',
  ]
}
