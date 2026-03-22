'use server';

import { 
  updateApplicationStatus, 
  shortlistApplication, 
  rejectApplication 
} from '@/lib/api/admin';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/admin/audit';
import { getCurrentUser } from '@/lib/insforge';

export async function updateStatusAction(id: string, status: string, notes?: string) {
  const user = await getCurrentUser();
  try {
    await updateApplicationStatus(id, status, notes);
    
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'application_status_updated',
        tableName: 'applications',
        recordId: id,
        newData: { status, notes }
      });
    }

    revalidatePath('/dashboard/admin/candidates');
    return { success: true };
  } catch (error: any) {
    console.error('Update status action error:', error);
    return { success: false, error: error.message };
  }
}

export async function shortlistAction(id: string) {
  const user = await getCurrentUser();
  try {
    await shortlistApplication(id);
    
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'application_shortlisted',
        tableName: 'applications',
        recordId: id
      });
    }

    revalidatePath('/dashboard/admin/candidates');
    return { success: true };
  } catch (error: any) {
    console.error('Shortlist action error:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectAction(id: string, reason: string) {
  const user = await getCurrentUser();
  try {
    await rejectApplication(id, reason);
    
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'application_rejected',
        tableName: 'applications',
        recordId: id,
        newData: { reason }
      });
    }

    revalidatePath('/dashboard/admin/candidates');
    return { success: true };
  } catch (error: any) {
    console.error('Reject action error:', error);
    return { success: false, error: error.message };
  }
}
