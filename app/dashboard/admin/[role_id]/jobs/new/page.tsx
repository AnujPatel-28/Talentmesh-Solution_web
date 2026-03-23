import React from 'react';
import { getAllCompanies } from '@/lib/api/admin';
import AdminJobForm from '../AdminJobForm';
import { getServerUser } from '@/lib/insforge';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewAdminJobPage() {
    const user = await getServerUser();
    
    if (!user || user.role !== 'super_admin') {
        redirect('/dashboard/candidate');
    }

    const companies = await getAllCompanies();

    return (
        <AdminJobForm 
            companies={companies || []} 
            mode="create" 
        />
    );
}
