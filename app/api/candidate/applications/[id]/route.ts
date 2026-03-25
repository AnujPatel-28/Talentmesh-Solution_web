import { NextRequest, NextResponse } from 'next/server';

import { withdrawCandidateApplication } from '@/lib/server/applications';
import { validateWithdrawApplication } from '@/lib/validation/applications';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const validation = validateWithdrawApplication(payload);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request', errors: validation.errors }, { status: 400 });
    }

    const application = await withdrawCandidateApplication(id);
    return NextResponse.json({ application });
  } catch (err: any) {
    const message = err.message || 'Failed to update application';
    const status = message.includes('logged in') ? 401
      : message.includes('Only candidates') ? 403
      : message.includes('not found') ? 404
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
