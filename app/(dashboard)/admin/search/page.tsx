'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@insforge/sdk';
import styles from './search.module.css';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || ''
});

interface SearchResult {
    type: 'candidate' | 'recruiter' | 'job' | 'company' | 'application';
    id: string;
    title: string;
    subtitle: string;
    avatar?: string;
    status?: string;
    date?: string;
}

const CATEGORIES = ['All', 'Candidates', 'Recruiters', 'Jobs', 'Companies', 'Applications'];

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const q = searchParams.get('q') || '';
    
    const [query, setQuery] = useState(q);
    const [activeCategory, setActiveCategory] = useState('All');
    const [results, setResults] = useState<{ [key: string]: SearchResult[] }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [counts, setCounts] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        setQuery(q);
        if (q) performFullSearch(q);
    }, [q]);

    const performFullSearch = useCallback(async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const [candidates, recruiters, jobs, companies, applications] = await Promise.all([
                // Candidates
                insforge.database.from('profiles')
                    .select('id, name, email, avatar_url, created_at')
                    .eq('role', 'candidate')
                    .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                    .limit(10),
                
                // Recruiters
                insforge.database.from('profiles')
                    .select('id, name, email, created_at, recruiter_profiles(companies(name))')
                    .eq('role', 'recruiter')
                    .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                    .limit(10),
                
                // Jobs
                insforge.database.from('jobs')
                    .select('id, title, status, created_at, companies(name)')
                    .or(`title.ilike.%${searchQuery}%,companies.name.ilike.%${searchQuery}%`)
                    .limit(10),
                
                // Companies
                insforge.database.from('companies')
                    .select('id, name, logo_url, created_at')
                    .ilike('name', `%${searchQuery}%`)
                    .limit(10),
                
                // Applications
                insforge.database.from('applications')
                    .select('id, status, created_at, profiles(name), jobs(title)')
                    .or(`profiles.name.ilike.%${searchQuery}%,jobs.title.ilike.%${searchQuery}%`)
                    .limit(10)
            ]);

            const mappedResults: { [key: string]: SearchResult[] } = {
                Candidates: (candidates.data || []).map((c: any) => ({
                    type: 'candidate',
                    id: c.id,
                    title: c.name,
                    subtitle: c.email,
                    avatar: c.avatar_url,
                    date: c.created_at
                })),
                Recruiters: (recruiters.data || []).map((r: any) => ({
                    type: 'recruiter',
                    id: r.id,
                    title: r.name,
                    subtitle: r.recruiter_profiles?.companies?.name || r.email,
                    date: r.created_at
                })),
                Jobs: (jobs.data || []).map((j: any) => ({
                    type: 'job',
                    id: j.id,
                    title: j.title,
                    subtitle: j.companies?.name || 'Unknown Company',
                    status: j.status,
                    date: j.created_at
                })),
                Companies: (companies.data || []).map((c: any) => ({
                    type: 'company',
                    id: c.id,
                    title: c.name,
                    avatar: c.logo_url,
                    subtitle: 'Company',
                    date: c.created_at
                })),
                Applications: (applications.data || []).map((a: any) => ({
                    type: 'application',
                    id: a.id,
                    title: a.profiles?.name || 'Applicant',
                    subtitle: a.jobs?.title || 'Job Application',
                    status: a.status,
                    date: a.created_at
                }))
            };

            setResults(mappedResults);
            
            const newCounts = Object.keys(mappedResults).reduce((acc: any, key) => {
                acc[key] = mappedResults[key].length;
                return acc;
            }, {});
            setCounts(newCounts);
        } catch (error) {
            console.error('Full Search Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/dashboard/admin/search?q=${encodeURIComponent(query)}`);
    };

    const totalResults = Object.values(counts).reduce((a, b) => a + b, 0);

    const renderSection = (title: string, items: SearchResult[]) => {
        if (activeCategory !== 'All' && activeCategory !== title) return null;
        if (items.length === 0) return null;

        return (
            <section key={title} className={styles.section}>
                <div className={styles.sectionTitle}>
                    <span>{title} ({counts[title] || 0})</span>
                    <a href={`/dashboard/admin/${title.toLowerCase()}`} className={styles.viewAll}>
                        View all {title} →
                    </a>
                </div>
                <div className={styles.grid}>
                    {items.map((item) => (
                        <div 
                            key={`${item.type}-${item.id}`} 
                            className={styles.card}
                            onClick={() => router.push(`/dashboard/admin/${item.type}s/${item.id}`)}
                        >
                            <div className={styles.cardAvatar}>
                                {item.avatar ? (
                                    <img src={item.avatar} alt={item.title} />
                                ) : (
                                    item.title.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className={styles.cardContent}>
                                <span className={styles.cardTitle}>{item.title}</span>
                                <span className={styles.cardSubtitle}>{item.subtitle}</span>
                                {item.status && (
                                    <span style={{ 
                                        fontSize: '0.7rem', 
                                        fontWeight: 700, 
                                        color: item.status === 'active' || item.status === 'open' ? '#059669' : '#dc2626',
                                        textTransform: 'uppercase',
                                        marginTop: '4px',
                                        display: 'block'
                                    }}>
                                        {item.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {items.length >= 10 && (
                    <button className={styles.loadMore}>Load more {title}</button>
                )}
            </section>
        );
    };

    return (
        <div className={styles.container}>
            <header className={styles.searchHeader}>
                <form onSubmit={handleSearch} className={styles.searchBox}>
                    <svg className={styles.searchIconLarge} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <input 
                        type="text" 
                        className={styles.searchInput}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search candidates, recruiters, jobs..."
                    />
                </form>

                <div className={styles.filters}>
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat}
                            className={`${styles.filterChip} ${activeCategory === cat ? styles.filterChipActive : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className={styles.resultsMeta}>
                    {isLoading ? 'Searching...' : `Showing ${totalResults} results for "${q}"`}
                </div>
            </header>

            <div className={styles.resultsGrid}>
                {isLoading ? (
                    <div className={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={styles.skeletonCard}></div>
                        ))}
                    </div>
                ) : totalResults > 0 ? (
                    Object.entries(results).map(([title, items]) => renderSection(title, items))
                ) : q ? (
                    <div className={styles.emptyState}>
                        <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <h2 className={styles.emptyTitle}>No results for "{q}"</h2>
                        <p className={styles.emptyDesc}>Try searching for a name, email, or job title.</p>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h2 className={styles.emptyTitle}>Universal Search</h2>
                        <p className={styles.emptyDesc}>Type a query above to search across the entire platform.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading Search...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}
