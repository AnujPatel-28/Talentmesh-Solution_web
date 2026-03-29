import { NextRequest, NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { getPlatformSettings, updatePlatformSettings, listAdmins } from '@/lib/server/admin';
import { insforgeAdmin } from '@/lib/insforge-admin';

export const GET = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
  },
  async (req) => {
    const section = req.nextUrl.searchParams.get('section');
    
    if (section === 'admins') {
      const admins = await listAdmins();
      return NextResponse.json({ admins });
    }

    const [general, featureFlags, maintenance] = await Promise.all([
      getPlatformSettings('general'),
      getPlatformSettings('feature_flags'),
      getPlatformSettings('maintenance')
    ]);

    return NextResponse.json({ general, featureFlags, maintenance });
  }
);

export const POST = withApi(
  {
    allowedRoles: ['super_admin'], // Only super_admin can add new admins
    auditLog: true,
  },
  async (req, { user }) => {
    const { email, action } = await req.json();

    if (action === 'add_admin') {
      // Find user by email
      const { data: targetUser, error: findError } = await insforgeAdmin!.database
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .single();

      if (findError) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
        return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
      }

      // Upgrade to admin
      const { error: updateError } = await insforgeAdmin!.database
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', targetUser.id);

      if (updateError) throw updateError;

      return NextResponse.json({ message: 'User granted admin access' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
);

export const PATCH = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
    auditLog: true,
  },
  async (req) => {
    const { key, value } = await req.json();
    
    if (!['general', 'feature_flags', 'maintenance'].includes(key)) {
      return NextResponse.json({ error: 'Invalid settings key' }, { status: 400 });
    }

    await updatePlatformSettings(key, value);
    return NextResponse.json({ message: 'Settings updated' });
  }
);

export const DELETE = withApi(
  {
    allowedRoles: ['super_admin'],
    auditLog: true,
  },
  async (req) => {
    const { id } = await req.json();
    
    // Don't allow deleting self is handled in UI, but good to have here too
    // In this simple implementation, we just demote them
    const { error } = await insforgeAdmin!.database
      .from('profiles')
      .update({ role: 'candidate' }) // Default back to candidate
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Admin access removed' });
  }
);
