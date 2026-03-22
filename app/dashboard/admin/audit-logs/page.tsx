import React from 'react';
import { insforgeAdmin } from '@/lib/insforge-admin';
import AuditLogClient from './AuditLogClient';

export const dynamic = 'force-dynamic';

async function getAuditMetadata() {
    if (!insforgeAdmin) return { admins: [], total: 0, stats: null };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        { count: total },
        { count: todayCount },
        { count: security24h },
        { data: admins },
        { data: leader }
    ] = await Promise.all([
        insforgeAdmin.database.from('audit_logs').select('*', { count: 'exact', head: true }),
        insforgeAdmin.database.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        insforgeAdmin.database.from('audit_logs').select('*', { count: 'exact', head: true }).like('action', '%security%').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
        insforgeAdmin.database.from('profiles').select('id, name, email').eq('role', 'super_admin'),
        insforgeAdmin.database.from('audit_logs').select('actor_id').gte('created_at', today.toISOString())
    ]);

    // Simple manual count for most active admin today
    const actorCounts: Record<string, number> = {};
    leader?.forEach(l => {
        if (l.actor_id) actorCounts[l.actor_id] = (actorCounts[l.actor_id] || 0) + 1;
    });
    const topActorId = Object.keys(actorCounts).sort((a, b) => actorCounts[b] - actorCounts[a])[0];
    const topActor = admins?.find(a => a.id === topActorId);

    return {
        admins: admins || [],
        total: total || 0,
        stats: {
            today: todayCount || 0,
            security: security24h || 0,
            topAdmin: topActor ? `${topActor.name} (${actorCounts[topActorId]})` : 'None yet'
        }
    };
}

export default async function AuditLogPage() {
    const { admins, total, stats } = await getAuditMetadata();

    return (
        <AuditLogClient 
            admins={admins} 
            totalInitial={total} 
            stats={stats} 
        />
    );
}
