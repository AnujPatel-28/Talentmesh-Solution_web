import { NextResponse } from 'next/server';

import { getPublicJobById } from '@/lib/server/jobs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const job = await getPublicJobById(id);
    return NextResponse.json({ job });
  } catch (err: any) {
    const status = err.message === 'Job not found' ? 404 : 500;
    return NextResponse.json({ error: err.message || 'Failed to load job' }, { status });
  }
}
