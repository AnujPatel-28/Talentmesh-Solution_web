import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { getAuditLogs } from '@/lib/api/admin';

export const GET = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
  },
  async (req) => {
    const { searchParams } = req.nextUrl;
    const filters = {
      page: parseInt(searchParams.get('page') || '0'),
      search: searchParams.get('search') || undefined,
    };
    
    const logs = await getAuditLogs(filters);
    return NextResponse.json({ logs });
  }
);
