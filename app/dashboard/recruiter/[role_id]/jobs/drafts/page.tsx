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
    edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};

export default function DraftJobsPage() {
    const params = useParams();
    const roleId = params.role_id as string;
    const { user } = useAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        insforge.database
            .from('jobs')
            .select('*')
            .eq('recruiter_id', user.id)
            .eq('status', 'draft')
            .order('updated_at', { ascending: false })
            .then(({ data }) => { setJobs(data || []); setLoading(false); });
    }, [user?.id]);

    if (loading) return <div className={styles.loading}>Loading draft jobs…</div>;

    return (
        <div className={styles.jobsPage}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Draft Jobs</h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>Unpublished job postings awaiting review</p>
                </div>
                <Link href={`/dashboard/recruiter/${roleId}/jobs/post-job`} className={styles.createBtn}>
                    {IC.plus} Create New Job
                </Link>
            </div>

            {jobs.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p>No draft jobs yet.</p>
                    <Link href={`/dashboard/recruiter/${roleId}/jobs/post-job`} className={styles.createBtn} style={{ marginTop: '1rem' }}>
                        Start a New Job
                    </Link>
                </div>
            ) : (
                jobs.map((j) => (
                    <div key={j.id} className={styles.jobPostCard}>
                        <div className={styles.jobPostBody}>
                            <span className={styles.jobPostTitle}>{j.title}</span>
                            <span className={styles.jobPostMeta}>{IC.mapPin} {j.location || 'Remote'} · Last edited {new Date(j.updated_at).toLocaleDateString()}</span>
                            <div className={styles.jobPostStats}>
                                <span className={styles.jobPostStat} style={{ color: '#f59e0b', fontWeight: 600 }}>● Draft</span>
                            </div>
                        </div>
                        <div className={styles.jobPostActions}>
                            <Link href={`/dashboard/recruiter/${roleId}/jobs/${j.id}`} className={styles.editBtn}>{IC.edit} Edit & Publish</Link>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
