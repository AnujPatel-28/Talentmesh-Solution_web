"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './offers.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { format, isBefore, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';

export default function OffersPage() {
    const { user } = useAuth();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const fetchOffers = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await insforge.database
                .from('offers')
                .select(`
                    *,
                    candidate:profiles!candidate_id(id, full_name, avatar_url),
                    job:jobs(id, title)
                `)
                .eq('recruiter_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOffers(data || []);
        } catch (err) {
            console.error('Error fetching offers:', err);
            toast.error('Failed to load offers');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const updateOfferStatus = async (offerId: string, status: string) => {
        try {
            const { error } = await insforge.database
                .from('offers')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', offerId);

            if (error) throw error;
            toast.success(`Offer updated to ${status}`);
            fetchOffers();
        } catch (err) {
            console.error('Update offer error:', err);
            toast.error('Failed to update offer');
        }
    };

    const filteredOffers = activeTab === 'all' 
        ? offers 
        : offers.filter(o => o.status === activeTab.toLowerCase());

    const stats = {
        total: offers.length,
        pending: offers.filter(o => ['sent', 'viewed', 'negotiating'].includes(o.status)).length,
        accepted: offers.filter(o => o.status === 'accepted').length,
        declined: offers.filter(o => o.status === 'declined').length,
        rate: offers.length > 0 ? Math.round((offers.filter(o => o.status === 'accepted').length / offers.length) * 100) : 0
    };

    if (loading) return <HomeSkeleton />;

    return (
        <div className={styles.offersPage}>
            <header className={styles.header}>
                <h1 className={styles.title}>Offer Management</h1>
            </header>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Offers</span>
                    <span className={styles.statValue}>{stats.total}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Pending</span>
                    <span className={styles.statValue}>{stats.pending}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Accepted</span>
                    <span className={styles.statValue}>{stats.accepted}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Declined</span>
                    <span className={styles.statValue}>{stats.declined}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Acceptance Rate</span>
                    <span className={styles.statValue}>{stats.rate}%</span>
                </div>
            </div>

            <nav className={styles.tabs}>
                {['All', 'Draft', 'Sent', 'Accepted', 'Declined', 'Negotiating', 'Expired'].map(tab => (
                    <button 
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Position</th>
                            <th>Offered Salary</th>
                            <th>Joining Date</th>
                            <th>Status</th>
                            <th>Valid Until</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOffers.length > 0 ? filteredOffers.map(offer => {
                            const isExpired = offer.status === 'sent' && isBefore(parseISO(offer.offer_valid_until), new Date());
                            return (
                                <tr key={offer.id} className={isExpired ? styles.rowExpired : ''}>
                                    <td>
                                        <div className={styles.candidateCell}>
                                            <div className={styles.avatar}>{offer.candidate?.full_name?.[0]}</div>
                                            <span>{offer.candidate?.full_name}</span>
                                        </div>
                                    </td>
                                    <td>{offer.position_title}</td>
                                    <td className={styles.salary}>{formatINR(offer.salary_offered)} p.a.</td>
                                    <td>{format(parseISO(offer.joining_date), 'MMM dd, yyyy')}</td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[`status_${offer.status}`]}`}>
                                            {offer.status === 'viewed' ? 'Viewed' : 
                                             offer.status === 'accepted' ? 'Accepted ✓' : 
                                             offer.status === 'declined' ? 'Declined' : 
                                             offer.status}
                                        </span>
                                    </td>
                                    <td>{format(parseISO(offer.offer_valid_until), 'MMM dd, yyyy')}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link href={`/recruiter/offers/${offer.id}`} className={styles.actionBtn}>View</Link>
                                            {offer.status === 'draft' && (
                                                <button className={styles.actionBtn} onClick={() => updateOfferStatus(offer.id, 'sent')}>Send</button>
                                            )}
                                            {['sent', 'viewed', 'negotiating'].includes(offer.status) && (
                                                <button className={styles.actionBtn} onClick={() => updateOfferStatus(offer.id, 'withdrawn')}>Withdraw</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                                    No offers found for this criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
