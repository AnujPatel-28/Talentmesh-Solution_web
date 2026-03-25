import { NextResponse } from 'next/server';

import { getPublicBlogBySlug } from '@/lib/server/blogs';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const blog = await getPublicBlogBySlug(slug);
    return NextResponse.json({ blog });
  } catch (err: any) {
    const status = err.message === 'Blog not found' ? 404 : 500;
    return NextResponse.json({ error: err.message || 'Failed to load blog' }, { status });
  }
}
