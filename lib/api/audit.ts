import { insforge } from '@/lib/insforge';

export const logAudit = async (userId: string, action: string, resource: string, details?: any) => {
  try {
    await insforge.database.from('audit_logs').insert({
      user_id: userId,
      action,
      resource,
      details
    });
  } catch (e) {
    console.error('Audit log failed', e);
  }
};
