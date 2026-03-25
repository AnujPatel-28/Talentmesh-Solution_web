import { NextRequest, NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { createAdminJob, listAdminJobs, listCompaniesForAdmin } from '@/lib/server/jobs';
import { jobFilterSchema, createJobSchema } from '@/lib/validation/jobs';
import { formatPaginatedResponse } from '@/lib/api/pagination';

export const GET = withApi(
  {
    schema: { query: jobFilterSchema },
    allowedRoles: ['admin', 'super_admin'],
  },
  async (req, { query }) => {
    const includeMeta = req.nextUrl.searchParams.get('includeMeta') === 'true';
    const { jobs, total } = await listAdminJobs(query);
    const companies = includeMeta ? await listCompaniesForAdmin() : undefined;

    return NextResponse.json({ 
      ...formatPaginatedResponse(jobs, total, query),
      companies 
    });
  }
);

export const POST = withApi(
  {
    schema: { body: createJobSchema },
    allowedRoles: ['admin', 'super_admin'],
    auditLog: true,
  },
  async (req, { body, user }) => {
    const job = await createAdminJob(body, user.id);
    return NextResponse.json({ job }, { status: 201 });
  }
);
