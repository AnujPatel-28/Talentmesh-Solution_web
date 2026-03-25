import { NextRequest, NextResponse } from 'next/server';

import { createPublicInsforgeClient, isWhitelistedAdminEmail } from '@/lib/auth/server-auth';
import { validateForgotPassword } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: true });
  }

  const validation = validateForgotPassword(payload);
  if (!validation.success || !validation.data?.email) {
    return NextResponse.json({ success: true });
  }

  const email = validation.data.email.trim().toLowerCase();
  if (!isWhitelistedAdminEmail(email)) {
    return NextResponse.json({ success: true });
  }

  try {
    const insforge = createPublicInsforgeClient();
    const { error } = await insforge.auth.sendResetPasswordEmail({ email });

    if (error) {
      console.error('[Admin ForgotPW] sendResetPasswordEmail error:', error.message);
    }
  } catch (err) {
    console.error('[Admin ForgotPW] Unexpected error:', err);
  }

  return NextResponse.json({ success: true });
}
