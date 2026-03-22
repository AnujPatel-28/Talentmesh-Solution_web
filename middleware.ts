import { createClient } from '@insforge/sdk'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper: check if email is in admin whitelist
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0)
  return list.includes(email.toLowerCase())
}

// Helper: get InsForge client for edge runtime
function getInsforge(request: NextRequest) {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    storage: {
      // Edge runtime compatible storage using cookies
      getItem: (key: string) => request.cookies.get(key)?.value ?? null,
      setItem: () => {},
      removeItem: () => {}
    }
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const insforge = getInsforge(request)

  // ── Get session ──────────────────────────────────────────────
  const { data: { session } } = await insforge.auth.getCurrentSession()
  const user = session?.user
  const role = user?.metadata?.role as string | undefined

  // ── REDIRECT ALREADY-LOGGED-IN USERS AWAY FROM AUTH PAGES ───
  if (user && ['/login', '/signup', '/auth/forgot-password'].includes(pathname)) {
    const dest = role === 'super_admin' ? '/dashboard/admin'
               : role === 'recruiter' ? '/dashboard/recruiter'
               : '/dashboard/candidate'
    return NextResponse.redirect(new URL(dest, request.url))
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
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    // Check 2: role must be super_admin
    if (role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Check 3: email must be in whitelist
    if (!isAdminEmail(user.email ?? '')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Check 4: MFA required — check mfa_verified session cookie
    // After successful TOTP verification, our /api/mfa/verify route sets
    // an httpOnly 'mfa_verified' cookie. If it's absent, redirect to verify.
    const mfaVerified = request.cookies.get('mfa_verified')?.value === 'true'
    if (!mfaVerified) {
      return NextResponse.redirect(new URL('/auth/mfa-verify', request.url))
    }
  }

  // ── RECRUITER ROUTES (/dashboard/recruiter) ──────────────────
  if (pathname.startsWith('/dashboard/recruiter')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (!['recruiter', 'super_admin'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    // Note: is_approved check is done in the page Server Component, not middleware
    // (avoids extra DB call on every request)
  }

  // ── CANDIDATE ROUTES (/dashboard/candidate) ──────────────────
  if (pathname.startsWith('/dashboard/candidate')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (role === 'super_admin' || role === 'recruiter') {
      return NextResponse.redirect(new URL('/dashboard/' + (role === 'super_admin' ? 'admin' : 'recruiter'), request.url))
    }
  }

  // ── ROOT /dashboard → ROLE-BASED REDIRECT ────────────────────
  if (pathname === '/dashboard') {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const dest = role === 'super_admin' ? '/dashboard/admin'
               : role === 'recruiter' ? '/dashboard/recruiter'
               : '/dashboard/candidate'
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
    '/auth/forgot-password',
    '/auth/setup-mfa',
    '/auth/mfa-verify',
  ]
}
