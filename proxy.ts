import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as crypto from 'crypto';

import {
  createServerSessionClient,
  normalizeRole,
} from '@/lib/auth/server-auth';
import { createClient } from '@insforge/sdk';

interface MiddlewareUser {
  id: string;
  email?: string | null;
  metadata?: Record<string, any>;
  role_id?: string | null;
  company_id?: string | null;
  status?: string | null;
}

/**
 * Validate signed MFA verification cookie.
 * Returns true if the cookie is valid and recent (within 24 hours).
 */
function validateMfaCookie(mfaCookieValue: string, accessToken: string): boolean {
  try {
    const [signature, timestamp, factorId] = mfaCookieValue.split(':');
    if (!signature || !timestamp) return false;

    const now = Date.now();
    const ts = parseInt(timestamp, 10);

    // Check if timestamp is recent (within 24 hours)
    if (isNaN(ts) || Math.abs(now - ts) > 24 * 60 * 60 * 1000) {
      return false;
    }

    // Validate HMAC signature if factorId is present
    const mfaSecret = process.env.MFA_SIGNING_SECRET;
    if (!mfaSecret) {
      console.error('CRITICAL: MFA_SIGNING_SECRET is not set');
      return false;
    }
    
    if (!factorId) return false;

    const message = `${accessToken}:${factorId}:${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', mfaSecret).update(message).digest('hex');
    if (signature.length !== expectedSignature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch (err) {
    return false;
  }
}

function rewrite(url: URL, request: NextRequest) {
  return NextResponse.rewrite(url, {
    request: {
      headers: request.headers,
    },
  });
}

function next(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

/**
 * Next.js 16 Proxy (formerly Middleware)
 * Separates access control logic into a dedicated edge layer.
 */
export async function proxy(request: NextRequest) {
  let token = request.headers.get('x-access-token') || request.cookies.get('tm_access_token')?.value;
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/tm_access_token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }
  if (token) {
    request.headers.set('x-access-token', token);
  }
  
  return await _proxy(request);
}

async function _proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let token = request.cookies.get('tm_access_token')?.value || request.headers.get('x-access-token') || undefined;

  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/tm_access_token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  // Validate signed MFA verification cookie
  const mfaCookieValue = request.cookies.get('mfa_verified')?.value;
  const mfaVerified = mfaCookieValue && token ? validateMfaCookie(mfaCookieValue, token) : false;

  const isRsc = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc');

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

        const adminDb = createClient({
          baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
          anonKey: process.env.INSFORGE_SERVICE_KEY!,
          isServerMode: true
        });

        const { data: profile } = await adminDb.database
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          user.role_id = profile.role_id as string | null;
          user.status = profile.is_active === false ? 'suspended' : (profile.role === 'recruiter' ? 'active' : 'active');
          completedOnboarding =
            profile.onboarding_complete === true ||
            profile.completed_onboarding === true ||
            profile.onboarding_completed === true ||
            profile.is_onboarded === true;
        }

        role = normalizeRole(
          (profile?.role as string | undefined) || (user.metadata?.role as string | undefined) || role
        );
        mfaEnabled = profile?.mfa_enabled === true;

        if (role === 'recruiter') {
          try {
            const { data: recProfile, error: recError } = await insforge.database
              .from('recruiter_profiles')
              .select('company_id, job_title')
              .eq('id', user.id)
              .single();
            if (recProfile && !recError) {
              user.company_id = recProfile.company_id;
              if (!recProfile.company_id || !recProfile.job_title) {
                completedOnboarding = false;
              }
            } else {
              completedOnboarding = false;
            }
          } catch (err) {
            console.error('[proxy] Recruiter profile fetch error:', err);
          }
        }
      }
    } catch {
      user = null;
      role = undefined;
      mfaEnabled = false;
    }
  }

  const isAdmin = ['admin', 'super_admin'].includes(role || '');
  const hasAdminAccessCookie = request.cookies.get('tm_admin_access')?.value === 'true';

  // Redirect unauthenticated requests to /pending-approval back to login
  if (!user && pathname === '/pending-approval') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Handle direct access to /pending-approval for logged in users
  if (user && pathname === '/pending-approval') {
    if (role === 'recruiter' && user.status === 'pending') {
      return next(request);
    } else {
      const dest = (isAdmin || hasAdminAccessCookie)
        ? '/admin/dashboard'
        : role === 'recruiter'
          ? '/recruiter/dashboard'
          : '/candidate/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  // Enforce pending approval guard for pending recruiters
  if (user && role === 'recruiter' && user.status === 'pending') {
    const isStaticOrApi = pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.');
    if (!isStaticOrApi && pathname !== '/pending-approval') {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }
  }

  const host = request.headers.get('host') || '';
  const isJobsPortal = host.startsWith('jobs.');
  const isAppPortal = host.startsWith('app.');
  const isAdminPortal = host.startsWith('admin.');
  const isLocalhostEnv = host.includes('localhost') || host.includes('127.0.0.1');
  const isTenantPortal = !isJobsPortal && !isAppPortal && !isAdminPortal && !isLocalhostEnv;

  const isStaticOrApi = pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.');
  const isMainDomain = !isJobsPortal && !isAppPortal && !isAdminPortal;

  const authPages = ['/login', '/signup', '/forgot-password', '/admin/login', '/auth/forgot-password'];
  const isAuthCallback = pathname === '/auth/callback';
  const isAuthPage = authPages.some(p => pathname === p || pathname.startsWith(p + '/'));

  const isPublicJobsPath = pathname.startsWith('/browse-jobs') ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/employers') ||
    ['/privacy', '/terms', '/about', '/contact'].some(p => pathname.startsWith(p));

  const isCandidatePortal = pathname.startsWith('/candidate/dashboard') ||
    (isJobsPortal && !isStaticOrApi && !isPublicJobsPath && !isAuthPage && !isAuthCallback && !pathname.startsWith('/onboarding'));

  const isRecruiterPortal = pathname.startsWith('/recruiter/') || pathname === '/recruiter' ||
    (isAppPortal && !isStaticOrApi && !isAuthPage && !isAuthCallback && !pathname.startsWith('/onboarding'));

  // On localhost, subdomains don't resolve — skip cross-subdomain redirects entirely.
  // Path-based routing in this middleware handles access control correctly on localhost.
  if (isMainDomain && !isStaticOrApi && !isRsc && !isLocalhostEnv) {
    const isCandidatePath = pathname === '/candidate' || pathname.startsWith('/candidate/') || pathname === '/dashboard/candidate' || pathname.startsWith('/dashboard/candidate/') || pathname.startsWith('/onboarding/candidate');
    if (isCandidatePath) {
      const proto = request.url.startsWith('https') ? 'https://' : 'http://';
      const cleanHost = host.replace(/^www\./, '');
      let relative = pathname;
      if (pathname.startsWith('/dashboard/candidate')) {
        relative = pathname.substring('/dashboard/candidate'.length);
      } else if (pathname.startsWith('/candidate/dashboard')) {
        relative = pathname.substring('/candidate/dashboard'.length);
      } else if (pathname.startsWith('/candidate')) {
        relative = pathname.substring('/candidate'.length);
      } else if (pathname.startsWith('/onboarding/candidate')) {
        relative = pathname;
      }
      const newUrl = new URL(`${proto}jobs.${cleanHost}${relative || '/dashboard'}${request.nextUrl.search}`);
      return NextResponse.redirect(newUrl);
    }
    const isRecruiterPath = pathname === '/recruiter' || pathname.startsWith('/recruiter/') || pathname === '/dashboard/recruiter' || pathname.startsWith('/dashboard/recruiter/') || pathname.startsWith('/onboarding/recruiter');
    if (isRecruiterPath) {
      const proto = request.url.startsWith('https') ? 'https://' : 'http://';
      const cleanHost = host.replace(/^www\./, '');
      let relative = pathname;
      if (pathname.startsWith('/dashboard/recruiter')) {
        relative = pathname.substring('/dashboard/recruiter'.length);
      } else if (pathname.startsWith('/recruiter/dashboard')) {
        relative = pathname.substring('/recruiter/dashboard'.length);
      } else if (pathname.startsWith('/recruiter')) {
        relative = pathname.substring('/recruiter'.length);
      } else if (pathname.startsWith('/onboarding/recruiter')) {
        relative = pathname;
      }
      const newUrl = new URL(`${proto}app.${cleanHost}${relative || '/dashboard'}${request.nextUrl.search}`);
      return NextResponse.redirect(newUrl);
    }
    const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/dashboard/admin' || pathname.startsWith('/dashboard/admin/');
    if (isAdminPath) {
      const proto = request.url.startsWith('https') ? 'https://' : 'http://';
      const cleanHost = host.replace(/^www\./, '');
      let relative = pathname;
      if (pathname.startsWith('/dashboard/admin')) {
        relative = pathname.substring('/dashboard/admin'.length);
      } else if (pathname.startsWith('/admin/dashboard')) {
        relative = pathname.substring('/admin/dashboard'.length);
      } else if (pathname.startsWith('/admin')) {
        relative = pathname.substring('/admin'.length);
      }
      const newUrl = new URL(`${proto}admin.${cleanHost}${relative || '/dashboard'}${request.nextUrl.search}`);
      return NextResponse.redirect(newUrl);
    }
  }

  // Enforce subdomain routing for portal subdomains when accessing wrong portal path
  if (!isMainDomain && !isStaticOrApi && !isRsc) {
    const proto = request.url.startsWith('https') ? 'https://' : 'http://';
    const cleanHost = host.replace(/^www\./, '').replace(/^(jobs|app|admin)\./, '');

    // 1. Admin path enforcement
    if (pathname.startsWith('/admin') && !isAdminPortal) {
      return NextResponse.redirect(new URL(`${proto}admin.${cleanHost}${pathname}${request.nextUrl.search}`));
    }
    if (pathname.startsWith('/dashboard/admin')) {
      const relativePath = pathname.substring('/dashboard/admin'.length);
      return NextResponse.redirect(new URL(`${proto}admin.${cleanHost}/admin/dashboard${relativePath}${request.nextUrl.search}`));
    }

    // 2. Recruiter path enforcement
    const isRecruiterPath = pathname === '/recruiter' || pathname.startsWith('/recruiter/') || pathname === '/onboarding/recruiter' || pathname.startsWith('/onboarding/recruiter/');
    if (isRecruiterPath && !isAppPortal) {
      return NextResponse.redirect(new URL(`${proto}app.${cleanHost}${pathname}${request.nextUrl.search}`));
    }
    if (pathname.startsWith('/dashboard/recruiter')) {
      let relativePath = pathname.substring('/dashboard/recruiter'.length);
      const segments = relativePath.split('/').filter(Boolean);
      if (segments.length > 0) {
        const firstSegment = segments[0];
        if (firstSegment.startsWith('recr_') || firstSegment === user?.role_id || firstSegment === user?.id || (user && firstSegment.length > 15)) {
          segments.shift();
        }
      }
      relativePath = segments.length > 0 ? '/' + segments.join('/') : '';
      return NextResponse.redirect(new URL(`${proto}app.${cleanHost}/recruiter/dashboard${relativePath}${request.nextUrl.search}`));
    }

    // 3. Candidate path enforcement
    const isCandidatePath = pathname === '/candidate' || pathname.startsWith('/candidate/') || pathname === '/onboarding/candidate' || pathname.startsWith('/onboarding/candidate/');
    if (isCandidatePath && !isJobsPortal) {
      return NextResponse.redirect(new URL(`${proto}jobs.${cleanHost}${pathname}${request.nextUrl.search}`));
    }
    if (pathname.startsWith('/dashboard/candidate')) {
      let relativePath = pathname.substring('/dashboard/candidate'.length);
      const segments = relativePath.split('/').filter(Boolean);
      if (segments.length > 0) {
        const firstSegment = segments[0];
        if (firstSegment.startsWith('cand_') || firstSegment === user?.id || (user && firstSegment.length > 15)) {
          segments.shift();
        }
      }
      relativePath = segments.length > 0 ? '/' + segments.join('/') : '';
      return NextResponse.redirect(new URL(`${proto}jobs.${cleanHost}/candidate/dashboard${relativePath}${request.nextUrl.search}`));
    }
  }


  // authPages is now declared at the top of the function

  // If accessing a specific portal, we can restrict access or rewrite
  if (isAppPortal) {
    // Recruiter portal is not yet open for public access — rewrite to coming-soon
    const isApiOrStatic = pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.');
    if (!isApiOrStatic && !isAuthPage && !isAuthCallback) {
      return rewrite(new URL('/portals/coming-soon', request.url), request);
    }

    if (!user && !isAuthPage && !isAuthCallback) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user && role !== 'recruiter' && !isAdmin && !isAuthPage && !isAuthCallback) {
      // Candidates shouldn't access the app portal
      return NextResponse.redirect(new URL('http://jobs.' + host.replace('app.', '') + '/dashboard', request.url));
    }
  }

  const isDashboardPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/recruiter/dashboard') ||
    pathname.startsWith('/candidate/dashboard');

  if (user && isAuthPage) {
    const dest = (isAdmin || hasAdminAccessCookie)
      ? '/admin/dashboard'
      : role === 'recruiter'
        ? '/recruiter/dashboard'
        : '/candidate/dashboard';

    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (user && isAdmin && ['/admin/forgot-password', '/admin/reset-password'].includes(pathname)) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Redirect legacy /dashboard/* routes to new structure
  if (!isRsc) {
    if (pathname.startsWith('/dashboard/admin')) {
      const relativePath = pathname.substring('/dashboard/admin'.length);
      return NextResponse.redirect(new URL(`/admin/dashboard${relativePath}`, request.url));
    }
    if (pathname.startsWith('/dashboard/recruiter')) {
      let relativePath = pathname.substring('/dashboard/recruiter'.length);
      const segments = relativePath.split('/').filter(Boolean);
      if (segments.length > 0) {
        const firstSegment = segments[0];
        if (firstSegment.startsWith('recr_') || firstSegment === user?.role_id || firstSegment === user?.id || (user && firstSegment.length > 15)) {
          segments.shift();
        }
      }
      relativePath = segments.length > 0 ? '/' + segments.join('/') : '';
      return NextResponse.redirect(new URL(`/recruiter/dashboard${relativePath}`, request.url));
    }
    if (pathname.startsWith('/dashboard/candidate')) {
      let relativePath = pathname.substring('/dashboard/candidate'.length);
      const segments = relativePath.split('/').filter(Boolean);
      if (segments.length > 0) {
        const firstSegment = segments[0];
        if (firstSegment.startsWith('cand_') || firstSegment === user?.role_id || firstSegment === user?.id || (user && firstSegment.length > 15)) {
          segments.shift();
        }
      }
      relativePath = segments.length > 0 ? '/' + segments.join('/') : '';
      return NextResponse.redirect(new URL(`/candidate/dashboard${relativePath}`, request.url));
    }
  }

  // Protect onboarding routes
  if (pathname.startsWith('/onboarding')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/onboarding/recruiter')) {
      if (role !== 'recruiter') {
        const dest = isAdmin ? '/admin/dashboard' : '/candidate/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    } else {
      // Candidate onboarding
      if (role !== 'candidate') {
        const dest = isAdmin ? '/admin/dashboard' : '/recruiter/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  if (isDashboardPath || pathname.startsWith('/onboarding') || isCandidatePortal || isRecruiterPortal) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect appropriately if not completed
    if (!completedOnboarding && !pathname.startsWith('/onboarding')) {
      if (role === 'candidate') {
        return NextResponse.redirect(new URL('/onboarding/candidate', request.url));
      } else if (role === 'recruiter') {
        return NextResponse.redirect(new URL('/onboarding/recruiter/setup', request.url));
      }
    }
  }

  // Handle direct access to /onboarding root
  if (pathname === '/onboarding') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role === 'recruiter') {
      return NextResponse.redirect(new URL('/onboarding/recruiter/setup', request.url));
    }
    if (role !== 'candidate') {
      const dest = isAdmin ? '/admin/dashboard' : '/recruiter/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.redirect(new URL('/onboarding/candidate', request.url));
  }

  const isAdminPath = pathname.startsWith('/admin/dashboard') ||
    (isAdminPortal && !isAuthPage && !isAuthCallback && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/static'));

  if (isAdminPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isAdmin && !hasAdminAccessCookie) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (mfaEnabled && !mfaVerified) {
      return NextResponse.redirect(new URL('/auth/mfa-verify', request.url));
    }

    let relativePath = pathname;
    if (pathname.startsWith('/admin/dashboard')) {
      relativePath = pathname.substring('/admin/dashboard'.length);
    } else if (isAdminPortal) {
      relativePath = pathname === '/' || pathname === '/dashboard' ? '' : pathname;
    }

    const targetPath = `/dashboard/admin${relativePath}`;
    return rewrite(new URL(targetPath, request.url), request);
  }

  const isRecruiterPath = isRecruiterPortal;

  if (isRecruiterPath) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!['recruiter', 'super_admin', 'admin'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    const recruiterId = user.role_id || user.id || 'recruiter';
    const companyId = user.company_id || 'unassigned';

    let relativePath = pathname;
    if (pathname.startsWith('/recruiter/dashboard')) {
      relativePath = pathname.substring('/recruiter/dashboard'.length);
    } else if (pathname.startsWith('/recruiter')) {
      relativePath = pathname.substring('/recruiter'.length);
    } else if (isAppPortal) {
      relativePath = pathname === '/' || pathname === '/dashboard' ? '' : pathname;
    }

    // Strip the recruiter/user ID segment if it's already present at the start of relativePath
    const recSegments = relativePath.split('/').filter(Boolean);
    if (recSegments.length > 0) {
      const firstSegment = recSegments[0];
      if (
        firstSegment.startsWith('recr_') ||
        firstSegment === user?.role_id ||
        firstSegment === user?.id ||
        firstSegment === recruiterId ||
        firstSegment.length > 15
      ) {
        recSegments.shift();
      }
    }
    relativePath = recSegments.length > 0 ? '/' + recSegments.join('/') : '';

    let targetPath = `/dashboard/recruiter/${recruiterId}${relativePath}`;
    const cleanRelativePath = relativePath.replace(/\/$/, '');

    const isNvite = cleanRelativePath === '/nvite' || cleanRelativePath.startsWith('/nvite/');
    const isOffers = cleanRelativePath === '/offers' || cleanRelativePath.startsWith('/offers/');

    let isSpecificJobDetail = false;
    if (cleanRelativePath.startsWith('/jobs/')) {
      const subPath = cleanRelativePath.substring('/jobs/'.length);
      const segments = subPath.split('/');
      const firstSegment = segments[0];
      const knownJobsPaths = ['post-job', 'drafts', 'published', 'expired', 'templates'];
      if (firstSegment && !knownJobsPaths.includes(firstSegment)) {
        isSpecificJobDetail = true;
      }
    }

    if (isNvite || isOffers || isSpecificJobDetail) {
      targetPath = `/company/${companyId}/recruiter/${recruiterId}${relativePath}`;
    }

    return rewrite(new URL(targetPath, request.url), request);
  }

  const isCandidatePath = isCandidatePortal;

  if (isCandidatePath) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdmin || role === 'recruiter') {
      const dest = isAdmin ? '/admin/dashboard' : '/recruiter/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }

    const candidateId = user.id;

    let relativePath = pathname;
    if (pathname.startsWith('/candidate/dashboard')) {
      relativePath = pathname.substring('/candidate/dashboard'.length);
    } else if (isJobsPortal) {
      relativePath = pathname === '/' || pathname === '/dashboard' ? '' : pathname;
    }

    // Strip the candidate/user ID segment if it's already present at the start of relativePath
    const candSegments = relativePath.split('/').filter(Boolean);
    if (candSegments.length > 0) {
      const firstSegment = candSegments[0];
      if (
        firstSegment.startsWith('cand_') ||
        firstSegment === user?.id ||
        firstSegment === candidateId ||
        firstSegment.length > 15
      ) {
        candSegments.shift();
      }
    }
    relativePath = candSegments.length > 0 ? '/' + candSegments.join('/') : '';

    const targetPath = `/dashboard/candidate/${candidateId}${relativePath}`;
    return rewrite(new URL(targetPath, request.url), request);
  }

  if (pathname === '/dashboard') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const dest = (isAdmin || hasAdminAccessCookie)
      ? '/admin/dashboard'
      : role === 'recruiter'
        ? '/recruiter/dashboard'
        : '/candidate/dashboard';

    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Security: Global Admin API Protection
  if (pathname.startsWith('/api/admin') && !isAdmin && !hasAdminAccessCookie) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return next(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
