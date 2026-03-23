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

// If the user's email is in the admin whitelist but their role cookie hasn't been
// set to admin yet (e.g. first login), treat them as admin so they aren't blocked.
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
    edgeFunctionToken: token,
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const insforge = getInsforge(request)

  // ── Get session ──────────────────────────────────────────────
  const { data: { user } } = await insforge.auth.getCurrentUser()

  // Role resolution: prefer the fast cookie, fall back to user metadata, then DB
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

  // Upgrade role if the email is whitelisted but cookie is stale/missing
  role = normalizeRole(role, user?.email)

  const isAdmin = ['admin', 'super_admin'].includes(role || '')
  const hasAdminAccessCookie = request.cookies.get('tm_admin_access')?.value === 'true'

  // For backwards compatibility with session checks below
  const session = user ? { user } : null

  // ── REDIRECT ALREADY-LOGGED-IN USERS AWAY FROM AUTH PAGES ───
  const authPages = ['/login', '/signup', '/forgot-password', '/admin/login',
    '/auth/forgot-password']
  if (user && authPages.includes(pathname)) {
    const dest = (isAdmin || hasAdminAccessCookie) ? '/dashboard/admin'
               : role === 'recruiter' ? '/dashboard/recruiter'
               : '/dashboard/candidate'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // ── ADMIN AUTH PAGES (/admin/forgot-password, /admin/reset-password) ──
  if (user && isAdmin &&
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
    // Check 1: must be logged in
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check 2: a successful admin login can be recognized by role, whitelist, or admin session cookie.
    if (!isAdmin && !hasAdminAccessCookie && !isAdminEmail(user.email ?? '')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Check 3: MFA (skip if not yet set up)
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
  if (pathname.startsWith('/dashboard/recruiter')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (!['recruiter', 'super_admin', 'admin'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // ── CANDIDATE ROUTES (/dashboard/candidate) ──────────────────
  if (pathname.startsWith('/dashboard/candidate')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (isAdmin || role === 'recruiter') {
      const dest = isAdmin ? '/dashboard/admin' : '/dashboard/recruiter'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // ── ROOT /dashboard → ROLE-BASED REDIRECT ────────────────────
  if (pathname === '/dashboard') {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const dest = isAdmin ? '/dashboard/admin'
               : role === 'recruiter' ? '/dashboard/recruiter'
               : '/dashboard/candidate'
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
    '/auth/forgot-password',
    '/auth/setup-mfa',
    '/auth/mfa-verify',
    '/admin/forgot-password',
    '/admin/reset-password',
  ]
}
