'use server'

import { insforgeAdmin } from '@/lib/insforge-admin';
import { revalidatePath } from 'next/cache';

import { logAction } from '@/lib/admin/audit';

export async function createRecruiterAction(formData: FormData, adminId: string) {
    if (!insforgeAdmin) throw new Error('Admin client not initialized');

    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const companyId = formData.get('companyId') as string;
    const jobTitle = formData.get('jobTitle') as string;
    const permissionsJson = formData.get('permissions') as string;
    const permissions = JSON.parse(permissionsJson);

    // 1. "Invite" User by signing them up with a temp password and triggering a reset
    const tempPassword = crypto.randomUUID() + 'A1!'; // Secure random temp password
    const { data: signUpData, error: signUpError } = await insforgeAdmin.auth.signUp({
        email,
        password: tempPassword,
        name,
    });

    if (signUpError) {
        return { success: false, error: signUpError.message };
    }

    if (!signUpData?.user) {
        return { success: false, error: 'Failed to create user account' };
    }

    // Trigger the actual invitation email (via password reset)
    await insforgeAdmin.auth.sendResetPasswordEmail({ email });

    const userId = signUpData.user.id;

    // 2. Create profile row
    const { error: profileError } = await insforgeAdmin.database
        .from('profiles')
        .upsert({
            id: userId,
            email,
            name,
            role: 'recruiter',
            company_id: companyId
        });

    if (profileError) {
        return { success: false, error: 'User invited but profile creation failed' };
    }

    // 3. Create recruiter_profiles row with permissions
    const { error: recProfileError } = await insforgeAdmin.database
        .from('recruiter_profiles')
        .upsert({
            id: userId,
            company_id: companyId,
            job_title: jobTitle,
            is_approved: true,
            permissions: permissions
        });

    if (recProfileError) {
        return { success: false, error: 'Recruiter invited but detail profile failed' };
    }

    // 4. Initialize subscription
    await insforgeAdmin.database
        .from('subscriptions')
        .upsert({
            recruiter_id: userId,
            plan: 'starter',
            status: 'active'
        }, { onConflict: 'recruiter_id' });

    // 5. Audit Log
    await logAction({
        adminId,
        action: 'recruiter_created',
        tableName: 'recruiter_profiles',
        recordId: userId,
        newData: { email, name, companyId, permissions }
    });

    revalidatePath('/dashboard/admin/recruiters');
    return { success: true };
}

export async function updatePermissionsAction(recruiterId: string, permissions: any, adminId: string) {
    if (!insforgeAdmin) throw new Error('Admin client not initialized');

    // Get old data for audit
    const { data: oldData } = await insforgeAdmin.database
        .from('recruiter_profiles')
        .select('permissions')
        .eq('id', recruiterId)
        .single();

    const { error } = await insforgeAdmin.database
        .from('recruiter_profiles')
        .update({ permissions })
        .eq('id', recruiterId);

    if (error) {
        return { success: false, error: error.message };
    }

    await logAction({
        adminId,
        action: 'recruiter_permissions_updated',
        tableName: 'recruiter_profiles',
        recordId: recruiterId,
        oldData: oldData?.permissions,
        newData: permissions
    });

    revalidatePath('/dashboard/admin/recruiters');
    return { success: true };
}

export async function toggleRecruiterStatusAction(recruiterId: string, currentStatus: string, adminId: string) {
    if (!insforgeAdmin) throw new Error('Admin client not initialized');

    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    const { error } = await insforgeAdmin.database
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', recruiterId);

    if (error) return { success: false, error: error.message };

    await logAction({
        adminId,
        action: `recruiter_${newStatus}`,
        tableName: 'profiles',
        recordId: recruiterId,
        newData: { status: newStatus }
    });

    revalidatePath('/dashboard/admin/recruiters');
    return { success: true };
}

export async function resetRecruiterPasswordAction(email: string) {
    if (!insforgeAdmin) throw new Error('Admin client not initialized');

    // Since admin.generateLink does not exist, we use sendResetPasswordEmail
    const { error } = await insforgeAdmin.auth.sendResetPasswordEmail({
        email: email,
    });

    if (error) return { success: false, error: error.message };

    return { success: true };
}
