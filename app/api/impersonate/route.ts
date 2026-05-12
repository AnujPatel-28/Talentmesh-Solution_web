import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { getServerInsforgeClient } from '@/lib/server-insforge';

export async function POST(req: NextRequest) {
    const insforge = await getServerInsforgeClient();
    if (!insforge) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify requester is admin
    if (!insforgeAdmin) {
        return NextResponse.json({ error: 'Internal Server Error: Admin client not configured' }, { status: 500 });
    }

    const { data: profile } = await insforgeAdmin.database
        .from('profiles')
        .select('role, name, email')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, userRole } = await req.json();

    // Fetch target user info for logging
    const { data: targetProfile } = await insforgeAdmin.database
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single();

    // Log to audit_logs
    await insforgeAdmin.database.from('audit_logs').insert([{
        actor_id: user.id,
        action: 'user_impersonation_start',
        target_type: 'profile',
        target_id: userId,
        metadata: { 
            impersonated_user: userId, 
            impersonated_role: userRole,
            impersonated_name: targetProfile?.name,
            impersonated_email: targetProfile?.email,
            admin_name: profile.name,
            admin_email: profile.email
        }
    }]);

    const response = NextResponse.json({ success: true });
    
    // Set impersonation cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 3600 // 1 hour
    };

    const cookieStore = await cookies();
    cookieStore.set('impersonating_user_id', userId, cookieOptions);
    cookieStore.set('impersonating_user_role', userRole, cookieOptions);
    cookieStore.set('admin_user_id', user.id, cookieOptions);

    return response;
}

export async function DELETE(req: NextRequest) {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_user_id')?.value;
    const targetId = cookieStore.get('impersonating_user_id')?.value;

    if (adminId && insforgeAdmin) {
        // Log end of impersonation
        await insforgeAdmin.database.from('audit_logs').insert([{
            actor_id: adminId,
            action: 'user_impersonation_end',
            target_type: 'profile',
            target_id: targetId || null,
            metadata: { impersonated_user: targetId }
        }]);
    }

    const response = NextResponse.json({ success: true });
    
    const cookieStore2 = await cookies();
    cookieStore2.delete('impersonating_user_id');
    cookieStore2.delete('impersonating_user_role');
    cookieStore2.delete('admin_user_id');

    return response;
}
