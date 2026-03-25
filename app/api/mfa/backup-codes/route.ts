import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

import { getAuthenticatedSession } from '@/lib/auth/server-auth';
import { insforgeAdmin } from '@/lib/insforge-admin';

function generateBackupCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

export async function POST() {
  try {
    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const session = await getAuthenticatedSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const codes = Array.from({ length: 8 }, generateBackupCode);

    await insforgeAdmin.database
      .from('admin_backup_codes')
      .delete()
      .eq('admin_id', session.user.id)
      .eq('used', false);

    const { error } = await insforgeAdmin.database
      .from('admin_backup_codes')
      .insert(
        codes.map((code) => ({
          admin_id: session.user.id,
          code_hash: hashCode(code),
          used: false,
        })),
      );

    if (error) {
      console.error('Failed to save backup codes:', error);
      return NextResponse.json({ error: 'Failed to save backup codes' }, { status: 500 });
    }

    return NextResponse.json({ codes });
  } catch (err: any) {
    console.error('Backup code generation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate backup codes' }, { status: 500 });
  }
}
