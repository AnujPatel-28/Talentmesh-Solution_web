"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../candidate.module.css';

/* ─── Icons ─── */
const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    mapPin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    dollar: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    briefcase: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    alert: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    bookmark: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    clock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    cal: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
};

import { getApprovedJobs, type Job } from '@/lib/api/jobs';
import { getMyApplications, checkAlreadyApplied, type ApplicationStatus } from '@/lib/api/applications';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatDistanceToNow } from 'date-fns';

/** ─── Helpers ─── */
const formatSalary = (min: number | null, max: number | null, currency: string = 'INR') => {
    if (!min && !max) return 'Competitive';
    const symbol = currency === 'USD' ? '$' : '₹';
    const kMin = min ? `${(min / 1000).toFixed(0)}K` : '';
    const kMax = max ? `${(max / 1000).toFixed(0)}K` : '';
    if (kMin && kMax) return `${symbol}${kMin}–${symbol}${kMax}`;
    return kMin ? `${symbol}${kMin}+` : `${symbol}${kMax}`;
};

const formatDate = (date: string) => {
    try {
        const d = new Date(date);
        const dist = formatDistanceToNow(d, { addSuffix: true });
        return dist.replace('about ', '').replace('less than a minute ago', 'just now');
    } catch {
        return 'recently';
    }
};

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const getBrandColor = (id: string) => COLORS[id.charCodeAt(0) % COLORS.length];

export default function JobsPage() {

    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [location, setLocation] = useState('');

    // Fetch user applications to show "Applied" badges
    const fetchAppliedIds = async () => {
        if (!user) return;
        try {
            const apps = await getMyApplications();
            setAppliedIds(new Set(apps.map(a => a.job_id)));
        } catch (err: any) {
            // Silently fail - badge won't show but jobs still load
            // This handles JWT expiry / token errors gracefully
            console.warn('Could not fetch applied IDs (non-critical):', err?.message);
        }
    };

    const fetchJobsList = async (pageNum: number, isNewSearch: boolean = false) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            const results = await getApprovedJobs({
                search: search || undefined,
                type: type || undefined,
                location: location || undefined,
                page: pageNum
            });

            if (isNewSearch) {
                setJobs(results);
            } else {
                setJobs(prev => [...prev, ...results]);
            }

            setHasMore(results.length === 20);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Initial load
    React.useEffect(() => {
        if (user) {
            fetchAppliedIds();
        }
    }, [user]);

    // Handle filters with debounce for search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchJobsList(0, true);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, type, location]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchJobsList(next, false);
    };

    const clearFilters = () => {
        setSearch('');
        setType('');
        setLocation('');
    };

    const typeOptions = ['Full-time', 'Contract', 'Remote', 'Internship'];

    if (error) {
        return (
            <div className={styles.jobsPage}>
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                    <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Failed to load jobs</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
                    <button className={styles.applyBtn} onClick={() => fetchJobsList(0, true)}>Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.jobsPage}>
            <div className={styles.searchRow}>
                <div className={styles.searchBarFull}>
                    {IC.search}
                    <input 
                        placeholder="Search job title, keyword, or company" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {typeOptions.map(t => (
                        <button 
                            key={t}
                            className={`${styles.filterBtn} ${type === t ? styles.filterBtnActive : ''}`}
                            onClick={() => setType(type === t ? '' : t)}
                        >
                            {t}
                        </button>
                    ))}
                    <input 
                        className={styles.filterBtn}
                        style={{ outline: 'none', width: '140px' }}
                        placeholder="Location..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {loading ? 'Finding jobs...' : `Recommended for You (${jobs.length})`}
                </h2>
                <Link href="/dashboard/candidate/saved" style={{ textDecoration: 'none' }}>
                    <span className={styles.matchBadge} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', background: '#f8fafc', color: '#64748b' }}>
                        {IC.bookmark} Saved Jobs
                    </span>
                </Link>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={styles.jobListCard} style={{ height: 200, background: '#f8fafc', border: 'none', opacity: 0.6 }} />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                    <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>No jobs found</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try adjusting your search or filters to find what you're looking for.</p>
                    {(search || type || location) && (
                        <button className={styles.filterBtn} onClick={clearFilters} style={{ margin: '0 auto' }}>Clear All Filters</button>
                    )}
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                        {jobs.map((j) => (
                            <Link key={j.id} href={`/dashboard/candidate/jobs/${j.id}`} style={{ textDecoration: 'none' }}>
                                <div className={styles.jobListCard} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.2rem', gap: '1rem', borderRadius: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        {j.companies?.logo_url ? (
                                            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                                <img src={j.companies.logo_url} alt={j.companies.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            <div className={styles.jobListIcon} style={{ background: getBrandColor(j.companies?.name || 'A') + '18', color: getBrandColor(j.companies?.name || 'A'), width: 44, height: 44, fontSize: '1rem' }}>
                                                {getInitials(j.companies?.name || 'Comp')}
                                            </div>
                                        )}
                                        {appliedIds.has(j.id) ? (
                                            <span className={styles.matchBadge} style={{ background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                {IC.check} Applied
                                            </span>
                                        ) : (
                                            <span className={styles.matchBadge} style={{ background: '#eff6ff', color: 'var(--primary-blue)' }}>Apply Now</span>
                                        )}
                                    </div>

                                    <div className={styles.jobListBody}>
                                        <span className={styles.jobListTitle} style={{ fontSize: '1rem' }}>{j.title}</span>
                                        <span className={styles.jobListCompany} style={{ fontSize: '0.8rem', marginTop: 4 }}>
                                            {j.companies?.name} · {j.location}
                                        </span>
                                        <div className={styles.jobListMeta} style={{ marginTop: '0.8rem', gap: '0.5rem' }}>
                                            <span className={styles.jobListTag} style={{ background: '#f0fdf4', color: '#166534', padding: '0.3rem 0.6rem', fontSize: '0.65rem' }}>
                                                {IC.dollar} {formatSalary(j.salary_min, j.salary_max, j.currency)}
                                            </span>
                                            <span className={styles.jobListTag} style={{ background: '#f8fafc', padding: '0.3rem 0.6rem', fontSize: '0.65rem' }}>
                                                {IC.briefcase} {j.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            {Array.isArray((j as any).skills_required) && (j as any).skills_required.slice(0, 2).map((s: string) => (
                                                <span key={s} className={styles.jobListTag} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.15rem 0.4rem' }}>
                                                    {s}
                                                </span>
                                            ))}
                                            <span className={styles.jobTime} style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                {IC.clock} {formatDate(j.created_at)}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            Details <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {hasMore && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                            <button 
                                className={styles.applyBtn} 
                                onClick={handleLoadMore} 
                                disabled={loadingMore}
                                style={{ background: '#ffffff', color: 'var(--primary-blue)', border: '1.5px solid #e2e8f0', boxShadow: 'none' }}
                            >
                                {loadingMore ? 'Loading...' : 'Load More Jobs'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
