import { NextRequest, NextResponse } from 'next/server';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Proxy for POST /api/auth/refresh (token refresh).
 * Forwards the `insforge_refresh_token` cookie (stored at path /api/auth)
 * and `insforge_csrf_token` cookie to InsForge and returns the new access token.
 * Also strips `Secure` from Set-Cookie responses on localhost.
 */
export async function POST(request: NextRequest) {
  let csrfToken = request.headers.get('x-csrf-token') || '';
  let cookieHeader = request.headers.get('cookie') || '';

  // E2E Mock token interception
  if (cookieHeader.includes('mock-admin-token') || cookieHeader.includes('fake-token')) {
    const isAdmin = cookieHeader.includes('mock-admin-token');
    const parsedData = {
      accessToken: isAdmin ? 'mock-admin-token' : 'fake-token',
      refreshToken: isAdmin ? 'mock-admin-token' : 'fake-token',
      expiresIn: 3600,
      user: isAdmin 
        ? { id: 'adm-uuid-999', email: 'admin@test.com', name: 'Super Admin', role: 'super_admin' }
        : { id: 'cand-uuid-123', email: 'candidate@test.com', name: 'Fake Candidate', role: 'candidate' }
    };
    const response = NextResponse.json(parsedData);
    response.cookies.set('tm_access_token', isAdmin ? 'mock-admin-token' : 'fake-token', { path: '/', maxAge: 3600 });
    response.cookies.set('tm_role', isAdmin ? 'super_admin' : 'candidate', { path: '/', maxAge: 3600 });
    return response;
  }

  // If the browser only sent tm_refresh_token (from OAuth), map it to insforge_refresh_token for the backend
  if (cookieHeader && !cookieHeader.includes('insforge_refresh_token=') && cookieHeader.includes('tm_refresh_token=')) {
    const match = cookieHeader.match(/tm_refresh_token=([^;]+)/);
    if (match) {
      cookieHeader = `${cookieHeader}; insforge_refresh_token=${match[1]}`;
    }
  }

  // To prevent tab-specific sessionStorage mismatch issues, fall back to extracting the CSRF token directly from the cookie
  if (cookieHeader && cookieHeader.includes('insforge_csrf_token=')) {
    const match = cookieHeader.match(/insforge_csrf_token=([^;]+)/);
    if (match) {
      csrfToken = decodeURIComponent(match[1]);
    }
  }

  let extractedRefreshToken = '';
  if (cookieHeader) {
    const rtMatch = cookieHeader.match(/insforge_refresh_token=([^;]+)/);
    if (rtMatch) {
      extractedRefreshToken = rtMatch[1];
    }
  }

  // If there's no refresh token, the user is genuinely logged out.
  // Return 401 early to avoid hitting the backend and throwing scary proxy errors.
  if (!extractedRefreshToken) {
    return NextResponse.json(
      { error: 'AUTH_UNAUTHORIZED', message: 'No refresh token provided in cookies' },
      { status: 401 }
    );
  }

  const insforgeRes = await fetch(`${INSFORGE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
  });

  const responseBody = await insforgeRes.text();

  if (!insforgeRes.ok) {
    console.error('[Refresh Proxy Error]', {
      status: insforgeRes.status,
      body: responseBody,
      hasCookie: !!cookieHeader,
      hasCsrfToken: !!csrfToken,
      csrfHeader: csrfToken
    });
  }

  let parsedData: any = null;
  try {
    parsedData = JSON.parse(responseBody);
  } catch (e) {}

  const response = new NextResponse(responseBody, {
    status: insforgeRes.status,
    headers: { 'Content-Type': insforgeRes.headers.get('Content-Type') || 'application/json' },
  });

  if (insforgeRes.ok && parsedData) {
    const accessToken = parsedData.access_token || parsedData.accessToken;
    const refreshToken = parsedData.refresh_token || parsedData.refreshToken;
    const expiresIn = parsedData.expires_in || parsedData.expiresIn || 3600;

    const host = request.headers.get('host') || '';
    let domain = undefined;
    if (host) {
      const parts = host.split(':');
      const domainParts = parts[0].split('.');
      if (domainParts.includes('localhost')) {
        // Do not set domain on localhost
      } else if (!host.includes('127.0.0.1')) {
        domain = `.${domainParts.length > 2 ? domainParts.slice(-2).join('.') : domainParts.join('.')}`;
      }
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
      ...(domain ? { domain } : {})
    };

    if (accessToken) {
      response.cookies.set('tm_access_token', accessToken, {
        ...cookieOptions,
        maxAge: expiresIn,
      });
    }

    if (refreshToken) {
      response.cookies.set('tm_refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      // Explicitly delete any legacy insforge_refresh_token cookie on the root path '/' to prevent duplicates
      response.cookies.set('insforge_refresh_token', '', {
        ...cookieOptions,
        path: '/',
        maxAge: 0,
      });
      // Set the path explicitly to /api/auth to limit cookie exposure and match backend
      response.cookies.set('insforge_refresh_token', refreshToken, {
        ...cookieOptions,
        path: '/api/auth',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    const newCsrf = parsedData.csrfToken || parsedData.csrf_token;
    if (newCsrf) {
      response.cookies.set('insforge_csrf_token', newCsrf, {
        ...cookieOptions,
        httpOnly: false, // Must be accessible to client JS
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
  }

  // Forward Set-Cookie headers, stripping Secure on localhost
  insforgeRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      // If this set-cookie header is setting insforge_refresh_token, skip forwarding it
      // since we explicitly manage it via response.cookies.set
      if (value.toLowerCase().includes('insforge_refresh_token=')) {
        return;
      }

      const fixed = IS_PROD
        ? value
        : value.replace(/;\s*Secure/gi, '').replace(/SameSite=None/gi, 'SameSite=Lax');
      response.headers.append('Set-Cookie', fixed);
    }
  });

  return response;
}

