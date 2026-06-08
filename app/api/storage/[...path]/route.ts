import { NextRequest, NextResponse } from 'next/server';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}
export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}
export async function PUT(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}
export async function PATCH(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}
export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}
export async function OPTIONS(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}
export async function HEAD(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}

async function handleProxy(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await Promise.resolve(props.params);
  const path = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';

  // The SDK calls /api/storage/buckets/... directly
  // We forward it to the INSFORGE_URL /api/storage/buckets/...
  const targetUrl = `${INSFORGE_URL}/api/storage/${path}${queryString}`;

  // Forward all headers except host
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-insforge-url', INSFORGE_URL);
  headers.set('x-insforge-anon-key', ANON_KEY);
  if (process.env.INSFORGE_SERVICE_KEY) {
    headers.set('x-insforge-service-key', process.env.INSFORGE_SERVICE_KEY);
  }

  // Upgrade Anon Key to User Token if cookie is present
  const authHeader = headers.get('authorization');
  let token = ANON_KEY;

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/tm_access_token=([^;]+)/);
    if (match) {
      let decoded = decodeURIComponent(match[1]);
      token = decoded.startsWith('Bearer ') ? decoded.substring(7) : decoded;
    }
  }

  // If the frontend didn't send an auth header, or it sent the Anon Key, use the token (which is user token if exists, else Anon Key)
  if (!authHeader || authHeader.replace('Bearer ', '') === ANON_KEY) {
    headers.set('authorization', `Bearer ${token}`);
  }

async function refreshServerToken(request: NextRequest): Promise<{ accessToken: string; csrfToken?: string; setCookieHeaders: string[] } | null> {
  try {
    const csrfToken = request.cookies.get('insforge_csrf_token')?.value || '';
    const cookieHeader = request.headers.get('cookie') || '';

    const res = await fetch(`${INSFORGE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newToken = data?.accessToken || null;
    if (!newToken) return null;

    const setCookieHeaders: string[] = [];
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      }
    });

    return {
      accessToken: newToken,
      csrfToken: data?.csrfToken,
      setCookieHeaders
    };
  } catch (err) {
    console.error('[refreshServerToken] Error:', err);
    return null;
  }
}

  try {
    let requestBody: any = undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      requestBody = await request.arrayBuffer();
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
      body: requestBody,
      cache: 'no-store'
    };

    let response = await fetch(targetUrl, fetchOptions);

    if (response.status === 401) {
      console.log('[Storage Proxy] Received 401, attempting server-side token refresh...');
      const refreshResult = await refreshServerToken(request);
      if (refreshResult) {
        console.log('[Storage Proxy] Server-side refresh succeeded, retrying storage request...');
        const newHeaders = new Headers(headers);
        newHeaders.set('authorization', `Bearer ${refreshResult.accessToken}`);
        
        const retryOptions = {
          ...fetchOptions,
          headers: newHeaders
        };
        
        response = await fetch(targetUrl, retryOptions);
        
        const responseHeaders = new Headers(response.headers);
        const newResponse = new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });

        // Set the new access token cookie in the client browser
        const isSecure = process.env.NODE_ENV === 'production';
        const sameSiteStr = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';
        newResponse.headers.append('Set-Cookie', `tm_access_token=${refreshResult.accessToken}; path=/; ${sameSiteStr} max-age=${60 * 60 * 24 * 7}`);
        
        // Forward set-cookie headers from the refresh response
        refreshResult.setCookieHeaders.forEach((value) => {
          let fixed = value;
          if (!isSecure) {
            fixed = fixed.replace(/SameSite=None/gi, 'SameSite=Lax').replace(/Secure/gi, '');
          }
          newResponse.headers.append('Set-Cookie', fixed);
        });

        fixCookies(request, response, newResponse);
        return newResponse;
      }
    }

    const responseHeaders = new Headers(response.headers);
    let responseBody: any = response.body;

    const newResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

    // Fix cookies so the browser doesn't drop them on localhost / custom domain
    fixCookies(request, response, newResponse);

    return newResponse;
  } catch (error) {
    console.error('Storage proxy error:', error);
    return new NextResponse(JSON.stringify({ error: 'Storage proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function fixCookies(request: NextRequest, sourceResponse: Response, targetResponse: NextResponse) {
  const host = request.headers.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  // Remove the merged Set-Cookie header that might have been copied
  targetResponse.headers.delete('set-cookie');

  // getSetCookie() returns an array of individual Set-Cookie strings
  const setCookies = typeof sourceResponse.headers.getSetCookie === 'function'
    ? sourceResponse.headers.getSetCookie()
    : [];

  setCookies.forEach((value) => {
    let fixed = value;

    // Override Domain
    if (isLocal) {
      fixed = fixed.replace(/Domain=[^;]+(;|$)/i, '').replace(/;\s*$/, '');
    } else {
      const parts = host.split(':');
      const domainParts = parts[0].split('.');
      const baseDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domainParts.join('.');

      if (fixed.toLowerCase().includes('domain=')) {
        fixed = fixed.replace(/Domain=[^;]+(;|$)/i, `Domain=.${baseDomain};`);
      } else {
        fixed = `${fixed}; Domain=.${baseDomain}`;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      fixed = fixed.replace(/SameSite=None/gi, 'SameSite=Lax');
      fixed = fixed.replace(/Secure/gi, '');
    }

    targetResponse.headers.append('Set-Cookie', fixed);
  });
}
