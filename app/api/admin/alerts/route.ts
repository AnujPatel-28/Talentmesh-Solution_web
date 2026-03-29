import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { getAdminAlerts } from '@/lib/server/admin';

export const GET = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
  },
  async () => {
    const alerts = await getAdminAlerts();
    return NextResponse.json(alerts);
  }
);
