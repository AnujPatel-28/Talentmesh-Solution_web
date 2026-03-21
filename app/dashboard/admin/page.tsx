"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    briefcase: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    trending: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
};

export default function AdminPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState([
        { label: 'Total Jobs', value: '0', change: 'Live', color: '#eff6ff', iconBg: 'linear-gradient(135deg, #007BFF, #2563eb)' },
        { label: 'Candidates', value: '0', change: 'Live', color: '#f0fdf4', iconBg: 'linear-gradient(135deg, #10b981, #059669)' },
        { label: 'Recruiters', value: '0', change: 'Live', color: '#fefce8', iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
        { label: 'Pending Actions', value: '0', change: 'Urgent', color: '#fef2f2', iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    ]);
    const [pendingJobs, setPendingJobs] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push('/dashboard/candidate');
            return;
        }

        async function fetchData() {
            try {
                // Fetch counts
                const [{ count: jobCount }, { count: candCount }, { count: recCount }] = await Promise.all([
                    insforge.database.from('jobs').select('*', { count: 'exact', head: true }),
                    insforge.database.from('candidate_profiles').select('*', { count: 'exact', head: true }),
                    insforge.database.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter')
                ]);

                setStats(prev => [
                    { ...prev[0], value: (jobCount || 0).toString() },
                    { ...prev[1], value: (candCount || 0).toString() },
                    { ...prev[2], value: (recCount || 0).toString() },
                    { ...prev[3], value: '0' },
                ]);

                // Fetch pending jobs (assuming status 'pending' exists)
                const { data: jobs } = await insforge.database
                    .from('jobs')
                    .select('*, company_profiles(company_name)')
                    .limit(5); // In a real app, you'd filter by status
                
                setPendingJobs(jobs || []);

                // Fetch recent activity
                const { data: acts } = await insforge.database
                    .from('activity')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);
                setActivities(acts || []);

            } catch (err) {
                console.error('Admin fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        if (user?.role === 'super_admin') fetchData();
    }, [user, authLoading, router]);

    const handleApprove = async (jobId: string) => {
        // Logic to update job status
        alert(`Approving job ${jobId}`);
    };

    if (authLoading || loading) return <div className={styles.loading}>Loading Admin controls...</div>;

    return (
        <div className={styles.dash}>
            <div className={styles.greetBanner}>
                <h1 className={styles.greetTitle}>Admin Control Center</h1>
                <p className={styles.greetSub}>Monitor platform activity, manage jobs, and oversee all users from one place.</p>
            </div>

            <AnimateOnScroll animation="fadeUp" delay={100}>
                <div className={styles.stats}>
                    {stats.map((s, i) => (
                        <div key={i} className={styles.stat}>
                            <div className={styles.statTop}>
                                <span className={styles.statLabel}>{s.label}</span>
                                <div className={styles.statBox} style={{ background: s.iconBg }}>
                                    {i === 0 ? IC.briefcase : i === 1 ? IC.users : i === 2 ? IC.shield : IC.briefcase}
                                </div>
                            </div>
                            <span className={styles.statVal}>{s.value}</span>
                            <span className={styles.statChange}>{IC.trending} {s.change}</span>
                        </div>
                    ))}
                </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="scaleUp" delay={150}>
                <div className={styles.quickGrid}>
                    <Link href="/dashboard/admin/jobs" className={styles.quickCard}>
                        <div className={styles.quickIcon} style={{ background: 'linear-gradient(135deg, #007BFF, #2563eb)' }}>{IC.briefcase}</div>
                        <span className={styles.quickLabel}>Post a Job</span>
                        <span className={styles.quickHint}>Create job listings on behalf of recruiters</span>
                    </Link>
                    <Link href="/dashboard/admin/candidates" className={styles.quickCard}>
                        <div className={styles.quickIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>{IC.users}</div>
                        <span className={styles.quickLabel}>Review Candidates</span>
                        <span className={styles.quickHint}>Accept or reject pending applications</span>
                    </Link>
                    <Link href="/dashboard/admin/recruiters" className={styles.quickCard}>
                        <div className={styles.quickIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>{IC.shield}</div>
                        <span className={styles.quickLabel}>Manage Recruiters</span>
                        <span className={styles.quickHint}>Handle recruiter accounts and issues</span>
                    </Link>
                </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeUp" delay={200}>
                <div className={styles.mainGrid}>
                    <div className={styles.leftCol}>
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitle}>Recent Job Postings</h2>
                                <Link href="/dashboard/admin/jobs" className={styles.viewAll}>View All</Link>
                            </div>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Company</th>
                                        <th>Industry</th>
                                        <th>Applicants</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingJobs.map((j, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{j.title}</td>
                                            <td>{j.company_profiles?.company_name || 'Unknown'}</td>
                                            <td>{j.industry}</td>
                                            <td>{j.applicants_count || 0}</td>
                                            <td>
                                                <button className={styles.successBtn} onClick={() => handleApprove(j.id)}>Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={styles.rightCol}>
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <h2 className={styles.cardTitle}>Recent Activity</h2>
                            </div>
                            {activities.map((a, i) => (
                                <div key={i} className={styles.actItem}>
                                    <div className={styles.actDot} style={{ background: '#3b82f6' }} />
                                    <div className={styles.actBody}>
                                        <span className={styles.actText}>{a.description}</span>
                                        <span className={styles.actTime}>{new Date(a.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </AnimateOnScroll>
        </div>
    );
}
