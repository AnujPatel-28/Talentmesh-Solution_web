import { NextRequest, NextResponse } from 'next/server';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Proxy for POST /api/auth/logout.
 * Forwards the auth token to InsForge and clears auth cookies from the browser.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const cookieHeader = request.headers.get('cookie') || '';

  try {
    await fetch(`${INSFORGE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        ...(authHeader ? { 'Authorization': authHeader } : { 'Authorization': `Bearer ${ANON_KEY}` }),
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      },
    });
  } catch {
    // Best-effort — always clear cookies even if InsForge is unreachable
  }

  let cookieOptions = `path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  const host = request.headers.get('host') || '';
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const parts = host.split(':');
    const domainParts = parts[0].split('.');
    const baseDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domainParts.join('.');
    cookieOptions += `; Domain=.${baseDomain}`;
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.headers.append('Set-Cookie', `tm_access_token=; ${cookieOptions}`);
  response.headers.append('Set-Cookie', `tm_role=; ${cookieOptions}`);
  response.headers.append('Set-Cookie', `tm_admin_access=; ${cookieOptions}`);
  response.headers.append('Set-Cookie', `insforge_refresh_token=; ${cookieOptions}`);
  response.headers.append('Set-Cookie', `insforge_csrf_token=; ${cookieOptions}`);

  return response;
}
