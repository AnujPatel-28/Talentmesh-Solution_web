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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware DEBUG] Request: ${pathname}`);

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  
  if (!baseUrl || !anonKey) {
    console.error(`[Middleware ERROR] Missing env vars: URL=${!!baseUrl}, Key=${!!anonKey}`);
    return NextResponse.next();
  }

  const insforge = getInsforge(request);

  // ── Get session ──────────────────────────────────────────────
  let user = null;
  try {
    console.log(`[Middleware DEBUG] Calling auth.getCurrentUser()...`);
    const { data, error } = await insforge.auth.getCurrentUser();
    if (error) {
      console.error(`[Middleware ERROR] Auth error: ${error.message}`);
    }
    user = data?.user;
    console.log(`[Middleware DEBUG] User: ${user?.email || 'none'}`);
  } catch (err: any) {
    console.error(`[Middleware FATAL] Auth crash: ${err.message}`);
  }
  
  // Role resolution: prefer the fast cookie, fall back to DB if missing
  let role: string | undefined = request.cookies.get('tm_role')?.value ||
    (user?.metadata?.role as string | undefined);
  const roleId = request.cookies.get('tm_role_id')?.value || ''

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
  if (user && ['/login', '/signup', '/forgot-password', '/admin/login', '/auth/forgot-password'].includes(pathname)) {
    console.log(`[Middleware DEBUG] User is logged in. Email: ${user.email}, Role: ${role}, Pathname: ${pathname}`);
    
    // Only redirect admins to admin dashboard if they are on /admin/login
    if (pathname === '/admin/login' && (role === 'super_admin' || role === 'admin')) {
        const dest = `/dashboard/admin/${roleId}`;
        return NextResponse.redirect(new URL(dest, request.url));
    }
    
    // Normal auth redirect for other pages
    const dest = role === 'super_admin' ? `/dashboard/admin/${roleId}`
               : role === 'recruiter' ? `/dashboard/recruiter/${roleId}`
               : `/dashboard/candidate/${roleId}`;
               
    console.log(`[Middleware DEBUG] Redirecting authenticated user away from auth page to: ${dest}`);
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
  if (pathname.startsWith('/dashboard/admin')) {
    console.log(`[Middleware DEBUG] Incoming request to /dashboard/admin. User: ${user?.email}, Role: ${role}`);

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
  }

  // ── CANDIDATE ROUTES (/dashboard/candidate) ──────────────────
  if (pathname.includes('/dashboard/candidate')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (['super_admin', 'admin', 'recruiter'].includes(role || '')) {
      const dest = role === 'super_admin' ? `/dashboard/admin/${roleId}` 
                 : role === 'recruiter' ? `/dashboard/recruiter/${roleId}`
                 : `/dashboard/candidate/${roleId}`; 
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // ── ROOT /dashboard → ROLE-BASED REDIRECT ────────────────────
  if (pathname === '/dashboard') {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const dest = role === 'super_admin' ? `/dashboard/admin/${roleId}`
               : role === 'recruiter' ? `/dashboard/recruiter/${roleId}`
               : `/dashboard/candidate/${roleId}`;

    return NextResponse.redirect(new URL(dest, request.url))
  }

  // ── AUTH SETUP PAGES ─────────────────────────────────────────
  if (pathname === '/auth/setup-mfa' && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
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
