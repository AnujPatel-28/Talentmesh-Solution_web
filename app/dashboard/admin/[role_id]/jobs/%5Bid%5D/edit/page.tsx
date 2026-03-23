import React from 'react';
import { getAllCompanies, getAdminJobById } from '@/lib/api/admin';
import AdminJobForm from '../../AdminJobForm';
import { getServerUser } from '@/lib/insforge';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditAdminJobPageProps {
    params: { id: string };
}

export default async function EditAdminJobPage({ params }: EditAdminJobPageProps) {
    const user = await getServerUser();
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        redirect('/dashboard/candidate');
    }

    try {
        const [companies, job] = await Promise.all([
            getAllCompanies(),
            getAdminJobById(params.id)
        ]);

        if (!job) {
            notFound();
        }

        return (
            <AdminJobForm 
                companies={companies || []} 
                initialData={job}
                mode="edit" 
            />
        );
    } catch (error) {
        console.error('Edit job error:', error);
        notFound();
    }
}
