import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['applied', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn']),
});

export const PATCH = withApi(
  {
    schema: { body: patchSchema },
    allowedRoles: ['admin', 'super_admin'],
    requireAuth: true,
    auditLog: true,
  },
  async (req, { body, params, user: adminUser }) => {
    const { id } = params;
    const { status } = body;

    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
    }

    try {
      const { data, error } = await insforgeAdmin.database
        .from('applications')
        .update({ 
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ application: data });
    } catch (err: any) {
      console.error('Admin Update Application Error:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
);
