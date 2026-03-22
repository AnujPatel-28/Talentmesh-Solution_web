import { NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { createClient } from '@insforge/sdk';
import { cookies } from 'next/headers';

/**
 * GET /api/mfa/status
 * Returns the MFA status for the current user:
 *   - mfaEnabled: whether the user has a verified TOTP factor
 *   - mfaVerifiedThisSession: whether the mfa_verified cookie is set
 */
export async function GET() {
  try {
    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

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

    const { data: profile } = await insforgeAdmin.database
      .from('profiles')
      .select('mfa_enabled')
      .eq('id', user.id)
      .single();

    const mfaVerifiedCookie = cookieStore.get('mfa_verified')?.value === 'true';

    return NextResponse.json({
      mfaEnabled: profile?.mfa_enabled ?? false,
      mfaVerifiedThisSession: mfaVerifiedCookie,
    });
  } catch (err: any) {
    console.error('MFA status error:', err);
    return NextResponse.json({ error: err.message || 'Failed to get MFA status' }, { status: 500 });
  }
}
