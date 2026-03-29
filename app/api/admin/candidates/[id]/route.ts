import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { insforgeAdmin } from '@/lib/insforge-admin';

export const PATCH = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
    auditLog: true,
  },
  async (req, { params }) => {
    const { id } = await params;
    const { is_active, status } = await req.json();
    
    const updatePayload: any = {};
    if (is_active !== undefined) updatePayload.is_active = is_active;
    if (status !== undefined) updatePayload.status = status;

    const { error } = await insforgeAdmin!
      .database
      .from('profiles')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
    
    let message = 'Candidate updated';
    if (status) message = `Candidate ${status}`;
    else if (is_active !== undefined) message = `Candidate ${is_active ? 'reactivated' : 'suspended'}`;

    return NextResponse.json({ message });
  }
);
