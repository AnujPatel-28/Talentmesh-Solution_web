import { NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { createClient } from '@insforge/sdk';
import * as OTPAuth from 'otpauth';
import { cookies } from 'next/headers';

/**
 * POST /api/mfa/verify
 * Verifies a TOTP code against the user's stored MFA factor.
 * On success: marks factor as verified, sets mfa_enabled on profile,
 * and sets an mfa_verified cookie for the current session.
 *
 * Body: { code: string, factorId?: string }
 *   - factorId is optional; if omitted, uses the user's first verified factor
 *     (for login-time verification) or first unverified factor (for enrollment).
 */
export async function POST(request: Request) {
  try {
    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const { code, factorId } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Get current user
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('tm_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userClient = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    });

    const { data: sessionData, error: sessionError } = await userClient.auth.getCurrentSession();
    if (sessionError || !sessionData?.session?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionData.session.user;

    // Check lockout
    const { data: profile } = await insforgeAdmin.database
      .from('profiles')
      .select('mfa_locked_until')
      .eq('id', user.id)
      .single();

    if (profile?.mfa_locked_until) {
      const lockedUntil = new Date(profile.mfa_locked_until);
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { error: `Account locked. Try again in ${minutesLeft} minute(s).` },
          { status: 429 }
        );
      }
    }

    // Find the factor
    let query = insforgeAdmin.database
      .from('mfa_factors')
      .select('*')
      .eq('user_id', user.id);

    if (factorId) {
      query = query.eq('id', factorId);
    }

    const { data: factors, error: factorError } = await query;

    if (factorError || !factors || factors.length === 0) {
      return NextResponse.json({ error: 'No MFA factor found' }, { status: 404 });
    }

    // Prefer verified factor (login flow), then unverified (enrollment flow)
    const factor = factors.find((f: any) => f.status === 'verified')
      || factors.find((f: any) => f.status === 'unverified')
      || factors[0];

    // Validate TOTP
    const totp = new OTPAuth.TOTP({
      issuer: 'TalentMesh',
      label: user.email ?? 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(factor.secret),
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      return NextResponse.json({ error: 'Invalid code', valid: false }, { status: 400 });
    }

    // Code is valid — mark factor as verified
    if (factor.status === 'unverified') {
      await insforgeAdmin.database
        .from('mfa_factors')
        .update({ status: 'verified' })
        .eq('id', factor.id);
    }

    // Set mfa_enabled on profile
    await insforgeAdmin.database
      .from('profiles')
      .update({ mfa_enabled: true, mfa_locked_until: null })
      .eq('id', user.id);

    // Set mfa_verified cookie (1 hour, matches session cookie lifetime)
    const response = NextResponse.json({ valid: true });
    response.cookies.set('mfa_verified', 'true', {
      path: '/',
      maxAge: 3600,
      sameSite: 'lax',
      httpOnly: true,
    });

    return response;
  } catch (err: any) {
    console.error('MFA verify error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
