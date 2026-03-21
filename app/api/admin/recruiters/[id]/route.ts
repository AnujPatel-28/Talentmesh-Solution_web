import { NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { createClient } from '@insforge/sdk';
import { cookies } from 'next/headers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recruiterId } = await params;
  const { action } = await request.json();

  // 1. Verify admin session
  const cookieStore = await cookies();
  const token = cookieStore.get('tm_access_token')?.value;
  const role = cookieStore.get('tm_role')?.value;

  if (!token || (role !== 'admin' && role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Identify the admin making the change
  // Create a temporary client to verify the user's token
  const userClient = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: token
  });

  const { data: sessionData, error: sessionError } = await userClient.auth.getCurrentSession();
  
  if (sessionError || !sessionData?.session?.user) {
    console.error('Invalid session or user not found:', sessionError);
    return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 });
  }
  const adminUser = sessionData.session.user;

  try {
    // 1. Check if admin client is available
    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Admin client not configured. Missing INSFORGE_SERVICE_KEY.' }, { status: 500 });
    }

    if (action === 'approve') {
      // Approve recruiter
      const { error: approveError } = await insforgeAdmin.database
        .from('recruiter_profiles')
        .update({
          is_approved: true,
          approved_by: adminUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', recruiterId);

      if (approveError) throw approveError;

      // Insert notification for recruiter
      await insforgeAdmin.database.from('notifications').insert([{
        user_id: recruiterId,
        type: 'account_approved',
        title: 'Account Approved',
        message: 'Your recruiter account has been approved. You can now access all dashboard features.'
      }]);

      return NextResponse.json({ success: true });
    } else if (action === 'suspend') {
      // Suspend recruiter (using is_active in profiles)
      const { error: suspendError } = await insforgeAdmin.database
        .from('profiles')
        .update({ is_active: false })
        .eq('id', recruiterId);

      if (suspendError) throw suspendError;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err: any) {
    console.error('Admin action error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
