import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { getAllRecruiters } from '@/lib/api/admin';

export const GET = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
  },
  async (req) => {
    const { searchParams } = req.nextUrl;
    const filters = {
      page: parseInt(searchParams.get('page') || '0'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || 'all',
    };
    
    const recruiters = await getAllRecruiters(filters);
    return NextResponse.json({ recruiters });
  }
);
