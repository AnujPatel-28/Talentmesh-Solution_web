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
  const url = new URL(request.url);
  const rawPath = url.pathname.replace(/^\/api\/v1\/remote/, '');
  const targetUrl = `${INSFORGE_URL}${rawPath}${url.search}`;

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

  const isStorageGet = request.method === 'GET' && url.pathname.includes('storage/buckets/');

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      redirect: isStorageGet ? 'follow' : 'manual',
      // only pass body if not GET/HEAD
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body as any,
      // allow binary bodies / duplex streams
      // @ts-ignore
      duplex: 'half',
      cache: 'no-store'
    };

    const response = await fetch(targetUrl, fetchOptions);

    let responseBody: any = response.body;
    const responseHeaders = new Headers(response.headers);
    const contentType = responseHeaders.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const text = await response.text();
        responseBody = text; // Default fallback to text if parsing/mapping is not modified
        
        if (!text) throw new Error('skip'); // empty body, nothing to parse
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          let modified = false;
          if (parsed.access_token && !parsed.accessToken) {
            parsed.accessToken = parsed.access_token;
            modified = true;
          }
          if (parsed.refresh_token && !parsed.refreshToken) {
            parsed.refreshToken = parsed.refresh_token;
            modified = true;
          }
          if (parsed.expires_in && !parsed.expiresIn) {
            parsed.expiresIn = parsed.expires_in;
            modified = true;
          }
          
          if (modified) {
            responseBody = JSON.stringify(parsed);
            responseHeaders.set('content-length', new TextEncoder().encode(responseBody).length.toString());
          }
        }
      } catch (err: any) {
        if (err?.message !== 'skip') {
          console.error('[proxy] Error parsing JSON body in proxy route:', err);
        }
      }
    }

    // If the request was a storage GET request for a PDF file, rewrite Content-Disposition to inline
    const isPdfFile = url.pathname.toLowerCase().endsWith('.pdf') || 
                      decodeURIComponent(url.pathname).toLowerCase().endsWith('.pdf') ||
                      responseHeaders.get('content-type')?.includes('application/pdf');

    if (isStorageGet && isPdfFile) {
      // Force correct PDF content type if missing or octet-stream
      const currentType = responseHeaders.get('content-type');
      if (!currentType || currentType === 'application/octet-stream') {
        responseHeaders.set('content-type', 'application/pdf');
      }

      const contentDisposition = responseHeaders.get('content-disposition');
      if (contentDisposition) {
        responseHeaders.set('content-disposition', contentDisposition.replace('attachment', 'inline'));
      } else {
        responseHeaders.set('content-disposition', 'inline');
      }
    }

    const newResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

    // Fix cookies so the browser doesn't drop them on localhost / custom domain
    fixCookies(request, response, newResponse);

    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(JSON.stringify({ error: 'Proxy error' }), {
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
      if (fixed.toLowerCase().includes('domain=')) {
        fixed = fixed.replace(/Domain=[^;]+(;|$)/i, 'Domain=localhost;');
      } else {
        fixed = `${fixed}; Domain=localhost`;
      }
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
