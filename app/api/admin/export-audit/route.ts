import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';
import { insforgeAdmin } from '@/lib/insforge-admin';

export async function GET(request: NextRequest) {
    if (!insforgeAdmin) return new NextResponse('Admin client not initialized', { status: 500 });
    
    // 1. Verify Authorization
    const insforge = createClient({
        baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
        anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
        auth: {
            storage: {
                getItem: (key: string) => request.cookies.get(key)?.value ?? null,
                setItem: () => {},
                removeItem: () => {}
            }
        }
    } as any);

    const { data: sessionData } = await insforge.auth.refreshSession();
    const user = sessionData?.user;
    
    if (!user || (user.metadata as any)?.role !== 'super_admin') {
        return new NextResponse('Unauthorized: Admin access required', { status: 401 });
    }
    
    // 2. Fetch data (protected code continue below)
    
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const type = searchParams.get('type') || 'all';
    const activeTab = searchParams.get('activeTab');
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = insforgeAdmin!
        .database
        .from('audit_logs')
        .select(`
            id,
            created_at,
            actor_id,
            action,
            table_name,
            record_id,
            status,
            ip_address,
            profiles:actor_id (name)
        `)
        .order('created_at', { ascending: false });

    if (activeTab === 'login') {
        query = query.ilike('action', '%security%').or('action.ilike.%login%').or('action.ilike.%mfa%');
    } else {
        if (adminId) query = query.eq('actor_id', adminId);
        if (from) query = query.gte('created_at', new Date(from).toISOString());
        if (to) query = query.lte('created_at', new Date(to).toISOString());
        
        if (type !== 'all') {
            if (type === 'user') query = query.ilike('action', '%user%').or('action.ilike.%recruiter%');
            if (type === 'job') query = query.ilike('action', '%job%');
            if (type === 'security') query = query.ilike('action', '%security%').or('action.ilike.%login%').or('action.ilike.%mfa%');
            if (type === 'settings') query = query.ilike('action', '%settings%');
        }
    }

    const { data, error } = await query;
    if (error) return new NextResponse(error.message, { status: 400 });

    // Convert to CSV
    const headers = ['Timestamp', 'Admin', 'Action', 'Resource', 'Status', 'IP Address'];
    const rows = (data || []).map(log => [
        new Date(log.created_at).toISOString(),
        log.profiles?.[0]?.name || 'System',
        log.action.toUpperCase(),
        `${log.table_name || ''} ${log.record_id || ''}`.trim(),
        log.status,
        log.ip_address
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const dateStr = new Date().toISOString().split('T')[0];
    
    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="talentmesh-audit-${dateStr}.csv"`
        }
    });
}
