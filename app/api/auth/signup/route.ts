import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, name } = body;

    if (!email || !password || !role || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: ANON_KEY,
      isServerMode: true,
    });

    const { data, error } = await client.functions.invoke('auth-signup', {
      body: { email, password, role, name },
    });

    if (error) {
      console.error('[signup API proxy] Edge function error:', error.message);
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 });
    }

    const response = NextResponse.json(data, { status: 200 });

    const accessToken = data?.accessToken || data?.access_token;
    const refreshToken = data?.refreshToken || data?.refresh_token;
    const expiresIn = data?.expiresIn || data?.expires_in || 3600;

    if (accessToken) {
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
        ...(domain ? { domain } : {}),
      };

      response.cookies.set('tm_access_token', accessToken, {
        ...cookieOptions,
        maxAge: expiresIn,
      });

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

    return response;
  } catch (err: any) {
    console.error('[signup API proxy] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
