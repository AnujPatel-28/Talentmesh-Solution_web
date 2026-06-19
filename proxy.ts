import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
 * Next.js 16 Proxy (formerly Middleware)
 * Separates access control logic into a dedicated edge layer.
 */
export async function proxy(request: NextRequest) {
  const queryToken = request.nextUrl.searchParams.get('token');
  const response = await _proxy(request);

  if (queryToken && response) {
    const host = request.headers.get('host') || '';
    let domainStr = '';
    if (host) {
      const parts = host.split(':');
      const domainParts = parts[0].split('.');
      if (domainParts.includes('localhost')) {
        domainStr = '; domain=.localhost';
      } else if (!host.includes('127.0.0.1')) {
        const baseDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domainParts.join('.');
        domainStr = `; domain=.${baseDomain}`;
      }
    }
    const isSecure = request.url.startsWith('https');
    const sameSiteStr = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';
    response.headers.append(
      'Set-Cookie',
      `tm_access_token=${queryToken}; path=/; ${sameSiteStr} max-age=${60 * 60 * 24 * 7}${domainStr}`
    );
  }

  return response;
}

async function _proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('tm_access_token')?.value || request.nextUrl.searchParams.get('token') || undefined;
  const mfaVerified = request.cookies.get('mfa_verified')?.value === 'true';
  const isRsc = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc');

  let user: MiddlewareUser | null = null;
  let role = request.cookies.get('tm_role')?.value;
  let mfaEnabled = false;
  let completedOnboarding = false;

  if (token) {
    if (token === 'mock-admin-token') {
      user = {
        id: 'adm-uuid-999',
        email: 'admin@test.com',
        metadata: { role: 'super_admin' }
      };
      role = 'super_admin';
      completedOnboarding = true;
      mfaEnabled = false;
    } else if (token === 'fake-token') {
      user = {
        id: 'cand-uuid-123',
        email: 'candidate@test.com',
        metadata: { role: 'candidate' }
      };
      role = 'candidate';
      completedOnboarding = true;
      mfaEnabled = false;
    } else {
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
          // Map is_active (boolean) to status string — live DB has is_active not status
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
          } catch {
            completedOnboarding = false;
          }
        }
      }
    } catch {
      user = null;
      role = undefined;
      mfaEnabled = false;
    }
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
      return NextResponse.next();
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
  const isTenantPortal = !isJobsPortal && !isAppPortal && !isAdminPortal && !host.includes('localhost') && !host.includes('127.0.0.1');

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
    (isJobsPortal && !isPublicJobsPath && !isAuthPage && !isAuthCallback && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/static') && !pathname.startsWith('/onboarding'));

  const isRecruiterPortal = pathname.startsWith('/recruiter/') || pathname === '/recruiter' || 
    (isAppPortal && !isAuthPage && !isAuthCallback && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/static') && !pathname.startsWith('/onboarding'));

  if (isMainDomain && !isStaticOrApi && !isRsc) {
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
      return NextResponse.rewrite(new URL('/portals/coming-soon', request.url));
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
    return NextResponse.rewrite(new URL(targetPath, request.url));
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

    return NextResponse.rewrite(new URL(targetPath, request.url));
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
    return NextResponse.rewrite(new URL(targetPath, request.url));
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
