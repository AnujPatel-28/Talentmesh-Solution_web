import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession } from '@/lib/auth/server-auth';
import { getAdminJob, setAdminJobState, updateAdminJob } from '@/lib/server/jobs';
import { validateUpdateJob } from '@/lib/validation/jobs';

async function requireAdmin() {
  const session = await getAuthenticatedSession();
  if (!session?.isAdmin) {
    return null;
  }

  return session;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const job = await getAdminJob(id);
    return NextResponse.json({ job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load job' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const payload = await request.json();

    if (payload?.action) {
      const allowedActions = ['publish', 'unpublish', 'close', 'delete'] as const;
      if (!allowedActions.includes(payload.action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      const job = await setAdminJobState(id, payload.action);
      return NextResponse.json({ job });
    }

    const validation = validateUpdateJob(payload);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: 'Invalid job payload', errors: validation.errors }, { status: 400 });
    }

    const job = await updateAdminJob(id, validation.data);
    return NextResponse.json({ job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const job = await setAdminJobState(id, 'delete');
    return NextResponse.json({ job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete job' }, { status: 500 });
  }
}
