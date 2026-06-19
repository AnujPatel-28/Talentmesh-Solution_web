import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 });
    }

    const client = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: ANON_KEY,
      isServerMode: true,
    });

    const { data, error } = await client.functions.invoke('auth-verify', {
      body: { email, otp },
    });

    if (error) {
      console.error('[verify API proxy] Edge function error:', error.message);
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 });
    }

    // Edge function returns: { data: { accessToken, user, ... } }
    // If the data payload itself contains the error, return it
    if (data?.error) {
      return NextResponse.json({ error: data.error.message || data.error }, { status: 400 });
    }

    const verifyData = data?.data || data;
    const accessToken = verifyData?.accessToken || verifyData?.access_token;
    const refreshToken = verifyData?.refreshToken || verifyData?.refresh_token;
    const user = verifyData?.user;

    const response = NextResponse.json({ data: verifyData }, { status: 200 });

    if (accessToken) {
      const host = request.headers.get('host') || '';
      let domain = undefined;
      if (host) {
        const parts = host.split(':');
        const domainParts = parts[0].split('.');
        if (domainParts.includes('localhost')) {
          domain = '.localhost';
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
        maxAge: 3600, // 1 hour default
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
    console.error('[verify API proxy] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
