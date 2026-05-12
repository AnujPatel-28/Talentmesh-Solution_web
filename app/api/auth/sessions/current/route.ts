import { NextRequest, NextResponse } from 'next/server';
import { createServerSessionClient } from '@/lib/auth/server-auth';

/**
 * GET /api/auth/sessions/current
 * Helper endpoint for the SDK to retrieve the current session.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('tm_access_token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const insforge = createServerSessionClient(token);
    const { data, error } = await insforge.auth.getCurrentUser();

    if (error || !data?.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (err) {
    console.error('[sessions/current] Error fetching session:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
