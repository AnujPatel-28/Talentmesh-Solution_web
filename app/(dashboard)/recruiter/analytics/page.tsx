"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './analytics.module.css';

// Types
interface Job {
    id: string;
    title: string;
    status: string;
    views_count: number;
    created_at: string;
    skills_required: string[];
}

interface Application {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
    ai_match_score: number;
    is_shortlisted: boolean;
    candidate_skills?: string[];
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingJobData, setFetchingJobData] = useState(false);

    // Fetch recruiter's jobs
    useEffect(() => {
        if (!user?.id) return;

        const fetchJobs = async () => {
            const { data, error } = await insforge.database
                .from('jobs')
                .select('id, title, status, views_count, created_at, skills_required')
                .eq('recruiter_id', user.id)
                .order('created_at', { ascending: false });

            if (data && data.length > 0) {
                setJobs(data);
                setSelectedJobId(data[0].id);
            } else {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [user?.id]);

    // Fetch applications for selected job
    useEffect(() => {
        if (!selectedJobId) return;

        const fetchJobAnalytics = async () => {
            setFetchingJobData(true);
            const { data, error } = await insforge.database
                .from('applications')
                .select(`
                    id, 
                    status, 
                    created_at, 
                    updated_at, 
                    ai_match_score,
                    is_shortlisted,
                    candidate:profiles!applications_candidate_id_fkey (
                        details:candidate_profiles (skills)
                    )
                `)
                .eq('job_id', selectedJobId);

            if (data) {
                const formatted = data.map((app: any) => ({
                    ...app,
                    candidate_skills: app.candidate?.details?.[0]?.skills || []
                }));
                setApplications(formatted);
            }
            setFetchingJobData(false);
            setLoading(false);
        };

        fetchJobAnalytics();
    }, [selectedJobId]);

    const selectedJob = useMemo(() => jobs.find(j => j.id === selectedJobId), [jobs, selectedJobId]);

    // KPI Calculations
    const metrics = useMemo(() => {
        if (!selectedJob) return null;
        
        const totalApps = applications.length;
        const views = selectedJob.views_count || 0;
        const appRate = views > 0 ? (totalApps / views) * 100 : 0;
        const shortlisted = applications.filter(a => a.is_shortlisted).length;
        const shortlistRate = totalApps > 0 ? (shortlisted / totalApps) * 100 : 0;

        // Avg Response Time
        let avgResponseHours = 0;
        const appsWithUpdates = applications.filter(a => a.updated_at !== a.created_at);
        if (appsWithUpdates.length > 0) {
            const totalHours = appsWithUpdates.reduce((acc, a) => {
                const start = new Date(a.created_at).getTime();
                const end = new Date(a.updated_at).getTime();
                return acc + (end - start) / (1000 * 60 * 60);
            }, 0);
            avgResponseHours = totalHours / appsWithUpdates.length;
        }

        return { views, totalApps, appRate, shortlistRate, avgResponseHours };
    }, [selectedJob, applications]);

    // Chart Data: Velocity
    const velocityData = useMemo(() => {
        if (!selectedJob || applications.length === 0) return [];
        
        const jobPosted = new Date(selectedJob.created_at);
        const daysSince = Math.ceil((new Date().getTime() - jobPosted.getTime()) / (1000 * 60 * 60 * 24));
        const days = Array.from({ length: Math.min(daysSince, 30) }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (Math.min(daysSince, 30) - 1 - i));
            return date.toISOString().split('T')[0];
        });

        return days.map(day => ({
            day,
            count: applications.filter(a => a.created_at.startsWith(day)).length
        }));
    }, [selectedJob, applications]);

    // Chart Data: Skills
    const skillsDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        applications.forEach(app => {
            app.candidate_skills?.forEach(skill => {
                counts[skill] = (counts[skill] || 0) + 1;
            });
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({
                name,
                count,
                required: selectedJob?.skills_required?.includes(name) || false
            }));
    }, [applications, selectedJob]);

    // Chart Data: Histogram
    const histogramData = useMemo(() => {
        const buckets = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
        applications.forEach(app => {
            const score = app.ai_match_score || 0;
            const index = Math.min(Math.floor(score / 20), 4);
            buckets[index]++;
        });
        return buckets;
    }, [applications]);

    // Table Data: Time-to-Stage
    const stageStats = useMemo(() => {
        const groups: Record<string, { sum: number, min: number, max: number, count: number }> = {};
        
        applications.forEach(app => {
            const status = app.status;
            const days = Math.max(0, (new Date(app.updated_at).getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24));
            
            if (!groups[status]) {
                groups[status] = { sum: 0, min: days, max: days, count: 0 };
            }
            groups[status].sum += days;
            groups[status].min = Math.min(groups[status].min, days);
            groups[status].max = Math.max(groups[status].max, days);
            groups[status].count++;
        });

        return Object.entries(groups).map(([status, stat]) => ({
            status,
            avg: (stat.sum / stat.count).toFixed(1),
            min: stat.min.toFixed(1),
            max: stat.max.toFixed(1),
            count: stat.count
        }));
    }, [applications]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={`${styles.skeleton} ${styles.skeletonTabs}`} />
                <div className={styles.metricsRow}>
                    {[1,2,3,4,5].map(i => <div key={i} className={`${styles.skeleton} ${styles.skeletonKPI}`} />)}
                </div>
                <div className={styles.chartGrid}>
                    <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
                </div>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                </div>
                <h2 className={styles.emptyText}>Post your first job to see analytics</h2>
                <a href="/dashboard/recruiter/jobs/new" className={styles.postBtn}>Post a Job</a>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Job Analytics</h1>
                <span className={styles.dateBadge}>Last 30 days</span>
            </header>

            <nav className={styles.tabRow}>
                {jobs.map(job => (
                    <button 
                        key={job.id} 
                        className={`${styles.jobTab} ${selectedJobId === job.id ? styles.tabActive : ''}`}
                        onClick={() => setSelectedJobId(job.id)}
                    >
                        <span className={styles.jobTitle}>{job.title}</span>
                        <span className={styles.statusBadge}>{job.status}</span>
                    </button>
                ))}
            </nav>

            {fetchingJobData ? (
                <div className={styles.metricsRow}>
                    {[1,2,3,4,5].map(i => <div key={i} className={`${styles.skeleton} ${styles.skeletonKPI}`} />)}
                </div>
            ) : (
                <>
                    <div className={styles.metricsRow}>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>Views</span>
                            <div className={styles.kpiValue}>{metrics?.views}</div>
                            <div className={styles.kpiSub}>Total organic views</div>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>Applications</span>
                            <div className={styles.kpiValue}>{metrics?.totalApps}</div>
                            <div className={styles.kpiSub}>Total received</div>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>Conversion</span>
                            <div className={styles.kpiValue}>{metrics?.appRate.toFixed(1)}%</div>
                            <div className={styles.kpiSub}>Views to apps</div>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>Shortlist Rate</span>
                            <div className={styles.kpiValue}>{metrics?.shortlistRate.toFixed(1)}%</div>
                            <div className={styles.kpiSub}>Quality benchmark</div>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>Avg Response</span>
                            <div className={styles.kpiValue}>{metrics?.avgResponseHours.toFixed(0)}h</div>
                            <div className={styles.kpiSub}>Time to first action</div>
                        </div>
                    </div>

                    <div className={styles.chartGrid}>
                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>Application Velocity</h3>
                            <div className={styles.velocityChart}>
                                <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                                    {/* Line Chart logic simplified for SVG */}
                                    <path 
                                        className={styles.areaPath}
                                        d={`M 0 200 ${velocityData.map((d, i) => `L ${(i / (velocityData.length - 1)) * 500} ${200 - (d.count * 10)}`).join(' ')} L 500 200 Z`}
                                    />
                                    <path 
                                        className={styles.linePath}
                                        d={`M 0 ${200 - (velocityData[0]?.count * 10 || 0)} ${velocityData.map((d, i) => `L ${(i / (velocityData.length - 1)) * 500} ${200 - (d.count * 10)}`).join(' ')}`}
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>Top Candidate Skills</h3>
                            <div className={styles.skillsChart}>
                                {skillsDistribution.map(skill => (
                                    <div key={skill.name} className={styles.skillRow}>
                                        <span className={styles.skillName}>{skill.name}</span>
                                        <div className={styles.barContainer}>
                                            <div 
                                                className={styles.bar} 
                                                style={{ width: `${(skill.count / applications.length) * 100}%` }} 
                                            />
                                            {skill.required && <div className={styles.requiredMarker} title="Required Skill" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartGrid}>
                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>Status Funnel</h3>
                            <div className={styles.funnel}>
                                {['applied', 'screening', 'interview', 'offer', 'hired'].map((stage, i) => {
                                    const count = applications.filter(a => a.status === stage).length;
                                    const width = 100 - (i * 15);
                                    return (
                                        <div 
                                            key={stage} 
                                            className={styles.funnelStep} 
                                            style={{ width: `${width}%`, opacity: 1 - (i * 0.1) }}
                                        >
                                            {stage.toUpperCase()}: {count}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>Quality Distribution</h3>
                            {applications.some(a => a.ai_match_score > 0) ? (
                                <div className={styles.histogram}>
                                    {histogramData.map((val, i) => {
                                        const colors = ['#fee2e2', '#fef9c3', '#fde68a', '#dcfce7', '#bbf7d0'];
                                        const h = (val / applications.length) * 180 || 4;
                                        return (
                                            <div 
                                                key={i} 
                                                className={styles.histBar} 
                                                style={{ height: `${h}px`, backgroundColor: colors[i] }}
                                            >
                                                <span className={styles.histValue}>{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={styles.upgradeBanner}>
                                    <p className={styles.upgradeTitle}>AI Scoring Required</p>
                                    <p style={{ fontSize: '13px', color: '#64748b' }}>
                                        Automated candidate matching is available on our <span className={styles.upgradeLink}>Growth Plan</span>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.tableCard}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th}>Stage</th>
                                    <th className={styles.th}>Avg Days</th>
                                    <th className={styles.th}>Min Days</th>
                                    <th className={styles.th}>Max Days</th>
                                    <th className={styles.th}>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stageStats.map(row => (
                                    <tr key={row.status}>
                                        <td className={styles.td}><span className={styles.stageBadge}>{row.status}</span></td>
                                        <td className={styles.td}>{row.avg}</td>
                                        <td className={styles.td}>{row.min}</td>
                                        <td className={styles.td}>{row.max}</td>
                                        <td className={styles.td}>{row.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
