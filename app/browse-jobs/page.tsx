'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './jobs.module.css';

import { useAuth } from '@/lib/auth/AuthContext';
import { invokeFunction } from '@/lib/insforge';
import { SectionHeader } from '@/components/ui';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import { CustomSelect } from '@/components/ui/CustomSelect';

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

// Helper functions for frontend job formatting
function getPostedDays(createdAt?: string | null) {
    if (!createdAt) return 0;
    const createdTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdTime)) return 0;
    return Math.max(0, Math.floor((Date.now() - createdTime) / 86400000));
}

function formatSalary(min?: number | null, max?: number | null, currency?: string | null) {
    if (!min && !max) return 'Competitive';
    const symbol = currency === 'USD' ? '$' : '₹';
    if (min && max) {
        const formatVal = (v: number) => {
            if (currency !== 'USD' && v >= 100000) {
                return `${v / 100000}L`;
            }
            return v.toLocaleString();
        };
        return `${symbol}${formatVal(min)} - ${symbol}${formatVal(max)}`;
    }
    if (min) return `${symbol}${min.toLocaleString()}+`;
    return `${symbol}${(max || 0).toLocaleString()}`;
}

function getInitials(name?: string | null) {
    if (!name) return 'TM';
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function getBrandColor(seed: string) {
    const palette = ['#0D47A1', '#1565C0', '#1E88E5', '#42A5F5', '#0F766E', '#D97706'];
    const index = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0) % palette.length;
    return palette[index];
}

