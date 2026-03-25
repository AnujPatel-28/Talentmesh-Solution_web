import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';

import { getAuthenticatedSession, getSessionCookieOptions } from '@/lib/auth/server-auth';
import { insforgeAdmin } from '@/lib/insforge-admin';

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

    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await insforgeAdmin.database
      .from('profiles')
      .select('mfa_locked_until')
      .eq('id', session.user.id)
      .single();

    if (profile?.mfa_locked_until) {
      const lockedUntil = new Date(profile.mfa_locked_until);
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { error: `Account locked. Try again in ${minutesLeft} minute(s).` },
          { status: 429 },
        );
      }
    }

    let query = insforgeAdmin.database
      .from('mfa_factors')
      .select('*')
      .eq('user_id', session.user.id);

    if (factorId) {
      query = query.eq('id', factorId);
    }

    const { data: factors, error: factorError } = await query;

    if (factorError || !factors || factors.length === 0) {
      return NextResponse.json({ error: 'No MFA factor found' }, { status: 404 });
    }

    const factor = factors.find((entry: any) => entry.status === 'verified')
      || factors.find((entry: any) => entry.status === 'unverified')
      || factors[0];

    const totp = new OTPAuth.TOTP({
      issuer: 'TalentMesh',
      label: session.user.email ?? 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(factor.secret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return NextResponse.json({ error: 'Invalid code', valid: false }, { status: 400 });
    }

    if (factor.status === 'unverified') {
      await insforgeAdmin.database
        .from('mfa_factors')
        .update({ status: 'verified' })
        .eq('id', factor.id);
    }

    await insforgeAdmin.database
      .from('profiles')
      .update({ mfa_enabled: true, mfa_locked_until: null })
      .eq('id', session.user.id);

    const response = NextResponse.json({ valid: true });
    response.cookies.set('mfa_verified', 'true', {
      ...getSessionCookieOptions(),
    });

    return response;
  } catch (err: any) {
    console.error('MFA verify error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
