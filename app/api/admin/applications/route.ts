import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { updateApplicationStatus } from '@/lib/api/admin';

export const PATCH = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
    auditLog: true,
  },
  async (req, { params }) => {
    const { id } = await params;
    const { status, notes } = await req.json();
    
    await updateApplicationStatus(id, status, notes);
    return NextResponse.json({ message: `Application status updated to ${status}` });
  }
);
