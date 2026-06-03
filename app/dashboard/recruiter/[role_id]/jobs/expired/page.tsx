"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from '../jobs.module.css';

const IC = {
    plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

export default function ExpiredJobsPage() {
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
            .eq('status', 'closed')
            .order('updated_at', { ascending: false })
            .then(({ data }) => { setJobs(data || []); setLoading(false); });
    }, [user?.id]);

    if (loading) return <div className={styles.loading}>Loading expired jobs…</div>;

    return (
        <div className={styles.jobsPage}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Expired Jobs</h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>Closed postings — repost to re-activate</p>
                </div>
                <Link href={`/dashboard/recruiter/${roleId}/jobs/post-job`} className={styles.createBtn}>
                    {IC.plus} Post New Job
                </Link>
            </div>

            {jobs.length === 0 ? (
                <div className={styles.emptyState}><p>No expired jobs found.</p></div>
            ) : (
                jobs.map((j) => (
                    <div key={j.id} className={styles.jobPostCard} style={{ opacity: 0.8 }}>
                        <div className={styles.jobPostBody}>
                            <span className={styles.jobPostTitle}>{j.title}</span>
                            <span className={styles.jobPostMeta}>{IC.mapPin} {j.location || 'Remote'} · Expired {new Date(j.updated_at).toLocaleDateString()}</span>
                            <div className={styles.jobPostStats}>
                                <span className={styles.jobPostStat}>{j.applications?.[0]?.count || 0} total applicants</span>
                                <span className={styles.jobPostStat} style={{ color: '#94a3b8', fontWeight: 600 }}>● Expired</span>
                            </div>
                        </div>
                        <div className={styles.jobPostActions}>
                            <Link href={`/dashboard/recruiter/${roleId}/jobs/${j.id}`} className={styles.editBtn} style={{ background: '#f1f5f9', color: '#475569' }}>
                                {IC.refresh} Repost
                            </Link>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
