import { NextRequest, NextResponse } from 'next/server';

import { listPublicBlogs } from '@/lib/server/blogs';
import { validateBlogFilter } from '@/lib/validation/blogs';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validation = validateBlogFilter(params);

    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: 'Invalid filters', errors: validation.errors }, { status: 400 });
    }

    const blogs = await listPublicBlogs(validation.data);
    return NextResponse.json({ blogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load blogs' }, { status: 500 });
  }
}
