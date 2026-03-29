'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './jobs.module.css';
import { BlogFeed } from '@/components/sections';
import { useAuth } from '@/lib/auth/AuthContext';

// ─── Icons ───────────────────────────────────────────────────────────────────
const Ico = {
    Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    Location: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
    Briefcase: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    Sparkle: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915Z" /></svg>,
    Heart: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    HeartFill: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    Filter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
    ChevDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
    Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    ArrowR: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>,
    More: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>,
    Share: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>,
    Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
};

const CATEGORY_CHIPS = ['All', 'Engineering', 'Design', 'Marketing', 'Product', 'Finance', 'HR'];
const POPULAR_TAGS = ['Remote Engineer', 'Product Designer', 'Marketing AI', 'Finance Lead', 'Data Scientist', 'UX Lead'];
const JOB_TYPES = ['Full-Time', 'Part-Time', 'Remote', 'Internship', 'Contract'];
const INDUSTRIES = ['Engineering', 'Finance', 'Marketing', 'Design', 'HR', 'Product', 'Operations', 'Customer Service'];
const EXP_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead'];
const COUNTRIES = ['India', 'USA'];
const DATE_OPTS = ['Last 24hrs', 'Last 7 days', 'Last 30 days'];
const JOBS_PER_PAGE = 6;

