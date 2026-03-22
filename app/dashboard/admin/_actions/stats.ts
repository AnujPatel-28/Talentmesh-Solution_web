"use server";

import { insforgeAdmin } from '@/lib/insforge-admin';

export async function getDashboardStats() {
    if (!insforgeAdmin) throw new Error('Admin context not available');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
        const [
            { count: totalCandidates },
            { count: newCandidatesWeek },
            { count: totalRecruiters },
            { count: newRecruitersWeek },
            { count: activeJobs },
            { count: totalApplications },
            { count: newApplicationsWeek },
            { count: pendingRecruiters },
            { count: pendingJobs }
        ] = await Promise.all([
            insforgeAdmin.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
            insforgeAdmin.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate').gte('created_at', oneWeekAgo.toISOString()),
            insforgeAdmin.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter'),
            insforgeAdmin.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter').gte('created_at', oneWeekAgo.toISOString()),
            insforgeAdmin.database.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            insforgeAdmin.database.from('applications').select('*', { count: 'exact', head: true }),
            insforgeAdmin.database.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', oneWeekAgo.toISOString()),
            insforgeAdmin.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter').eq('status', 'pending'),
            insforgeAdmin.database.from('jobs').select('*', { count: 'exact', head: true }).eq('is_approved', false)
        ]);

        return {
            candidates: {
                total: totalCandidates || 0,
                trend: newCandidatesWeek || 0
            },
            recruiters: {
                total: totalRecruiters || 0,
                trend: newRecruitersWeek || 0
            },
            jobs: {
                total: activeJobs || 0,
                pending: pendingJobs || 0
            },
            applications: {
                total: totalApplications || 0,
                trend: newApplicationsWeek || 0
            },
            pendingApprovals: {
                recruiters: pendingRecruiters || 0,
                jobs: pendingJobs || 0,
                total: (pendingRecruiters || 0) + (pendingJobs || 0)
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}

export async function getRecentApplications() {
    if (!insforgeAdmin) return [];
    
    const { data, error } = await insforgeAdmin.database
        .from('applications')
        .select(`
            id,
            status,
            applied_at,
            candidate_id,
            candidate:profiles!applications_candidate_id_fkey(name, avatar_url),
            job_id,
            jobs:jobs(title, company_name)
        `)
        .order('applied_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching recent applications:', error);
        return [];
    }

    return data;
}

export async function getFunnelStats() {
    if (!insforgeAdmin) return null;

    const { data, error } = await insforgeAdmin.database
        .from('applications')
        .select('status');

    if (error) return null;

    const stages = ['applied', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired'];
    const counts: Record<string, number> = stages.reduce((acc, stage) => ({ ...acc, [stage]: 0 }), {});

    data.forEach(app => {
        if (counts[app.status] !== undefined) {
            counts[app.status]++;
        }
    });

    return counts;
}

export async function getTopJobs() {
    if (!insforgeAdmin) return [];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await insforgeAdmin.database
        .from('jobs')
        .select(`
            id,
            title,
            company_name,
            applications:applications(count)
        `)
        .eq('status', 'active')
        .limit(5);

    if (error) return [];
    
    // Manual sort because service key might not support aggregate sorting easily without raw SQL
    return data.sort((a: any, b: any) => (b.applications?.[0]?.count || 0) - (a.applications?.[0]?.count || 0));
}

export async function getLatestUsers() {
    if (!insforgeAdmin) return { candidates: [], recruiters: [] };

    const [candidates, recruiters] = await Promise.all([
        insforgeAdmin.database.from('profiles').select('id, name, avatar_url, created_at').eq('role', 'candidate').order('created_at', { ascending: false }).limit(5),
        insforgeAdmin.database.from('profiles').select('id, name, avatar_url, created_at, role').eq('role', 'recruiter').order('created_at', { ascending: false }).limit(5)
    ]);

    return {
        candidates: candidates.data || [],
        recruiters: recruiters.data || []
    };
}

export async function getActivityFeed() {
    if (!insforgeAdmin) return [];

    const { data, error } = await insforgeAdmin.database
        .from('audit_logs')
        .select(`
            *,
            actor:profiles!audit_logs_actor_id_fkey(name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching activity feed:', error);
        return [];
    }

    return data;
}
