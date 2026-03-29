import { NextRequest, NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { getAdminBlog, updateAdminBlog, setAdminBlogState } from '@/lib/server/blogs';

export const GET = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
  },
  async (req, { params }) => {
    const { id } = await params;
    const blog = await getAdminBlog(id);
    return NextResponse.json({ blog });
  }
);

export const PATCH = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
    auditLog: true,
  },
  async (req, { params }) => {
    const { id } = await params;
    const body = await req.json();
    
    if (body.action) {
      const blog = await setAdminBlogState(id, body.action);
      return NextResponse.json({ blog });
    }
    
    const blog = await updateAdminBlog(id, body);
    return NextResponse.json({ blog });
  }
);