function cleanString(s: string) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
    const [activeLocTypes, setActiveLocTypes] = useState<string[]>([]);
    const [dateFilter, setDateFilter] = useState('');
    const [sortBy, setSortBy] = useState('Most Relevant');
    const [jobsPerPage, setJobsPerPage] = useState(6);

    const { isSaved, toggleSave } = useSavedJobs(user?.id || null);
    const [page, setPage] = useState(1);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchJobs(attempt = 1) {
            try {
                const { data, error } = await invokeFunction('jobs', {
                    method: 'GET',
                    queries: { limit: '100' }
                });

                if (error) {
                    throw new Error(error.message || 'Failed to fetch jobs');
                }

                const rawJobs = data?.data || data || [];
                const formatted = rawJobs.map((j: any) => {
                    const company = j.company_profiles || j.companies || {};
                    const companyName = company.company_name || company.name || 'TalentMesh Company';
                    const brandColor = getBrandColor(companyName);
                    
                    return {
                        ...j,
                        type: j.type || 'Full-Time',
                        location: j.location || 'Remote',
                        department: j.department || 'Engineering',
                        salary: formatSalary(j.salary_min, j.salary_max, j.currency),
                        posted_days: getPostedDays(j.created_at),
                        ai_match_rate: j.ai_match_rate || 85,
                        skills_required: j.skills_required || ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
                        is_new: getPostedDays(j.created_at) <= 2,
                        company_profiles: {
                            id: company.id || j.company_id || null,
                            company_name: companyName,
                            logo_url: company.logo_url || null,
                            industry: company.industry || null,
                            about: company.about || null,
                            website: company.website || null,
                            initials: getInitials(companyName),
                            color: brandColor,
                        }
                    };
                });
                setJobs(formatted);
            } catch (err) {
                console.error(`Error fetching jobs (attempt ${attempt}):`, err);
                if (attempt < 2) {
                    // Retry once after a short delay (handles cold-start timeouts)
                    await new Promise(r => setTimeout(r, 1500));
                    return fetchJobs(attempt + 1);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchJobs();

        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string) =>
        setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

    // Dynamic counts
    const counts = useMemo(() => {
        const jobTypeCounts: Record<string, number> = {};
        const expCounts: Record<string, number> = {};
        const locTypeCounts: Record<string, number> = { 'Remote': 0, 'Hybrid': 0, 'On-site': 0 };
        const indCounts: Record<string, number> = {};
        const categoryCounts: Record<string, number> = { 'All': jobs.length };

        jobs.forEach(j => {
            if (j.type) {
                const matchedType = JOB_TYPES.find(t => cleanString(t) === cleanString(j.type));
                if (matchedType) {
                    jobTypeCounts[matchedType] = (jobTypeCounts[matchedType] || 0) + 1;
                }
            }
            const exp = j.exp || j.experience_level || 'Mid';
            const matchedExp = EXP_LEVELS.find(el => cleanString(el) === cleanString(exp));
            if (matchedExp) {
                expCounts[matchedExp] = (expCounts[matchedExp] || 0) + 1;
            }
            const loc = (j.location || '').toLowerCase();
            if (loc.includes('remote')) locTypeCounts['Remote']++;
            else if (loc.includes('hybrid')) locTypeCounts['Hybrid']++;
            else locTypeCounts['On-site']++;
            
            if (j.department) {
                const matchedInd = INDUSTRIES.find(i => cleanString(i) === cleanString(j.department));
                if (matchedInd) {
                    indCounts[matchedInd] = (indCounts[matchedInd] || 0) + 1;
                }
            }
            
            CATEGORY_CHIPS.forEach(c => {
                if (c === 'All') return;
                const dept = j.department?.toLowerCase() || '';
                const title = j.title?.toLowerCase() || '';
                if (dept.includes(c.toLowerCase()) || title.includes(c.toLowerCase())) {
                    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
                }
            });
        });

        return { jobTypeCounts, expCounts, locTypeCounts, indCounts, categoryCounts };
    }, [jobs]);

    const filtered = useMemo(() => {
        return jobs.filter(j => {
            const title = j.title?.toLowerCase() || '';
            const company = j.company_profiles || j.companies || {};
            const companyName = (company.company_name || company.name || '').toLowerCase();
            const location = j.location?.toLowerCase() || '';
            const department = j.department?.toLowerCase() || '';
            const exp = j.exp || j.experience_level || 'Mid';
            
            if (search && !title.includes(search.toLowerCase()) && !companyName.includes(search.toLowerCase())) return false;
            if (locSearch && !location.includes(locSearch.toLowerCase())) return false;
            if (jobType && cleanString(j.type) !== cleanString(jobType)) return false;
            if (category !== 'All' && !department.includes(category.toLowerCase()) && !title.includes(category.toLowerCase())) return false;
            if (activeTypes.length && !activeTypes.some(t => cleanString(t) === cleanString(j.type))) return false;
            if (activeInds.length && !activeInds.some(i => cleanString(i) === cleanString(j.department))) return false;
            if (activeExps.length && !activeExps.some(el => cleanString(el) === cleanString(exp))) return false;
            
            if (activeLocTypes.length) {
                const locLower = location.toLowerCase();
                const matches = activeLocTypes.some(t => {
                    if (t === 'Remote') return locLower.includes('remote');
                    if (t === 'Hybrid') return locLower.includes('hybrid');
                    if (t === 'On-site') return !locLower.includes('remote') && !locLower.includes('hybrid');
                    return false;
                });
                if (!matches) return false;
            }
            
            return true;
        });
    }, [jobs, search, locSearch, jobType, category, activeTypes, activeInds, activeExps, activeLocTypes]);

    const sorted = useMemo(() => {
        const list = [...filtered];
        if (sortBy === 'Most Relevant') {
            list.sort((a, b) => (b.ai_match_rate || 85) - (a.ai_match_rate || 85));
        } else if (sortBy === 'Newest') {
            list.sort((a, b) => (a.posted_days || 0) - (b.posted_days || 0));
        } else if (sortBy === 'Salary (High-Low)') {
            const parseVal = (s: string) => {
                const num = parseFloat(s.replace(/[^0-9.]/g, ''));
                return isNaN(num) ? 0 : num;
            };
            list.sort((a, b) => parseVal(b.salary || '') - parseVal(a.salary || ''));
        }
        return list;
    }, [filtered, sortBy]);

    const pages = Math.ceil(filtered.length / jobsPerPage);
    const paginated = sorted.slice((page - 1) * jobsPerPage, page * jobsPerPage);

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
        const company = job.company_profiles || job.companies || {};
        const companyName = company.company_name || company.name || 'TalentMesh Company';
        if (navigator.share) {
            try {
                await navigator.share({ title: job.title, text: `Check out this ${job.title} role at ${companyName}`, url });
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
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>Find your next role</h1>
                        <p className={styles.heroSub}>
                            Search thousands of jobs in tech, design, and engineering across top companies.
                        </p>

                        <div className={styles.searchCard}>
                            <div className={styles.searchField}>
                                <Ico.Search />
                                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Job title, keywords, or company" className={styles.searchInput} />
                            </div>
                            <div className={styles.searchField}>
                                <Ico.Location />
                                <input value={locSearch} onChange={e => { setLocSearch(e.target.value); setPage(1); }}
                                    placeholder="City, state, or remote" className={styles.searchInput} />
                            </div>
                            <div className={styles.searchField}>
                                <Ico.Briefcase />
                                <CustomSelect
                                    value={jobType}
                                    onChange={e => { setJobType(e.target.value); setPage(1); }}
                                    className={styles.searchSelect}
                                    options={JOB_TYPES}
                                    placeholder="All Job Types"
                                />
                            </div>
                            <button className={styles.searchBtn}>Search Jobs</button>
                        </div>

                        <div className={styles.popularTags}>
                            <span className={styles.popularLabel}>Popular searches:</span>
                            {POPULAR_TAGS.map(tag => (
                                <button key={tag} className={styles.popularTag} onClick={() => { setSearch(tag); setPage(1); }}>{tag}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="premium-container">
                <div className={styles.body}>
                    <>
                        {filterOpen && <div className={styles.overlay} onClick={() => setFilterOpen(false)} />}
                        <aside className={`${styles.sidebar} ${filterOpen ? styles.sidebarOpen : ''}`}>
                            <div className={styles.sidebarHead}>
                                <span className={styles.sidebarTitle}><Ico.Filter /> Filters</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {(activeTypes.length + activeInds.length + activeExps.length + activeLocTypes.length) > 0 && (
                                        <button className={styles.clearAllBtn} onClick={() => { setActiveTypes([]); setActiveInds([]); setActiveExps([]); setActiveLocTypes([]); setPage(1); }}>Clear all</button>
                                    )}
                                    <button className={styles.sidebarClose} onClick={() => setFilterOpen(false)} aria-label="Close filters"><Ico.Close /></button>
                                </div>
                            </div>

                            <FilterGroup label="Job Type">
                                {JOB_TYPES.map(t => {
                                    const count = counts.jobTypeCounts[t] || 0;
                                    return (
                                        <label key={t} className={styles.filterCheck}>
                                            <div className={styles.filterCheckLeft}>
                                                <input type="checkbox" checked={activeTypes.includes(t)} onChange={() => { toggleArr(activeTypes, setActiveTypes, t); setPage(1); }} />
                                                <span>{t}</span>
                                            </div>
                                            <span className={styles.filterCountLabel}>{count}</span>
                                        </label>
                                    );
                                })}
                            </FilterGroup>

                            <FilterGroup label="Experience Level">
                                {EXP_LEVELS.map(el => {
                                    const count = counts.expCounts[el] || 0;
                                    return (
                                        <label key={el} className={styles.filterCheck}>
                                            <div className={styles.filterCheckLeft}>
                                                <input type="checkbox" checked={activeExps.includes(el)} onChange={() => { toggleArr(activeExps, setActiveExps, el); setPage(1); }} />
                                                <span>{el} Level</span>
                                            </div>
                                            <span className={styles.filterCountLabel}>{count}</span>
                                        </label>
                                    );
                                })}
                            </FilterGroup>

                            <FilterGroup label="Location Type">
                                {['Remote', 'Hybrid', 'On-site'].map(lt => {
                                    const count = counts.locTypeCounts[lt] || 0;
                                    return (
                                        <label key={lt} className={styles.filterCheck}>
                                            <div className={styles.filterCheckLeft}>
                                                <input type="checkbox" checked={activeLocTypes.includes(lt)} onChange={() => { toggleArr(activeLocTypes, setActiveLocTypes, lt); setPage(1); }} />
                                                <span>{lt}</span>
                                            </div>
                                            <span className={styles.filterCountLabel}>{count}</span>
                                        </label>
                                    );
                                })}
                            </FilterGroup>

                            <FilterGroup label="Industry">
                                {INDUSTRIES.slice(0, 5).map(i => {
                                    const count = counts.indCounts[i] || 0;
                                    return (
                                        <label key={i} className={styles.filterCheck}>
                                            <div className={styles.filterCheckLeft}>
                                                <input type="checkbox" checked={activeInds.includes(i)} onChange={() => { toggleArr(activeInds, setActiveInds, i); setPage(1); }} />
                                                <span>{i}</span>
                                            </div>
                                            <span className={styles.filterCountLabel}>{count}</span>
                                        </label>
                                    );
                                })}
                            </FilterGroup>
                        </aside>
                    </>

                    <div className={styles.main}>
                        <button className={styles.mobileFilterBtn} onClick={() => setFilterOpen(true)}><Ico.Filter /> Filters {(activeTypes.length + activeInds.length + activeExps.length + activeLocTypes.length) > 0 && <span className={styles.filterCount}>{activeTypes.length + activeInds.length + activeExps.length + activeLocTypes.length}</span>}</button>

                        <div className={styles.categoryRow}>
                            {CATEGORY_CHIPS.map(c => {
                                const count = counts.categoryCounts[c] || 0;
                                return (
                                    <button key={c} className={`${styles.categoryChip} ${category === c ? styles.categoryChipActive : ''}`}
                                        onClick={() => { setCategory(c); setPage(1); }}>
                                        {c} <span className={styles.chipCount}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.resultsHdr}>
                            <div className={styles.resultsHdrLeft}>
                                <span className={styles.resultsCount}><strong>{filtered.length}</strong> opportunities found</span>
                                <span className={styles.updatedDailyDot}>• Updated daily</span>
                            </div>
                            <div className={styles.resultsHdrRight}>
                                <div className={styles.sortContainer}>
                                    <span className={styles.sortLabel}>Sort by</span>
                                    <CustomSelect
                                        value={sortBy}
                                        onChange={e => { setSortBy(e.target.value); setPage(1); }}
                                        className={styles.sortSelect}
                                        options={['Most Relevant', 'Newest', 'Salary (High-Low)']}
                                        placeholder="Sort by"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {paginated.length > 0 ? (
                            <div className={styles.jobGrid}>
                                {paginated.map(job => {
                                    const saved = isSaved(job.id);
                                    const company = job.company_profiles || job.companies || {};
                                    const companyName = company.company_name || company.name || 'TalentMesh Company';
                                    const companyColor = company.color || '#0D47A1';
                                    const companyInitials = company.initials || companyName?.[0] || 'TM';
                                    return (
                                        <Link key={job.id} href={`/browse-jobs/${job.id}`} className={styles.jobCard} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className={styles.jobLogo} style={{ background: companyColor }}>
                                                {companyInitials}
                                            </div>

                                            <div className={styles.jobContentArea}>
                                                <div className={styles.jobTitleRow}>
                                                    <span className={styles.jobTitleText}>{job.title}</span>
                                                    {(job.posted_days <= 1 || job.is_new) && (
                                                        <span className={styles.newBadge}>New</span>
                                                    )}
                                                </div>

                                                <div className={styles.companyRow}>
                                                    <span className={styles.companyNameText}>{companyName}</span>
                                                    <svg className={styles.verifiedIcon} width="14" height="14" viewBox="0 0 24 24" fill="#2563EB" style={{ flexShrink: 0 }}>
                                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                    </svg>
                                                </div>

                                                <div className={styles.metaRow}>
                                                    <div className={styles.metaItem}>
                                                        <Ico.Location />
                                                        <span>{job.location}</span>
                                                    </div>
                                                    <div className={styles.metaItem}>
                                                        <Ico.Briefcase />
                                                        <span>{job.type}</span>
                                                    </div>
                                                    <div className={styles.metaItem}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                                        <span>{job.salary}</span>
                                                    </div>
                                                    <div className={styles.metaItem}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                        <span>{job.posted_days === 0 ? 'Today' : `${job.posted_days}d ago`}</span>
                                                    </div>
                                                </div>

                                                <div className={styles.techTagsRow}>
                                                    {(job.skills_required && job.skills_required.length > 0 ? job.skills_required : ['React', 'Next.js', 'TypeScript', 'Tailwind CSS']).slice(0, 4).map((tag: string) => (
                                                        <span key={tag} className={styles.techTag}>{tag}</span>
                                                    ))}
                                                    {(job.skills_required && job.skills_required.length > 4) && (
                                                        <span className={styles.techTag}>+{job.skills_required.length - 4}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={styles.jobActionsArea}>
                                                <button
                                                    className={`${styles.cardHeartBtn} ${saved ? styles.cardHeartBtnActive : ''}`}
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(job.id); }}
                                                    aria-label={saved ? 'Unsave' : 'Save job'}>
                                                    {saved ? <Ico.HeartFill /> : <Ico.Heart />}
                                                </button>
                                                
                                                <span className={styles.viewJobOutlineBtn} onClick={(e) => {
                                                    e.preventDefault();
                                                    if (!user) {
                                                        router.push('/signup');
                                                    } else {
                                                        router.push(`/browse-jobs/${job.id}`);
                                                    }
                                                }}>
                                                    View Job <Ico.ArrowR />
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h3 className={styles.emptyTitle}>No exact matches found</h3>
                                <p className={styles.emptyDesc}>Try adjusting your filters or search terms.</p>
                            </div>
                        )}

                        {pages > 1 && (
                            <div className={styles.pagination}>
                                <button className={styles.pageArrowBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lt;</button>
                                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                                        onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className={styles.pageArrowBtn} onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>&gt;</button>
                                
                                <div className={styles.pageSizeSelector}>
                                    <span>Show</span>
                                    <CustomSelect
                                        value={String(jobsPerPage)}
                                        onChange={e => { setJobsPerPage(Number(e.target.value)); setPage(1); }}
                                        className={styles.pageSizeSelect}
                                        options={['6', '12', '24']}
                                        placeholder="6"
                                        required
                                    />
                                    <span>per page</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
