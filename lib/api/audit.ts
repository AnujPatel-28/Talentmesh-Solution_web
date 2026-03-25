import { insforgeAdmin } from '@/lib/insforge-admin';
import { headers } from 'next/headers';

/**
 * Standardized audit logging for API requests.
 * Uses the insforgeAdmin client to bypass RLS and log directly to the audit_logs table.
 */
export async function logAudit(
  userId: string,
  method: string,
  path: string,
  metadata: any
) {
  if (!insforgeAdmin) {
    console.warn('[AUDIT] Skipping audit log - insforgeAdmin not initialized');
    return;
  }

  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? 'unknown';

    // Log to audit_logs table
    // Using existing columns from the audit_logs schema:
    // id, actor_id, action, table_name, record_id, old_data, new_data, ip_address
    await insforgeAdmin.database.from('audit_logs').insert({
      actor_id: userId,
      action: `${method} ${path}`,
      table_name: 'api_request',
      new_data: {
        ...metadata,
        ip_address: ip
      },
      ip_address: ip.includes(':') ? null : ip // Handle inet type constraints if any
    });
  } catch (error) {
    console.error('[AUDIT ERROR]', error);
  }
}
