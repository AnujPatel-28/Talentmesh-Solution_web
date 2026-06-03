"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './candidates.module.css';
import { invokeFunction } from '@/lib/insforge';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
import CandidateProfileDrawer from '@/components/recruiter/CandidateProfileDrawer';
import { toast } from 'react-hot-toast';

const IC = {
    mapPin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    nvite: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
    search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    tag: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2H2v10l9.29 9.29c.39.39 1.02.39 1.41 0l7.59-7.59c.39-.39.39-1.02 0-1.41L12 2z" /><path d="M7 7h.01" /></svg>,
    location: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
};

export default function CandidatesPage() {
    const params = useParams();
    const roleId = params.role_id as string;

    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const fetching = useRef(false);

    // Advanced Search Specifications State
    const [searchQuery, setSearchQuery] = useState('');
    const [skillsQuery, setSkillsQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');

    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

    // Extract individual keywords for dynamic highlighting
    const getKeywords = () => {
        const list: string[] = [];
        if (searchQuery) {
            list.push(...searchQuery.split(/\s+/).filter(Boolean));
        }
        if (skillsQuery) {
            // Split by comma or space
            list.push(...skillsQuery.split(/[\s,]+/).filter(Boolean));
        }
        if (locationQuery) {
            list.push(...locationQuery.split(/\s+/).filter(Boolean));
        }
        // Deduplicate and filter out short terms (<2 chars) to avoid highlight noise
        return Array.from(new Set(list.map(w => w.trim()).filter(w => w.length >= 2)));
    };

    const keywords = getKeywords();

    const fetchCandidates = async (pageNum: number, isNewSearch = false) => {
        if (fetching.current) return;
        fetching.current = true;
        
        try {
            const currentQuery: any = { 
                page: pageNum.toString(),
                search: searchQuery,
                location: locationQuery
            };
            if (skillsQuery) {
                // Comma separated list of skills
                currentQuery.skills = skillsQuery.split(/[\s,]+/).filter(Boolean).join(',');
            }

            const { data, error } = await invokeFunction('candidates', {
                method: 'GET',
                queries: currentQuery
            });

            if (error) {
                console.error('Error fetching candidates:', error);
                toast.error('Failed to search candidates');
                return;
            }

            if (data) {
                setCandidates(prev => isNewSearch ? data.data : [...prev, ...data.data]);
                setHasMore(data.hasMore);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
            fetching.current = false;
        }
    };

    // Trigger debounced search when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchCandidates(0, true);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, skillsQuery, locationQuery]);

    // Yellow highlighting helper component
    function HighlightText({ text }: { text: string }) {
        if (!text || keywords.length === 0) return <>{text}</>;

        // Escape regex special chars in keywords
        const escaped = keywords
            .map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
            .filter(Boolean);

        if (escaped.length === 0) return <>{text}</>;

        const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
        const parts = text.split(regex);

        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <mark key={i} className={styles.highlight}>{part}</mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    }

    // Check if tag/skill should be highlighted in yellow
    const isTagHighlighted = (skill: string) => {
        return keywords.some(kw => skill.toLowerCase().includes(kw.toLowerCase()));
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSkillsQuery('');
        setLocationQuery('');
    };

    if (loading && page === 0 && candidates.length === 0) return <HomeSkeleton />;

    return (
        <div className={styles.candPage}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>HighlightMatch Specification Search</h1>
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                    {candidates.length} Candidate{candidates.length !== 1 ? 's' : ''} Found
                </span>
            </div>

            {/* Premium Interactive Advanced Search Inputs */}
            <div className={styles.searchSection}>
                <div className={styles.searchGroup}>
                    {IC.search}
                    <input 
                        type="text" 
                        placeholder="Search name, skills, title or location..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.searchGroup}>
                    {IC.tag}
                    <input 
                        type="text" 
                        placeholder="Filter skills (e.g. React, Node)..." 
                        value={skillsQuery}
                        onChange={(e) => setSkillsQuery(e.target.value)}
                    />
                </div>
                <div className={styles.searchGroup}>
                    {IC.location}
                    <input 
                        type="text" 
                        placeholder="Search location..." 
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                    />
                </div>
                {(searchQuery || skillsQuery || locationQuery) && (
                    <button className={styles.clearSearchBtn} onClick={handleClearFilters}>
                        Reset Filters
                    </button>
                )}
            </div>

            {/* Candidate Results Grid */}
            <div className={styles.candGrid}>
                {candidates.length > 0 ? candidates.map((c, i) => (
                    <div key={c.id || i} className={styles.candFullCard} onClick={() => setSelectedCandidateId(c.id)} style={{ cursor: 'pointer' }}>
                        <div className={styles.candFullHead}>
                            <div className={styles.candFullAvatar}>
                                {c.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                                <div className={styles.candFullName}>
                                    <HighlightText text={c.name} />
                                </div>
                                <div className={styles.candFullRole}>
                                    <HighlightText text={c.role} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.candFullTags}>
                            {c.skills.slice(0, 4).map((s: string) => (
                                <span 
                                    key={s} 
                                    className={`${styles.candFullTag} ${isTagHighlighted(s) ? styles.highlightedTag : ''}`}
                                >
                                    {isTagHighlighted(s) ? <HighlightText text={s} /> : s}
                                </span>
                            ))}
                            {c.skills.length > 4 && (
                                <span className={styles.candFullTag} style={{ background: '#f1f5f9', borderStyle: 'dashed' }}>
                                    +{c.skills.length - 4} more
                                </span>
                            )}
                        </div>
                        <div className={styles.candFullFoot}>
                            <span className={styles.candFullLoc}>
                                {IC.mapPin} <HighlightText text={c.location || 'Remote'} />
                            </span>
                            <span className={styles.candFullMatch}>
                                {IC.star} {c.match}% match
                            </span>
                        </div>
                        <div className={styles.candFullActions}>
                            <button className={styles.candViewBtn} onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCandidateId(c.id);
                            }}>
                                View Profile
                            </button>
                            <Link 
                                href={`/recruiter/nvite/compose?candidate_id=${c.id}`}
                                className={styles.candSaveBtn}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={(e) => e.stopPropagation()}
                                title="Send direct invite"
                            >
                                {IC.nvite}
                            </Link>
                        </div>
                    </div>
                )) : (
                    <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '4rem', color: '#64748b', fontWeight: 500 }}>
                        No candidates matched your specifications.
                    </p>
                )}
            </div>

            {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button 
                        onClick={() => {
                            const next = page + 1;
                            setPage(next);
                            fetchCandidates(next);
                        }}
                        className={styles.viewAll}
                    >
                        Load More Candidates
                    </button>
                </div>
            )}

            {/* Profile Drawer */}
            <CandidateProfileDrawer 
                candidateId={selectedCandidateId}
                onClose={() => setSelectedCandidateId(null)}
            />
        </div>
    );
}
