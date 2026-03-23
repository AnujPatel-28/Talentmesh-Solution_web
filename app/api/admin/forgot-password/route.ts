import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

/**
 * POST /api/admin/forgot-password
 *
 * Validates the email against the server-side ADMIN_EMAILS whitelist,
 * then sends a password-reset email via InsForge.
 *
 * Always returns 200 (generic message) so attackers cannot enumerate
 * which emails are registered as admins.
 */
export async function POST(request: NextRequest) {
  let email = '';
  try {
    const body = await request.json();
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ success: true }); // Malformed request — return generic success
  }

  if (!email) {
    return NextResponse.json({ success: true });
  }

  // --- Server-only whitelist check (ADMIN_EMAILS is NOT prefixed with NEXT_PUBLIC_) ---
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = adminEmails.includes(email);

  // If not an admin email, silently do nothing (security: no info leakage)
  if (!isAdmin) {
    return NextResponse.json({ success: true });
  }

  // --- Send password reset email via InsForge SDK ---
  try {
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    });

    // Note: InsForge SDK sendResetPasswordEmail only accepts { email }.
    // The redirect URL after reset must be configured in your InsForge
    // backend settings (Auth → Email Templates → Reset Password redirectTo).
    const { error } = await insforge.auth.sendResetPasswordEmail({ email });

    if (error) {
      console.error('[Admin ForgotPW] sendResetPasswordEmail error:', error.message);
      // Still return generic success — don't leak server errors to the client
    }
  } catch (err) {
    console.error('[Admin ForgotPW] Unexpected error:', err);
  }

  return NextResponse.json({ success: true });
}
