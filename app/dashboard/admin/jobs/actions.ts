'use server';

import { 
  approveJob, 
  pauseJob, 
  closeJob, 
  deleteJob, 
  rejectJob, 
  createAdminJob,
  updateAdminJob 
} from '@/lib/api/admin';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/admin/audit';
import { getCurrentUser } from '@/lib/insforge';

export async function approveJobAction(id: string) {
  const user = await getCurrentUser();
  try {
    await approveJob(id);
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'job_approved',
        tableName: 'jobs',
        recordId: id
      });
    }
    revalidatePath('/dashboard/admin/jobs');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function pauseJobAction(id: string) {
  const user = await getCurrentUser();
  try {
    await pauseJob(id);
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'job_paused',
        tableName: 'jobs',
        recordId: id
      });
    }
    revalidatePath('/dashboard/admin/jobs');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function closeJobAction(id: string) {
  const user = await getCurrentUser();
  try {
    await closeJob(id);
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'job_closed',
        tableName: 'jobs',
        recordId: id
      });
    }
    revalidatePath('/dashboard/admin/jobs');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteJobAction(id: string) {
  const user = await getCurrentUser();
  try {
    await deleteJob(id);
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'job_deleted',
        tableName: 'jobs',
        recordId: id,
        status: 'success'
      });
    }
    revalidatePath('/dashboard/admin/jobs');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectJobAction(id: string, reason: string) {
  const user = await getCurrentUser();
  try {
    await rejectJob(id, reason);
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'job_rejected',
        tableName: 'jobs',
        recordId: id,
        newData: { reason }
      });
    }
    revalidatePath('/dashboard/admin/jobs');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createJobAction(formData: any) {
  const user = await getCurrentUser();
  try {
    const data = await createAdminJob(formData);
    if (user && data) {
      await logAction({
        adminId: user.id,
        action: 'job_created',
        tableName: 'jobs',
        recordId: data.id,
        newData: formData
      });
    }
    revalidatePath('/dashboard/admin/jobs');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateJobAction(id: string, formData: any) {
  const user = await getCurrentUser();
  try {
    const data = await updateAdminJob(id, formData);
    if (user) {
      await logAction({
        adminId: user.id,
        action: 'job_updated',
        tableName: 'jobs',
        recordId: id,
        newData: formData
      });
    }
    revalidatePath('/dashboard/admin/jobs');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
