"use client";
import React, { useEffect, useState, useRef } from 'react';
import styles from '../../../shared-dashboard.module.css';
import { invokeFunction } from '@/lib/insforge';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';

const IC = {
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    star: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
};

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const fetching = useRef(false);

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

    if (loading) return <HomeSkeleton />;

    return (
        <div className={styles.candPage}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Candidates ({candidates.length})</h1>
            </div>
            <div className={styles.candGrid}>
                {candidates.length > 0 ? candidates.map((c, i) => (
                    <div key={i} className={styles.candFullCard}>
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
                            <button className={styles.candSaveBtn}>{IC.bookmark}</button>
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
        </div>
    );
}
