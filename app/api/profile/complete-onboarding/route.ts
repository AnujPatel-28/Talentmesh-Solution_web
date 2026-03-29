import { NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    });

    // Try to get userId from JSON body, fallback to cookie-based auth
    let userId: string | null = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        userId = body.userId || null;
      } catch {
        // Body may be empty, that's fine
      }
    }

    // If no userId in body, get it from the current session
    if (!userId) {
      const { data, error } = await insforge.auth.refreshSession();
      if (error || !data?.user) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        );
      }
      userId = data.user.id;
    }

    // Mark onboarding as completed
    const { error: updateError } = await insforge.database
      .from('profiles')
      .update({ completed_onboarding: true, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to mark onboarding complete:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('complete-onboarding error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}