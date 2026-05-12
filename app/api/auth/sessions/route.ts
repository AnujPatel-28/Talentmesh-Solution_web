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

  const response = new NextResponse(responseBody, {
    status: insforgeRes.status,
    headers: { 'Content-Type': insforgeRes.headers.get('Content-Type') || 'application/json' },
  });

  // Forward Set-Cookie headers, stripping Secure on localhost so the browser stores them
  insforgeRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const fixed = IS_PROD
        ? value
        : value.replace(/;\s*Secure/gi, '').replace(/SameSite=None/gi, 'SameSite=Lax');
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

