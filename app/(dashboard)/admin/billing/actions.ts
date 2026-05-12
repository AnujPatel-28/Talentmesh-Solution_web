"use server";

import { logAction } from "@/lib/admin/audit";

export async function logAdminBillingAction(params: {
  adminId: string;
  action: string;
  tableName?: string;
  recordId?: string;
  oldData?: object;
  newData?: object;
  status?: 'success' | 'failure';
}) {
  return await logAction(params);
}
