"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './job-details.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import InterviewGuidePanel from '@/components/recruiter/InterviewGuidePanel';
import Link from 'next/link';

const IC = {
    chevronLeft: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
};

export default function RecruiterJobDetails() {
    const { job_id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchJob() {
            try {
                const { data } = await insforge.database
                    .from('jobs')
                    .select('*, applications(*)')
                    .eq('id', job_id)
                    .single();
                setJob(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (job_id) fetchJob();
    }, [job_id]);

    if (loading) return <div className={styles.loading}>Loading job details...</div>;
    if (!job) return <div className={styles.container}>Job not found</div>;

    // Ownership check
    if (job.recruiter_id !== user?.id) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Access Denied</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>You don't have permission to view this job posting.</p>
                <Link href="/recruiter/pipeline" className={styles.actionBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Back to My Jobs
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <button onClick={() => router.back()} className={styles.backBtn}>
                {IC.chevronLeft} Back to Jobs
            </button>

            <div className={styles.grid}>
                <div>
                    <div className={styles.mainCard}>
                        <h1 className={styles.jobTitle}>{job.title}</h1>
                        <div className={styles.metaRow}>
                            <span>{job.location}</span> • <span>{job.type}</span> • <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.descriptionSection}>
                            <h3 className={styles.sectionTitle}>Job Description</h3>
                            <p className={styles.description}>{job.description}</p>
                        </div>
                    </div>

                    {/* Integrated AI Interview Guide Panel */}
                    <InterviewGuidePanel jobId={job_id as string} />
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.sideCard}>
                        <h3 className={styles.sectionTitle}>Applicants Overview</h3>
                        <div className={styles.statValue}>{job.applications?.length || 0}</div>
                        <p className={styles.statLabel}>Total applications received</p>
                        <button className={styles.actionBtn}>
                            View All Applicants
                        </button>
                    </div>

                    <div className={styles.statusCard}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Job Status</h3>
                        <div className={styles.statusValue}>
                            <span className={styles.statusDot} />
                            {job.status || 'Active'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
