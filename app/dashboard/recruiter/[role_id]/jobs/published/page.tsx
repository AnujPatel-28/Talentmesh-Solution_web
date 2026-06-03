"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from '../jobs.module.css';

const IC = {
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    users: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
};

export default function PublishedJobsPage() {
    const params = useParams();
    const roleId = params.role_id as string;
    const { user } = useAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        insforge.database
            .from('jobs')
            .select('*, applications(count)')
            .eq('recruiter_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .then(({ data }) => { setJobs(data || []); setLoading(false); });
    }, [user?.id]);

    if (loading) return <div className={styles.loading}>Loading published jobs…</div>;

    return (
        <div className={styles.jobsPage}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Published Jobs</h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>Live job postings visible to candidates</p>
                </div>
                <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.4rem 0.9rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {jobs.length} Active
                </span>
            </div>

            {jobs.length === 0 ? (
                <div className={styles.emptyState}><p>No published jobs at the moment.</p></div>
            ) : (
                jobs.map((j) => (
                    <div key={j.id} className={styles.jobPostCard}>
                        <div className={styles.jobPostBody}>
                            <span className={styles.jobPostTitle}>{j.title}</span>
                            <span className={styles.jobPostMeta}>{IC.mapPin} {j.location || 'Remote'} · Posted {new Date(j.created_at).toLocaleDateString()}</span>
                            <div className={styles.jobPostStats}>
                                <span className={styles.jobPostStat}>{IC.users} {j.applications?.[0]?.count || 0} applicants</span>
                                <span className={styles.jobPostStat} style={{ color: '#10b981', fontWeight: 600 }}>● Active</span>
                            </div>
                        </div>
                        <div className={styles.jobPostActions}>
                            <Link href={`/dashboard/recruiter/${roleId}/jobs/${j.id}`} className={styles.editBtn}>View & Manage</Link>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
