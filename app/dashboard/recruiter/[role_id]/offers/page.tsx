"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
import styles from './offers.module.css';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    draft:    { label: 'Draft',     color: '#f59e0b', bg: '#fffbeb' },
    sent:     { label: 'Sent',      color: '#3b82f6', bg: '#eff6ff' },
    viewed:   { label: 'Viewed',    color: '#8b5cf6', bg: '#f5f3ff' },
    accepted: { label: 'Accepted',  color: '#10b981', bg: '#f0fdf4' },
    declined: { label: 'Declined',  color: '#ef4444', bg: '#fff1f2' },
    expired:  { label: 'Expired',   color: '#94a3b8', bg: '#f1f5f9' },
};

const IC = {
    plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

export default function OffersPage() {
    const { user } = useAuth();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (!user?.id) return;
        insforge.database
            .from('offers')
            .select('*, candidate:profiles!candidate_id(id, name, location, avatar_url, candidate_profiles(headline, skills)), jobs(title)')
            .eq('recruiter_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                const list = (data || []).map((offer: any) => {
                    const p = offer.candidate;
                    const cp = p && (Array.isArray(p.candidate_profiles) ? p.candidate_profiles[0] : p.candidate_profiles);
                    return {
                        ...offer,
                        candidateName: p?.name || 'Candidate',
                        candidateRole: cp?.headline || '—',
                        avatarUrl: p?.avatar_url
                    };
                });
                setOffers(list);
                setLoading(false);
            });
    }, [user?.id]);

    const filtered = filterStatus === 'all' ? offers : offers.filter(o => o.status === filterStatus);

    const stats = {
        total: offers.length,
        accepted: offers.filter(o => o.status === 'accepted').length,
        pending: offers.filter(o => ['sent', 'viewed'].includes(o.status)).length,
        declined: offers.filter(o => o.status === 'declined').length,
    };

    if (loading) return <HomeSkeleton />;

    return (
        <div className={styles.offersPage}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Offers</h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>Manage job offers and approval workflows</p>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                {[
                    { label: 'Total Offers', value: stats.total, color: '#2557a7', bg: '#eff6ff' },
                    { label: 'Accepted', value: stats.accepted, color: '#10b981', bg: '#f0fdf4' },
                    { label: 'Pending', value: stats.pending, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Declined', value: stats.declined, color: '#ef4444', bg: '#fff1f2' },
                ].map((s) => (
                    <div key={s.label} className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>{s.label}</span>
                            <span style={{ width: 32, height: 32, borderRadius: '8px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {IC.check}
                            </span>
                        </div>
                        <span className={styles.statVal}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['all', 'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        style={{
                            padding: '0.45rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            background: filterStatus === s ? '#2563eb' : '#f1f5f9',
                            color: filterStatus === s ? '#fff' : '#64748b',
                        }}
                    >
                        {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
                        {s !== 'all' && <span style={{ marginLeft: 4, fontSize: '0.72rem' }}>({offers.filter(o => o.status === s).length})</span>}
                    </button>
                ))}
            </div>

            {/* Offers list */}
            {filtered.length === 0 ? (
                <div className={styles.emptyState}><p>No offers found for this filter.</p></div>
            ) : (
                <div className={styles.offerList}>
                    {filtered.map((offer) => {
                        const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG['draft'];
                        return (
                            <div key={offer.id} className={styles.offerCard}>
                                <div className={styles.avatar}>
                                    {offer.avatarUrl ? (
                                        <img src={offer.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        offer.candidateName?.[0]?.toUpperCase() || 'C'
                                    )}
                                </div>
                                <div className={styles.candidateInfo}>
                                    <div className={styles.candidateName}>{offer.candidateName}</div>
                                    <div className={styles.positionInfo}>{offer.jobs?.title || '—'} · {offer.candidateRole}</div>
                                </div>
                                {offer.salary_offered && (
                                    <div className={styles.salary}>
                                        {new Intl.NumberFormat('en-IN', {
                                            style: 'currency',
                                            currency: 'INR',
                                            maximumFractionDigits: 0
                                        }).format(offer.salary_offered)}
                                    </div>
                                )}
                                <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color }}>
                                    {cfg.label}
                                </span>
                                <div className={styles.date}>
                                    {new Date(offer.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
