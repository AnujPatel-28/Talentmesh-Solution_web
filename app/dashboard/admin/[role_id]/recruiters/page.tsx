import React from 'react';
import { insforgeAdmin } from '@/lib/insforge-admin';
import RecruitersClient from './RecruitersClient';

async function getRecruitersData() {
    if (!insforgeAdmin) return { recruiters: [], companies: [] };

    const [recDoc, compDoc] = await Promise.all([
        insforgeAdmin.database.from('recruiter_profiles').select(`
            *,
            profiles:id (
                id,
                email,
                name,
                status
            ),
            company:company_id (
                id,
                company_name
            )
        `).order('created_at', { ascending: false }),
        insforgeAdmin.database.from('companies').select('id, company_name').order('company_name')
    ]);

    return {
        recruiters: recDoc.data || [],
        companies: compDoc.data || []
    };
}

export default async function RecruitersPage() {
    const { recruiters, companies } = await getRecruitersData();

    return (
        <RecruitersClient 
            initialRecruiters={recruiters} 
            companies={companies} 
        />
    );
}
