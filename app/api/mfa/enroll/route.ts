import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';

import { getAuthenticatedSession } from '@/lib/auth/server-auth';
import { insforgeAdmin } from '@/lib/insforge-admin';

export async function POST() {
  try {
    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await insforgeAdmin.database
      .from('mfa_factors')
      .delete()
      .eq('user_id', session.user.id)
      .eq('status', 'unverified');

    const totp = new OTPAuth.TOTP({
      issuer: 'TalentMesh',
      label: session.user.email ?? 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();

    const { data: factor, error: insertError } = await insforgeAdmin.database
      .from('mfa_factors')
      .insert({
        user_id: session.user.id,
        secret,
        friendly_name: 'TalentMesh Admin',
        status: 'unverified',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('MFA enroll insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save MFA factor' }, { status: 500 });
    }

    return NextResponse.json({
      id: factor.id,
      secret,
      uri,
    });
  } catch (err: any) {
    console.error('MFA enroll error:', err);
    return NextResponse.json({ error: err.message || 'Enrollment failed' }, { status: 500 });
  }
}
