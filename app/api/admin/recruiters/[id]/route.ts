import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { z } from 'zod';

const patchSchema = z.object({
  action: z.enum(['approve', 'suspend']),
});

export const PATCH = withApi(
  {
    schema: { body: patchSchema },
    allowedRoles: ['admin', 'super_admin'],
    auditLog: true,
  },
  async (req, { body, params, user: adminUser }) => {
    const { id: recruiterId } = params;
    const { action } = body;

    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
    }

    try {
      if (action === 'approve') {
        const { error: approveError } = await insforgeAdmin.database
          .from('recruiter_profiles')
          .update({
            is_approved: true,
            approved_by: adminUser.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', recruiterId);

        if (approveError) throw approveError;

        await insforgeAdmin.database.from('notifications').insert([{
          user_id: recruiterId,
          type: 'account_approved',
          title: 'Account Approved',
          message: 'Your recruiter account has been approved. You can now access all dashboard features.'
        }]);

        return NextResponse.json({ success: true });
      } else if (action === 'suspend') {
        const { error: suspendError } = await insforgeAdmin.database
          .from('profiles')
          .update({ is_active: false })
          .eq('id', recruiterId);

        if (suspendError) throw suspendError;

        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err: any) {
      console.error('Admin action error:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
);
