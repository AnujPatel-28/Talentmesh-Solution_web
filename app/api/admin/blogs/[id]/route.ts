import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession } from '@/lib/auth/server-auth';
import { getAdminBlog, setAdminBlogState, updateAdminBlog } from '@/lib/server/blogs';
import { validateUpdateBlog } from '@/lib/validation/blogs';

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
    const blog = await getAdminBlog(id);
    return NextResponse.json({ blog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load blog' }, { status: 500 });
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
      const allowedActions = ['publish', 'unpublish', 'delete'] as const;
      if (!allowedActions.includes(payload.action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      const blog = await setAdminBlogState(id, payload.action);
      return NextResponse.json({ blog });
    }

    const validation = validateUpdateBlog(payload);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: 'Invalid blog payload', errors: validation.errors }, { status: 400 });
    }

    const blog = await updateAdminBlog(id, validation.data);
    return NextResponse.json({ blog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const blog = await setAdminBlogState(id, 'delete');
    return NextResponse.json({ blog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete blog' }, { status: 500 });
  }
}