export default function BrowseJobsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [locSearch, setLocSearch] = useState('');
    const [jobType, setJobType] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [category, setCategory] = useState('All');
    const [activeTypes, setActiveTypes] = useState<string[]>([]);
    const [activeInds, setActiveInds] = useState<string[]>([]);
    const [activeExps, setActiveExps] = useState<string[]>([]);
    const [activeCountries, setActiveCountries] = useState<string[]>([]);
    const [dateFilter, setDateFilter] = useState('');
    const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchJobs() {
            try {
                const response = await fetch('/api/jobs?limit=100', { cache: 'no-store' });
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload.error || 'Failed to fetch jobs');
                }
                // Mapping fix: API returns paginated data in the 'data' field
                setJobs(payload.data || []);
            } catch (err) {
                console.error('Error fetching jobs:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchJobs();

        // Close menu on click outside
        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string) =>
        setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

    const filtered = useMemo(() => {
        return jobs.filter(j => {
            const title = j.title?.toLowerCase() || '';
            const companyName = j.company_profiles?.company_name?.toLowerCase() || '';
            const location = j.location?.toLowerCase() || '';
            const department = j.department?.toLowerCase() || '';
            if (search && !title.includes(search.toLowerCase()) && !companyName.includes(search.toLowerCase())) return false;
            if (locSearch && !location.includes(locSearch.toLowerCase())) return false;
            if (jobType && j.type !== jobType) return false;
            if (category !== 'All' && !department.includes(category.toLowerCase()) && !title.includes(category.toLowerCase())) return false;
            if (activeTypes.length && !activeTypes.includes(j.type)) return false;
            if (activeInds.length && !activeInds.includes(j.department)) return false;
            return true;
        });
    }, [jobs, search, locSearch, jobType, category, activeTypes, activeInds, activeExps, activeCountries, dateFilter]);

    const pages = Math.ceil(filtered.length / JOBS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);

    const toggleSave = useCallback((id: string) => {
        setSavedJobs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }, []);

    const handleCopyLink = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/browse-jobs/${id}`;
        navigator.clipboard.writeText(url);
        alert('Universal job link captured to clipboard!');
        setActiveMenuId(null);
    };

    const handleShare = async (e: React.MouseEvent, job: any) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/browse-jobs/${job.id}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: job.title, text: `Check out this ${job.title} role at ${job.company_profiles?.company_name}`, url });
            } catch (err) { console.log('Share aborted'); }
        } else {
            alert(`Spread the word: ${url}`);
        }
        setActiveMenuId(null);
    };

    const matchColor = (s: number) => s >= 90 ? '#059669' : s >= 80 ? '#1E88E5' : '#475569';

    if (loading) return <div className={styles.page}><p style={{ color: 'white', padding: '5rem', textAlign: 'center' }}>Loading Jobs...</p></div>;

    return (
        <main className={styles.page}>
            {/* ── HERO ── */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>Find Your Next Opportunity</h1>
                        <p className={styles.heroSub}>Browse thousands of roles matched to your skills by our AI engine.</p>

                        {/* Search Bar */}
                        <div className={styles.searchCard}>
                            <div className={styles.searchField}>
                                <Ico.Search />
                                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Job title, role, or keyword" className={styles.searchInput} />
                            </div>
                            <div className={styles.searchDivider} />
                            <div className={styles.searchField}>
                                <Ico.Location />
                                <input value={locSearch} onChange={e => { setLocSearch(e.target.value); setPage(1); }}
                                    placeholder="City or Remote" className={styles.searchInput} />
                            </div>
                            <div className={styles.searchDivider} />
                            <div className={styles.searchField}>
                                <Ico.Briefcase />
                                <select value={jobType} onChange={e => { setJobType(e.target.value); setPage(1); }} className={styles.searchSelect}>
                                    <option value="">Job Type</option>
                                    {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <button className={styles.searchBtn}><Ico.Search /> Search</button>
                        </div>

                        {/* Popular Tags */}
                        <div className={styles.popularTags}>
                            <span className={styles.popularLabel}>Popular:</span>
                            {POPULAR_TAGS.map(tag => (
                                <button key={tag} className={styles.popularTag} onClick={() => { setSearch(tag); setPage(1); }}>{tag}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── BODY ── */}
            <div className="premium-container">
                <div className={styles.body}>

                    {/* ── Sidebar ── */}
                    <>
                        {/* Mobile overlay */}
                        {filterOpen && <div className={styles.overlay} onClick={() => setFilterOpen(false)} />}
                        <aside className={`${styles.sidebar} ${filterOpen ? styles.sidebarOpen : ''}`}>
                            <div className={styles.sidebarHead}>
                                <span className={styles.sidebarTitle}><Ico.Filter /> Filters</span>
                                <button className={styles.sidebarClose} onClick={() => setFilterOpen(false)} aria-label="Close filters"><Ico.Close /></button>
                            </div>

                            <FilterGroup label="Job Type">
                                {JOB_TYPES.map(t => (
                                    <label key={t} className={styles.filterCheck}>
                                        <input type="checkbox" checked={activeTypes.includes(t)} onChange={() => { toggleArr(activeTypes, setActiveTypes, t); setPage(1); }} />
                                        <span>{t}</span>
                                    </label>
                                ))}
                            </FilterGroup>
                            <FilterGroup label="Industry">
                                {INDUSTRIES.map(i => (
                                    <label key={i} className={styles.filterCheck}>
                                        <input type="checkbox" checked={activeInds.includes(i)} onChange={() => { toggleArr(activeInds, setActiveInds, i); setPage(1); }} />
                                        <span>{i}</span>
                                    </label>
                                ))}
                            </FilterGroup>
                        </aside>
                    </>

                    {/* ── Main Content ── */}
                    <div className={styles.main}>
                        {/* Mobile filter toggle */}
                        <button className={styles.mobileFilterBtn} onClick={() => setFilterOpen(true)}><Ico.Filter /> Filters {(activeTypes.length + activeInds.length) > 0 && <span className={styles.filterCount}>{activeTypes.length + activeInds.length}</span>}</button>

                        {/* Category chips */}
                        <div className={styles.categoryRow}>
                            {CATEGORY_CHIPS.map(c => (
                                <button key={c} className={`${styles.categoryChip} ${category === c ? styles.categoryChipActive : ''}`}
                                    onClick={() => { setCategory(c); setPage(1); }}>{c}</button>
                            ))}
                        </div>

                        {/* Results header */}
                        <div className={styles.resultsHdr}>
                            <span className={styles.resultsCount}><strong>{filtered.length}</strong> jobs found</span>
                            <span className={styles.aiPill}><Ico.Sparkle /> AI Match Enabled</span>
                        </div>

                        {/* Job Cards */}
                        {paginated.length > 0 ? (
                            <div className={styles.jobGrid}>
                                {paginated.map(job => (
                                    <Link key={job.id} href={`/browse-jobs/${job.id}`} className={`${styles.jobCard} glass-card`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div className={styles.cardTop}>
                                            <div className={styles.jobLogo} style={{ background: job.company_profiles?.color || '#0D47A1' }}>{job.company_profiles?.initials || job.company_profiles?.company_name?.[0]}</div>
                                            <div className={styles.jobInfo}>
                                                <div className={styles.jobTitle}>{job.title}</div>
                                                <div className={styles.jobMeta}>
                                                    <span>{job.company_profiles?.company_name}</span>
                                                    <span className={styles.metaDot}>·</span>
                                                    <Ico.Location /><span>{job.location}</span>
                                                </div>
                                            </div>

                                            <div className={styles.actionsBox}>
                                                <button
                                                    className={`${styles.saveBtn} ${savedJobs.has(job.id) ? styles.saveBtnActive : ''}`}
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(job.id); }}
                                                    aria-label={savedJobs.has(job.id) ? 'Unsave' : 'Save job'}>
                                                    {savedJobs.has(job.id) ? <Ico.HeartFill /> : <Ico.Heart />}
                                                </button>

                                                <div className={styles.menuWrapper}>
                                                    <button
                                                        className={styles.moreBtn}
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(activeMenuId === job.id ? null : job.id); }}
                                                        aria-label="More actions">
                                                        <Ico.More />
                                                    </button>
                                                    
                                                    {activeMenuId === job.id && (
                                                        <div className={styles.dropdown} onClick={e => e.stopPropagation()}>
                                                            <button className={styles.menuItem} onClick={(e) => handleShare(e, job)}>
                                                                <Ico.Share /> Share Opportunity
                                                            </button>
                                                            <button className={styles.menuItem} onClick={(e) => handleCopyLink(e, job.id)}>
                                                                <Ico.Copy /> Duplicate Link
                                                            </button>
                                                            <div className={styles.menuDivider} />
                                                            <Link href={`/browse-jobs/${job.id}`} target="_blank" className={styles.menuItem} onClick={e => e.stopPropagation()}>
                                                                <Ico.ArrowR /> Ecosystem Intelligence
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.badgeRow}>
                                            <span className={`${styles.typeBadge} ${styles[`type_${job.type?.replace('-', '').replace(' ', '')}`]}`}>{job.type}</span>
                                            <span className={styles.salaryBadge}>{job.salary}</span>
                                            {job.ai_match_rate >= 80 && (
                                                <span className={styles.matchBadge} style={{ color: matchColor(job.ai_match_rate) }}>
                                                    <Ico.Sparkle /> {job.ai_match_rate}% Match
                                                </span>
                                            )}
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <span className={styles.postedMeta}><Ico.Clock />{job.posted_days || 0} days ago</span>
                                            <div className={styles.cardActions}>
                                                <span className={styles.applyBtn} onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    if (!user) {
                                                        router.push('/signup');
                                                    } else {
                                                        router.push(`/browse-jobs/${job.id}`);
                                                    }
                                                }}>
                                                    Quick Apply
                                                </span>
                                                <span className={styles.viewBtn}>View <Ico.ArrowR /></span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h3 className={styles.emptyTitle}>No exact matches found</h3>
                                <p className={styles.emptyDesc}>Try adjusting your filters or search terms.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {pages > 1 && (
                            <div className={styles.pagination}>
                                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                                        onClick={() => setPage(p)}>{p}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <BlogFeed />
        </main>
    );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div className={styles.filterGroup}>
            <button className={styles.filterGroupHdr} onClick={() => setOpen(o => !o)}>
                <span>{label}</span>
                <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
            </button>
            {open && <div className={styles.filterGroupBody}>{children}</div>}
        </div>
    );
}
