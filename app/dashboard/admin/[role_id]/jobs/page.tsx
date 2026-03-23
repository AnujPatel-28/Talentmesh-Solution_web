import React from 'react';
import { getAllJobs } from '@/lib/api/admin';
import AdminJobsList from './AdminJobsList';
import { getServerUser } from '@/lib/insforge';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminJobsPage() {
    const user = await getServerUser();
    
    if (!user || user.role !== 'super_admin') {
        redirect('/dashboard/candidate');
    }

    const jobs = await getAllJobs();

    return <AdminJobsList initialJobs={jobs || []} />;
}
