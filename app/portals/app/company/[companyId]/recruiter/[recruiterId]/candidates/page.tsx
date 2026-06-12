"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './candidates.module.css';
import { invokeFunction, insforge } from '@/lib/insforge';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
import CandidateProfileDrawer from '@/components/recruiter/CandidateProfileDrawer';
import { toast } from 'react-hot-toast';

const IC = {
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    star: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    nvite: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
    x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
};

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const fetching = useRef(false);
    const selectAllRef = useRef<HTMLInputElement>(null);

    const isAllSelected = candidates.length > 0 && selectedIds.size === candidates.length;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < candidates.length;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    const fetchCandidates = async (pageNum: number) => {
        if (fetching.current) return;
        fetching.current = true;
        try {
            const { data, error } = await invokeFunction('candidates', {
                method: 'GET',
                queries: { page: pageNum.toString() }
            });

            if (error) {
                console.error('Error fetching candidates:', error);
                return;
            }

            if (data) {
                setCandidates(prev => pageNum === 0 ? data.data : [...prev, ...data.data]);
                setHasMore(data.hasMore);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
            fetching.current = false;
        }
    };

    useEffect(() => {
        fetchCandidates(0);
    }, []);

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(candidates.map(c => c.id)));
        }
    };

    const bulkUpdateStatus = async (newStatus: string) => {
        setBulkLoading(true);
        try {
            const { data: apps, error: fetchErr } = await insforge.database
                .from('applications')
                .select('id')
                .in('candidate_id', Array.from(selectedIds));

            if (fetchErr) throw fetchErr;

            if (apps && apps.length > 0) {
                const appIds = apps.map(a => a.id);
                const { error: updateErr } = await invokeFunction('update-application', {
                    body: { ids: appIds, status: newStatus }
                });

                if (updateErr) throw updateErr;
                toast.success(`Updated ${selectedIds.size} candidates to ${newStatus}`);
            } else {
                toast.error('No active applications found for selected candidates');
            }
            setSelectedIds(new Set());
        } catch (err: any) {
            console.error('Bulk update error:', err);
            toast.error(err.message || 'Failed to update candidates');
        } finally {
            setBulkLoading(false);
        }
    };

    if (loading) return <HomeSkeleton />;

    return (
        <div className={`${styles.candPage} ${selectedIds.size > 0 ? styles.bulkActive : ''}`}>
            <div className={styles.pageHead}>
                <div className={styles.selectAllWrap}>
                    <input 
                        type="checkbox" 
                        className={styles.headerCheckbox}
                        checked={isAllSelected}
                        ref={selectAllRef}
                        onChange={toggleAll}
                    />
                    <h1 className={styles.pageTitle}>
                        {selectedIds.size > 0 ? `${selectedIds.size} Selected` : `Candidates (${candidates.length})`}
                    </h1>
                </div>
            </div>

            <div className={styles.candGrid}>
                {candidates.length > 0 ? candidates.map((c, i) => (
                    <div 
                        key={c.id || i} 
                        className={`${styles.candFullCard} ${selectedIds.has(c.id) ? styles.selected : ''}`}
                        onClick={() => setSelectedCandidateId(c.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <input 
                            type="checkbox"
                            className={styles.cardCheckbox}
                            checked={selectedIds.has(c.id)}
                            onChange={(e) => {
                                e.stopPropagation();
                                toggleSelect(c.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className={styles.candFullHead}>
                            <div className={styles.candFullAvatar}>{c.name.split(' ').map((n: string) => n[0]).join('')}</div>
                            <div>
                                <div className={styles.candFullName}>{c.name}</div>
                                <div className={styles.candFullRole}>{c.role}</div>
                            </div>
                        </div>
                        <div className={styles.candFullTags}>
                            {c.skills.slice(0, 4).map((s: string) => <span key={s} className={styles.candFullTag}>{s}</span>)}
                        </div>
                        <div className={styles.candFullFoot}>
                            <span className={styles.candFullLoc}>{IC.mapPin} {c.location || 'Remote'}</span>
                            <span className={styles.candFullMatch}>{IC.star} {c.match}% match</span>
                        </div>
                        <div className={styles.candFullActions}>
                            <button className={styles.candViewBtn}>View Profile</button>
                            <Link 
                                href={`/recruiter/nvite/compose?candidate_id=${c.id}`}
                                className={styles.candNViteBtn}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {IC.nvite} NVite
                            </Link>
                            <button className={styles.candSaveBtn} onClick={(e) => e.stopPropagation()}>{IC.bookmark}</button>
                        </div>
                    </div>
                )) : (
                    <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '4rem', color: '#64748b' }}>No candidates found.</p>
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
                        Load More
                    </button>
                </div>
            )}

            {selectedIds.size > 0 && (
                <div className={styles.bulkBar}>
                    <span className={styles.bulkCount}>{selectedIds.size} candidates selected</span>
                    <div className={styles.bulkActions}>
                        <button 
                            className={`${styles.bulkBtn} ${styles.bulkBtnPrimary}`}
                            disabled={bulkLoading}
                            onClick={() => bulkUpdateStatus('shortlisted')}
                        >
                            {bulkLoading ? 'Updating...' : 'Shortlist'}
                        </button>
                        <button 
                            className={`${styles.bulkBtn} ${styles.bulkBtnSecondary}`}
                            disabled={bulkLoading}
                            onClick={() => bulkUpdateStatus('reviewing')}
                        >
                            Screening
                        </button>
                        <button 
                            className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}
                            disabled={bulkLoading}
                            onClick={() => bulkUpdateStatus('rejected')}
                        >
                            Reject
                        </button>
                        <Link 
                            href={`/recruiter/nvite/compose?bulk=true&ids=${Array.from(selectedIds).join(',')}`}
                            className={`${styles.bulkBtn} ${styles.bulkBtnSecondary}`}
                            style={{ textDecoration: 'none' }}
                        >
                            Send NVite
                        </Link>
                    </div>
                    <button className={styles.bulkClear} onClick={() => setSelectedIds(new Set())}>
                        {IC.x}
                    </button>
                </div>
            )}

            <CandidateProfileDrawer 
                candidateId={selectedCandidateId}
                onClose={() => setSelectedCandidateId(null)}
            />
        </div>
    );
}
