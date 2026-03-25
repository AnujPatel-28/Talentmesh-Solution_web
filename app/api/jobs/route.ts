import { NextRequest, NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { listPublicJobs } from '@/lib/server/jobs';
import { jobFilterSchema } from '@/lib/validation/jobs';
import { formatPaginatedResponse } from '@/lib/api/pagination';

export const GET = withApi(
  {
    schema: { query: jobFilterSchema },
    requireAuth: false,
  },
  async (req, { query }) => {
    const { jobs, total } = await listPublicJobs(query);
    return NextResponse.json(formatPaginatedResponse(jobs, total, query));
  }
);
