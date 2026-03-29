import { NextRequest, NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { listAdminBlogs, createAdminBlog } from '@/lib/server/blogs';

export const GET = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
  },
  async (req) => {
    const { searchParams } = req.nextUrl;
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || 'all',
      page: parseInt(searchParams.get('page') || '0'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    const blogs = await listAdminBlogs(filters);
    return NextResponse.json({ blogs });
  }
);

export const POST = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
    auditLog: true,
  },
  async (req, { user }) => {
    const body = await req.json();
    const blog = await createAdminBlog(body, user.id);
    return NextResponse.json({ blog }, { status: 201 });
  }
);
