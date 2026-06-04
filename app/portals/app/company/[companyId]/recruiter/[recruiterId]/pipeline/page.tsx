"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './pipeline.module.css';
import CandidateProfileDrawer from '@/components/recruiter/CandidateProfileDrawer';
import CreateOfferModal from '@/components/recruiter/CreateOfferModal';
import { CustomSelect } from '@/components/ui/CustomSelect';

// Types
type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired';

interface Candidate {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    location: string | null;
    details?: {
        skills: string[];
        resume_url: string | null;
    };
}

interface Application {
    id: string;
    status: ApplicationStatus;
    applied_at: string;
    updated_at: string;
    ai_match_score: number;
    is_shortlisted: boolean;
    notes?: string;
    candidate: Candidate;
}

interface Job {
    id: string;
    title: string;
}

const STAGES: { id: ApplicationStatus; label: string }[] = [
    { id: 'applied', label: 'Applied' },
    { id: 'screening', label: 'Screening' },
    { id: 'interview', label: 'Interview' },
    { id: 'offer', label: 'Offer' },
    { id: 'hired', label: 'Hired' },
];

export default function PipelinePage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<ApplicationStatus | null>(null);

    // Drawer state
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

    // Offer Modal State
    const [offerModalData, setOfferModalData] = useState<{ appId: string; candId: string } | null>(null);

    // Fetch recruiter's jobs
    useEffect(() => {
        if (!user?.id) return;

        const fetchJobs = async () => {
            const { data, error } = await insforge.database
                .from('jobs')
                .select('id, title')
                .eq('recruiter_id', user.id)
                .order('created_at', { ascending: false });

            if (data && data.length > 0) {
                setJobs(data);
                setSelectedJobId(data[0].id);
            }
            setLoading(false);
        };

        fetchJobs();
    }, [user?.id]);

    // Fetch applications for selected job
    useEffect(() => {
        if (!selectedJobId) return;

        const fetchApplications = async () => {
            setLoading(true);
            const { data, error } = await insforge.database
                .from('applications')
                .select(`
                    id, 
                    status, 
                    applied_at, 
                    updated_at, 
                    ai_match_score,
                    is_shortlisted,
                    notes,
                    candidate:profiles!applications_candidate_id_fkey (
                        id, 
                        name, 
                        email, 
                        avatar_url, 
                        location,
                        details:candidate_profiles (
                            skills,
                            resume_url
                        )
                    )
                `)
                .eq('job_id', selectedJobId);

            if (data) {
                // Flatten details if needed or handle nested structure
                const formatted = data.map((app: any) => ({
                    ...app,
                    candidate: {
                        ...app.candidate,
                        details: app.candidate.details?.[0] || { skills: [], resume_url: null }
                    }
                }));
                setApplications(formatted);
            }
            setLoading(false);
        };

        fetchApplications();
    }, [selectedJobId]);

    // Stats
    const stats = useMemo(() => {
        const total = applications.length;
        const offer = applications.filter(a => a.status === 'offer').length;

        // Simple duration calc: avg days since applied for all non-hired
        let avgDays = 0;
        if (total > 0) {
            const now = new Date().getTime();
            const sum = applications.reduce((acc, a) => {
                const applied = new Date(a.applied_at).getTime();
                return acc + (now - applied);
            }, 0);
            avgDays = Math.round(sum / total / (1000 * 60 * 60 * 24));
        }

        return { total, offer, avgDays };
    }, [applications]);

    // Drag and Drop Handlers
    const handleDragStart = (id: string) => {
        setDraggedId(id);
    };

    const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
        e.preventDefault();
        setDropTarget(status);
    };

    const handleDrop = async (status: ApplicationStatus) => {
        if (!draggedId) return;

        const appId = draggedId;
        const oldApp = applications.find(a => a.id === appId);
        if (!oldApp || oldApp.status === status) {
            setDraggedId(null);
            setDropTarget(null);
            return;
        }

        // Optimistic update
        const originalApps = [...applications];
        setApplications(apps => apps.map(a =>
            a.id === appId ? { ...a, status, updated_at: new Date().toISOString() } : a
        ));

        setDraggedId(null);
        setDropTarget(null);

        // Update DB
        const { error } = await insforge.database
            .from('applications')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', appId);

        if (error) {
            console.error('Failed to update status:', error);
            setApplications(originalApps); // Rollback
        }
    };

    const handleToggleShortlist = async (e: React.MouseEvent, appId: string, current: boolean) => {
        e.stopPropagation();

        // Optimistic
        setApplications(apps => apps.map(a =>
            a.id === appId ? { ...a, is_shortlisted: !current } : a
        ));

        const { error } = await insforge.database
            .from('applications')
            .update({ is_shortlisted: !current })
            .eq('id', appId);

        if (error) {
            setApplications(apps => apps.map(a =>
                a.id === appId ? { ...a, is_shortlisted: current } : a
            ));
        }
    };

    const handleSaveNotes = async (appId: string, notes: string) => {
        const { error } = await insforge.database
            .from('applications')
            .update({ notes })
            .eq('id', appId);

        if (!error) {
            setApplications(apps => apps.map(a =>
                a.id === appId ? { ...a, notes } : a
            ));
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Applied today';
        if (days === 1) return 'Applied 1 day ago';
        return `Applied ${days} days ago`;
    };

    const getScoreClass = (score: number) => {
        if (score >= 80) return styles.scoreHigh;
        if (score >= 50) return styles.scoreMid;
        return styles.scoreLow;
    };

    if (loading && jobs.length === 0) {
        return <div className={styles.container}>Loading pipeline...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Hiring Pipeline</h1>
                <div className={styles.controls}>
                    <CustomSelect
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        options={jobs.map(job => ({ label: job.title, value: job.id }))}
                        className={styles.jobSelector}
                    />
                </div>
            </header>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total in Pipeline</span>
                    <span className={styles.statValue}>{stats.total}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>At Offer Stage</span>
                    <span className={styles.statValue}>{stats.offer}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Avg. Stage Duration</span>
                    <span className={styles.statValue}>{stats.avgDays} days</span>
                </div>
            </div>

            <div className={styles.board}>
                {STAGES.map(stage => (
                    <div
                        key={stage.id}
                        className={`${styles.column} ${dropTarget === stage.id ? styles.dropTarget : ''}`}
                        onDragOver={(e) => handleDragOver(e, stage.id)}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={() => handleDrop(stage.id)}
                    >
                        <div className={styles.columnHeader}>
                            <h2 className={styles.columnTitle}>{stage.label}</h2>
                            <span className={styles.columnCount}>
                                {applications.filter(a => a.status === stage.id).length}
                            </span>
                        </div>

                        <div className={styles.columnBody}>
                            {applications
                                .filter(a => a.status === stage.id)
                                .map(app => (
                                    <div
                                        key={app.id}
                                        className={`${styles.card} ${draggedId === app.id ? styles.cardDragging : ''}`}
                                        draggable
                                        onDragStart={() => handleDragStart(app.id)}
                                        onClick={() => {
                                            setSelectedCandidateId(app.candidate.id);
                                        }}
                                    >
                                        <div className={styles.cardHeader}>
                                            <div className={styles.candidateInfo}>
                                                <div className={styles.avatar}>
                                                    {app.candidate.name?.[0].toUpperCase() || 'C'}
                                                </div>
                                                <div className={styles.details}>
                                                    <span className={styles.name}>{app.candidate.name}</span>
                                                    <span className={styles.email}>{app.candidate.email}</span>
                                                </div>
                                            </div>
                                            <div className={`${styles.scorePill} ${getScoreClass(app.ai_match_score)}`}>
                                                {app.ai_match_score}%
                                            </div>
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <span className={styles.timeAgo}>{getTimeAgo(app.applied_at)}</span>
                                            <button
                                                className={`${styles.starBtn} ${app.is_shortlisted ? styles.starActive : ''}`}
                                                onClick={(e) => handleToggleShortlist(e, app.id, app.is_shortlisted)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill={app.is_shortlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            </button>
                                        </div>

                                        {stage.id === 'offer' && (
                                            <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                                                <button
                                                    className={styles.offerBtn}
                                                    onClick={() => setOfferModalData({ appId: app.id, candId: app.candidate.id })}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
                                                    Create Offer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                            {applications.filter(a => a.status === stage.id).length === 0 && (
                                <div className={styles.emptyState}>No candidates</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <CandidateProfileDrawer
                candidateId={selectedCandidateId}
                onClose={() => setSelectedCandidateId(null)}
            />

            {offerModalData && (
                <CreateOfferModal
                    applicationId={offerModalData.appId}
                    jobId={selectedJobId}
                    candidateId={offerModalData.candId}
                    onClose={() => setOfferModalData(null)}
                    onSuccess={() => {
                        // Refresh applications to show updated status if changed
                        // Though CreateOfferModal might update app status to 'offer' (which it already is here)
                    }}
                />
            )}
        </div>
    );
}