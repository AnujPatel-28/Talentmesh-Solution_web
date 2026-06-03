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
  const csrfToken = request.headers.get('x-csrf-token') || '';
  const cookieHeader = request.headers.get('cookie') || '';

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

  const response = new NextResponse(responseBody, {
    status: insforgeRes.status,
    headers: { 'Content-Type': insforgeRes.headers.get('Content-Type') || 'application/json' },
  });

  // Forward Set-Cookie headers, stripping Secure on localhost
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

