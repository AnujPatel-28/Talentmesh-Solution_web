"use server";

import { inviteAdmin } from '@/lib/admin/invite';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/admin/audit';

/**
 * Server action to initiate an admin invitation
 */
export async function sendAdminInvite(formData: FormData) {
    const email = formData.get('email') as string;
    const adminId = formData.get('adminId') as string; // Inviting admin's ID

    if (!email || !adminId) {
        return { success: false, error: 'Email and Admin ID are required' };
    }

    const result = await inviteAdmin(email, adminId);
    
    if (result.success) {
        await logAction({
            adminId,
            action: 'admin_invited',
            tableName: 'admin_invites',
            newData: { email }
        });
        revalidatePath('/dashboard/admin/settings');
    }

    return result;
}

/**
 * Server action to revoke a pending invite
 */
export async function revokeInvite(email: string, adminId: string) {
    if (!insforgeAdmin) return { success: false, error: 'Admin client not available' };

    try {
        // 1. Find the invite to get the token (which is the user ID)
        const { data: invite } = await insforgeAdmin.database
            .from('admin_invites')
            .select('token')
            .eq('email', email)
            .single();

        if (invite?.token) {
            // 2. Delete the user from auth
            await (insforgeAdmin.auth as any).admin.deleteUser(invite.token);
        }

        // 3. Delete from admin_invites
        const { error: deleteInviteError } = await insforgeAdmin.database
            .from('admin_invites')
            .delete()
            .eq('email', email);

        if (deleteInviteError) throw deleteInviteError;

        await logAction({
            adminId,
            action: 'admin_invite_revoked',
            tableName: 'admin_invites',
            newData: { email }
        });

        revalidatePath('/dashboard/admin/settings');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
