"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSearch } from '@/context/SearchContext';
import { getApprovedJobs, type Job } from '@/lib/api/jobs';
import styles from './search-overlay.module.css';

const IC = {
    Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    Briefcase: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

export default function SearchOverlay() {
    const { isSearchOpen, closeSearch } = useSearch();
    const router = useRouter();
    const params = useParams();
    const inputRef = useRef<HTMLInputElement>(null);

    const [query, setQuery] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        location: '',
        experience: '',
        industry: '',
        minSalary: '',
        maxSalary: '',
        datePosted: 'all'
    });

    const fetchResults = useCallback(async () => {
        if (!query && !filters.type && !filters.location && !filters.experience && !filters.industry && !filters.minSalary && !filters.maxSalary && filters.datePosted === 'all') {
            setJobs([]);
            return;
        }
        setLoading(true);
        try {
            const results = await getApprovedJobs({
                search: query || undefined,
                type: filters.type || undefined,
                location: filters.location || undefined,
                salary_min: filters.minSalary ? Number(filters.minSalary) : undefined,
                salary_max: filters.maxSalary ? Number(filters.maxSalary) : undefined,
                industry: filters.industry || undefined,
                date_posted: filters.datePosted !== 'all' ? filters.datePosted : undefined,
            });
            setJobs(results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [query, filters]);

    useEffect(() => {
        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [fetchResults]);

    useEffect(() => {
        if (isSearchOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isSearchOpen]);

    // Handle Esc key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeSearch();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [closeSearch]);

    if (!isSearchOpen) return null;

    return (
        <div className={styles.overlay} onClick={closeSearch}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className={styles.header}>
                    <span className={styles.searchIcon}><IC.Search /></span>
                    <input 
                        ref={inputRef}
                        className={styles.input}
                        placeholder="Search jobs, skills, or companies..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button className={styles.closeBtn} onClick={closeSearch} title="Close search">
                        <IC.Close />
                    </button>
                </header>

                <div className={styles.content}>
                    {/* Sidebar filters */}
                    <aside className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Geography</label>
                            <input 
                                className={styles.textInput}
                                placeholder="City or Remote"
                                value={filters.location}
                                onChange={e => setFilters({...filters, location: e.target.value})}
                            />
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Commitment</label>
                            <select 
                                className={styles.select}
                                value={filters.type}
                                onChange={e => setFilters({...filters, type: e.target.value})}
                            >
                                <option value="">Any Type</option>
                                <option value="Full-Time">Full-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Remote">Remote</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Industry</label>
                            <select 
                                className={styles.select}
                                value={filters.industry}
                                onChange={e => setFilters({...filters, industry: e.target.value})}
                            >
                                <option value="">Any Industry</option>
                                <option value="Technology">Technology</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Finance">Finance</option>
                                <option value="Education">Education</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Travel">Travel</option>
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Salary Range (Monthly)</label>
                            <div className={styles.rangeInputs}>
                                <input 
                                    className={styles.textInput}
                                    placeholder="Min"
                                    type="number"
                                    value={filters.minSalary}
                                    onChange={e => setFilters({...filters, minSalary: e.target.value})}
                                />
                                <span className={styles.rangeDivider}>-</span>
                                <input 
                                    className={styles.textInput}
                                    placeholder="Max"
                                    type="number"
                                    value={filters.maxSalary}
                                    onChange={e => setFilters({...filters, maxSalary: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Date Posted</label>
                            <div className={styles.dateFilters}>
                                {[
                                    { id: 'all', label: 'Anytime' },
                                    { id: '24h', label: 'Last 24 hours' },
                                    { id: '7d', label: 'Last 7 days' },
                                    { id: '30d', label: 'Last 30 days' },
                                ].map(opt => (
                                    <button 
                                        key={opt.id}
                                        className={`${styles.pillBtn} ${filters.datePosted === opt.id ? styles.pillBtnActive : ''}`}
                                        onClick={() => setFilters({...filters, datePosted: opt.id})}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Experience</label>
                            <select 
                                className={styles.select}
                                value={filters.experience}
                                onChange={e => setFilters({...filters, experience: e.target.value})}
                            >
                                <option value="">Any Experience</option>
                                <option value="entry">Entry Level</option>
                                <option value="mid">Mid Level</option>
                                <option value="senior">Senior Level</option>
                            </select>
                        </div>
                        
                        <button 
                            style={{ 
                                marginTop: 'auto', background: 'none', border: 'none', 
                                color: '#3b82f6', fontWeight: 700, cursor: 'pointer',
                                textAlign: 'left', fontSize: '0.85rem'
                            }}
                             onClick={() => { setFilters({ type: '', location: '', experience: '', industry: '', minSalary: '', maxSalary: '', datePosted: 'all' }); setQuery(''); }}
                        >
                            Reset all filters
                        </button>
                    </aside>

                    {/* Results Area */}
                    <main className={styles.resultsArea}>
                        <div className={styles.resultsHeader}>
                            <span className={styles.resultsCount}>
                                {loading ? 'Searching...' : `Found ${jobs.length} relevant jobs`}
                            </span>
                        </div>

                        <div className={styles.jobList}>
                            {jobs.map(job => (
                                <div 
                                    key={job.id} 
                                    className={styles.jobCard}
                                    onClick={() => {
                                        router.push(`/dashboard/candidate/${params.role_id}/jobs/${job.id}`);
                                        closeSearch();
                                    }}
                                >
                                    <div className={styles.jobMain}>
                                        <div className={styles.companyLogo}>
                                            {job.companies?.name?.[0] || '🏢'}
                                        </div>
                                        <div>
                                            <h3 className={styles.jobTitle}>{job.title}</h3>
                                            <div className={styles.jobMeta}>
                                                {job.companies?.name} • {job.location}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={styles.badge}>{job.type}</span>
                                </div>
                            ))}

                            {!loading && jobs.length === 0 && query && (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>🔦</div>
                                    <h3>No matches found</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try adjusting your keywords or filters.</p>
                                </div>
                            )}

                            {!loading && jobs.length === 0 && !query && (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>✨</div>
                                    <h3>Ready to find your next role?</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Type something above to start your journey.</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
