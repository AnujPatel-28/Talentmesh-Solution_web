import { NextRequest, NextResponse } from 'next/server';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Proxy for POST /api/auth/sessions (login).
 * Strips the `Secure` flag from InsForge's Set-Cookie response on HTTP localhost
 * so the `insforge_refresh_token` httpOnly cookie is actually stored by the browser.
 * On production (HTTPS) the cookie is forwarded unchanged.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  const insforgeRes = await fetch(`${INSFORGE_URL.replace(/\/$/, '')}/api/auth/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-client-info': 'talentmesh-web',
    },
    body,
  });

  if (!insforgeRes.ok) {
    const errorText = await insforgeRes.text();
    console.error(`[sessions] InsForge error ${insforgeRes.status}:`, errorText);
    return new NextResponse(errorText, {
      status: insforgeRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const responseBody = await insforgeRes.text();
  let parsedData: any = null;
  try {
    parsedData = JSON.parse(responseBody);
  } catch (e) {
    console.error('[sessions] Failed to parse JSON:', e);
  }

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
      response.cookies.set('insforge_refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  }

  // Forward Set-Cookie headers, stripping Secure on localhost so the browser stores them
  insforgeRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      let fixed = value;
      // Inject root domain for multi-tenant cookie sharing
      const host = request.headers.get('host') || '';
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        if (!fixed.toLowerCase().includes('domain=')) {
          const parts = host.split(':'); // remove port if present
          const domainParts = parts[0].split('.');
          const baseDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domainParts.join('.');
          fixed = `${fixed}; Domain=.${baseDomain}`;
        }
      } else {
        // Localhost: strip Domain if present so browser accepts it
        fixed = fixed.replace(/Domain=[^;]+(;|$)/i, '').replace(/;\s*$/, '');
      }

      if (process.env.NODE_ENV === 'development') {
        fixed = fixed.replace(/SameSite=None/gi, 'SameSite=Lax');
        fixed = fixed.replace(/Secure/gi, '');
      }
      
      response.headers.append('Set-Cookie', fixed);
    }
  });

  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('tm_access_token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const { data, error } = await fetch(`${INSFORGE_URL.replace(/\/$/, '')}/api/auth/sessions`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'x-client-info': 'talentmesh-web',
      },
    }).then(res => res.json());

    if (error || !data?.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (err) {
    console.error('[sessions] GET Error:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

