import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getAuthenticatedSession } from '@/lib/auth/server-auth';
import { insforgeAdmin } from '@/lib/insforge-admin';

export async function GET() {
  try {
    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const { data: profile } = await insforgeAdmin.database
      .from('profiles')
      .select('mfa_enabled')
      .eq('id', session.user.id)
      .single();

    return NextResponse.json({
      mfaEnabled: profile?.mfa_enabled ?? false,
      mfaVerifiedThisSession: cookieStore.get('mfa_verified')?.value === 'true',
    });
  } catch (err: any) {
    console.error('MFA status error:', err);
    return NextResponse.json({ error: err.message || 'Failed to get MFA status' }, { status: 500 });
  }
}
