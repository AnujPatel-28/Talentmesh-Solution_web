"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './jobs.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

const IC = {
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
};

export default function RecruiterJobsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchJobs() {
            if (!user?.company_id) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await insforge.database
                    .from('jobs')
                    .select('*, applications(count)')
                    .eq('recruiter_id', user.id)
                    .order('created_at', { ascending: false });
                
                setJobs(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchJobs();
    }, [user]);

    if (loading) return <div className={styles.loading}>Loading your postings...</div>;

    return (
        <div className={styles.jobsPage}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Job Postings</h1>
                <Link href={`/dashboard/recruiter/${user?.id}/jobs/post-job`} className={styles.createBtn}>
                    {IC.plus} Post a New Job
                </Link>
            </div>
            {jobs.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>You haven't posted any jobs yet.</p>
                </div>
            ) : (
                jobs.map((j, i) => (
                    <div key={i} className={styles.jobPostCard}>
                        <div className={styles.jobPostBody}>
                            <span className={styles.jobPostTitle}>{j.title}</span>
                            <span className={styles.jobPostMeta}>{IC.mapPin} {j.location || 'Remote'} · Posted {new Date(j.created_at).toLocaleDateString()}</span>
                            <div className={styles.jobPostStats}>
                                <span className={styles.jobPostStat}>{(j.applications?.[0]?.count || 0)} applicants</span>
                                <span className={styles.jobPostStat}>0 new</span>
                                <span className={styles.jobPostStat} style={{ color: j.status === 'active' ? '#10b981' : '#f59e0b' }}>● {j.status || 'Active'}</span>
                            </div>
                        </div>
                        <div className={styles.jobPostActions}>
                            <Link href={`/dashboard/recruiter/${user?.id}/jobs/${j.id}`} className={styles.editBtn}>
                                View & Manage
                            </Link>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
