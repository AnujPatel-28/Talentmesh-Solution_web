import { NextRequest, NextResponse } from 'next/server';

function getCookieDomain(host: string) {
  if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
    return '';
  }
  
  const parts = host.split(':')[0].split('.');
  
  // Custom logic for qzz.io dynamic domain
  if (host.includes('.qzz.io')) {
    const qzzIndex = parts.indexOf('qzz');
    if (qzzIndex > 0) {
      return `; Domain=.${parts.slice(qzzIndex - 1).join('.')}`;
    }
  }

  // Common second-level domains (e.g. .co.uk, .com.au)
  const commonSlds = ['co', 'com', 'org', 'net', 'edu', 'gov', 'mil', 'ac'];
  if (parts.length > 2 && commonSlds.includes(parts[parts.length - 2])) {
    return `; Domain=.${parts.slice(-3).join('.')}`;
  }

  // Standard case (e.g. talentmeshsolutions.com)
  if (parts.length >= 2) {
    return `; Domain=.${parts.slice(-2).join('.')}`;
  }
  
  return `; Domain=.${parts.join('.')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, role, adminAccess } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const host = request.headers.get('host') || '';
    const isSecure = process.env.NODE_ENV === 'production' || request.headers.get('x-forwarded-proto') === 'https';
    const sameSiteStr = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';
    const domainStr = getCookieDomain(host);

    const cookieOptions = `Path=/; HttpOnly; ${sameSiteStr} Max-Age=${60 * 60 * 24 * 7}${domainStr}`;

    const response = NextResponse.json({ success: true }, { status: 200 });
    
    response.headers.append('Set-Cookie', `tm_access_token=${token}; ${cookieOptions}`);
    
    if (role) {
      response.headers.append('Set-Cookie', `tm_role=${role}; ${cookieOptions}`);
    }
    
    if (adminAccess) {
      response.headers.append('Set-Cookie', `tm_admin_access=true; ${cookieOptions}`);
    }

    return response;
  } catch (err) {
    console.error('[auth/session] POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isSecure = process.env.NODE_ENV === 'production' || request.headers.get('x-forwarded-proto') === 'https';
  const sameSiteStr = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';
  const domainStr = getCookieDomain(host);
  
  const clearOptions = `Path=/; HttpOnly; ${sameSiteStr} Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainStr}`;
  
  const response = NextResponse.json({ success: true }, { status: 200 });
  
  response.headers.append('Set-Cookie', `tm_access_token=; ${clearOptions}`);
  response.headers.append('Set-Cookie', `tm_role=; ${clearOptions}`);
  response.headers.append('Set-Cookie', `tm_admin_access=; ${clearOptions}`);
  response.headers.append('Set-Cookie', `impersonating_user_id=; ${clearOptions}`);
  response.headers.append('Set-Cookie', `impersonating_user_role=; ${clearOptions}`);
  response.headers.append('Set-Cookie', `admin_user_id=; ${clearOptions}`);
  
  return response;
}
