import { NextRequest, NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { insforgeAdmin } from '@/lib/insforge-admin';

export const POST = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
    auditLog: true,
  },
  async (req) => {
    const { ids, action } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let updateData: any = {};
    if (action === 'approve') {
      updateData = { is_approved: true, status: 'active' };
    } else if (action === 'reject') {
      updateData = { is_approved: false, status: 'closed' };
    } else if (action === 'delete') {
      updateData = { status: 'deleted' };
    }

    const { error } = await insforgeAdmin!
      .database
      .from('jobs')
      .update(updateData)
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ message: `Successfully ${action}d ${ids.length} jobs` });
  }
);
