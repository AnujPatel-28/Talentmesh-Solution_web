import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession } from '@/lib/auth/server-auth';
import { createAdminBlog, listAdminBlogs } from '@/lib/server/blogs';
import { validateBlogFilter, validateCreateBlog } from '@/lib/validation/blogs';

async function requireAdmin() {
  const session = await getAuthenticatedSession();
  if (!session?.isAdmin) {
    return null;
  }

  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validation = validateBlogFilter(params);

    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: 'Invalid filters', errors: validation.errors }, { status: 400 });
    }

    const blogs = await listAdminBlogs(validation.data);
    return NextResponse.json({ blogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load blogs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const payload = await request.json();
    const validation = validateCreateBlog(payload);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: 'Invalid blog payload', errors: validation.errors }, { status: 400 });
    }

    const blog = await createAdminBlog(validation.data, session.user.id);
    return NextResponse.json({ blog }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create blog' }, { status: 500 });
  }
}
