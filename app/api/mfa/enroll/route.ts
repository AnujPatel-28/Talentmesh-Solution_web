import { NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { createClient } from '@insforge/sdk';
import * as OTPAuth from 'otpauth';
import { cookies } from 'next/headers';

/**
 * POST /api/mfa/enroll
 * Generates a new TOTP secret and stores it as an unverified factor.
 * Returns the TOTP URI (for QR code rendering) and the raw secret.
 */
export async function POST(request: Request) {
  try {
    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get current user from the access token cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('tm_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create a client with the user's token to get their identity
    const userClient = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    });

    // Verify the session
    const { data: sessionData, error: sessionError } = await userClient.auth.getCurrentSession();
    if (sessionError || !sessionData?.session?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionData.session.user;

    // Delete any existing unverified factors for this user
    await insforgeAdmin.database
      .from('mfa_factors')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'unverified');

    // Generate TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: 'TalentMesh',
      label: user.email ?? 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();

    // Store the factor
    const { data: factor, error: insertError } = await insforgeAdmin.database
      .from('mfa_factors')
      .insert({
        user_id: user.id,
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
