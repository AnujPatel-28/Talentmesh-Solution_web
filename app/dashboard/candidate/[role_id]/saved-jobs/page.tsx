"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import styles from './saved-jobs.module.css';

// ─── Icons ──────────────────────────────────────────────────────────────────────
const IC = {
    search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    bookmark: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>,
    clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    location: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
};

export default function SavedJobsPage() {
    const router = useRouter();
    const params = useParams();
    const role_id = params.role_id as string;
    const { user, isLoading: authLoading } = useAuth();
    const { toggleSave, loading: hookLoading } = useSavedJobs(user?.id || null);

    const [savedJobs, setSavedJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [removingId, setRemovingId] = useState<string | null>(null);

    const fetchSavedJobs = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await insforge.database
                .from('saved_jobs')
                .select(`
                    id, job_id, created_at,
                    job:jobs(id, title, company_name, location, type, salary_min, salary_max, logo_url, status)
                `)
                .eq('candidate_id', user.id);

            if (error) throw error;
            setSavedJobs(data || []);
        } catch (err) {
            console.error("Error fetching saved jobs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchSavedJobs();
    }, [user?.id]);

    const filteredJobs = useMemo(() => {
        let result = savedJobs.filter(item => {
            const job = item.job;
            if (!job) return false;
            const searchLower = search.toLowerCase();
            return job.title.toLowerCase().includes(searchLower) || 
                   job.company_name.toLowerCase().includes(searchLower);
        });

        if (sortBy === "newest") {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === "oldest") {
            result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (sortBy === "alpha") {
            result.sort((a, b) => a.job.title.localeCompare(b.job.title));
        }

        return result;
    }, [savedJobs, search, sortBy]);

    const handleRemove = async (jobId: string, savedItemId: string) => {
        setRemovingId(savedItemId);
        // Wait for animation
        setTimeout(async () => {
            await toggleSave(jobId);
            setSavedJobs(prev => prev.filter(item => item.id !== savedItemId));
            setRemovingId(null);
        }, 300);
    };

    if (authLoading || (loading && savedJobs.length === 0)) {
        return <div className={styles.container}>Loading saved jobs...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>Saved Jobs</h1>
                    <span className={styles.badge}>{savedJobs.length} saved</span>
                </div>
            </header>

            <div className={styles.controls}>
                <div className={styles.search}>
                    <span className={styles.searchIcon}>{IC.search}</span>
                    <input 
                        type="text" 
                        placeholder="Search by title or company..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className={styles.sort}>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="alpha">Alphabetical</option>
                    </select>
                </div>
            </div>

            {filteredJobs.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>{IC.bookmark}</div>
                    <h2 className={styles.emptyTitle}>No saved jobs found</h2>
                    <p className={styles.emptyText}>
                        {search ? "Try adjusting your search filters." : "You haven't saved any jobs yet. Start browsing to find your next role!"}
                    </p>
                    <Link href={`/dashboard/candidate/${role_id}/jobs`} className={styles.cta}>
                        Browse Jobs
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredJobs.map((item) => {
                        const job = item.job;
                        const isExpired = job.status !== 'active';
                        const timeAgo = Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                            <div 
                                key={item.id} 
                                className={`${styles.jobCard} ${removingId === item.id ? styles.removing : ''}`}
                            >
                                {isExpired && <div className={styles.expired}>No longer active</div>}
                                
                                <div className={styles.cardTop} onClick={() => router.push(`/browse-jobs/${job.id}`)}>
                                    <div 
                                        className={styles.logo} 
                                        style={{ background: '#2563eb' }}
                                    >
                                        {job.company_name[0]}
                                    </div>
                                    <div className={styles.info}>
                                        <h3 className={styles.jobTitle}>{job.title}</h3>
                                        <div className={styles.companyRow}>
                                            <span>{job.company_name}</span>
                                            <span className={styles.dot} />
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                {IC.location} {job.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.metaRow}>
                                    <span className={`${styles.typeBadge} ${styles[job.type?.toLowerCase().replace(/[\s-]/g, '')] || styles.other}`}>
                                        {job.type}
                                    </span>
                                    {job.salary_min && (
                                        <span className={styles.salary}>
                                            ${(job.salary_min/1000).toFixed(0)}k - ${(job.salary_max/1000).toFixed(0)}k
                                        </span>
                                    )}
                                </div>

                                <div className={styles.cardFoot}>
                                    <span className={styles.savedDate}>
                                        {IC.clock} Saved {timeAgo === 0 ? 'today' : `${timeAgo}d ago`}
                                    </span>
                                    <div className={styles.actions}>
                                        <button 
                                            className={styles.removeBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(job.id, item.id);
                                            }}
                                        >
                                            Remove
                                        </button>
                                        {!isExpired && (
                                            <Link 
                                                href={`/browse-jobs/${job.id}`} 
                                                className={styles.applyBtn}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Apply Now
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
