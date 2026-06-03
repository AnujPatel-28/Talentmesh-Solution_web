"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './offer-detail.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { format, parseISO, addDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';

export default function OfferDetailPage() {
    const { offer_id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchOffer = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from('offers')
                .select(`
                    *,
                    candidate:profiles!candidate_id(id, full_name, avatar_url, email),
                    job:jobs(id, title, company_name:companies(name))
                `)
                .eq('id', offer_id)
                .single();

            if (error) throw error;
            setOffer(data);
        } catch (err) {
            console.error('Error fetching offer:', err);
            toast.error('Offer not found');
            router.push('/recruiter/offers');
        } finally {
            setLoading(false);
        }
    }, [offer_id, router]);

    useEffect(() => {
        fetchOffer();
    }, [fetchOffer]);

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const handleAction = async (status: string, extraData: any = {}) => {
        setUpdating(true);
        try {
            const { error } = await insforge.database
                .from('offers')
                .update({ 
                    status, 
                    updated_at: new Date().toISOString(),
                    ...extraData
                })
                .eq('id', offer_id);

            if (error) throw error;
            toast.success(`Offer updated to ${status}`);
            fetchOffer();
        } catch (err) {
            console.error('Update offer error:', err);
            toast.error('Failed to update offer');
        } finally {
            setUpdating(false);
        }
    };

    const handleExtend = async () => {
        const newDate = format(addDays(parseISO(offer.offer_valid_until), 7), 'yyyy-MM-dd');
        await handleAction(offer.status, { offer_valid_until: newDate });
    };

    const handleAcceptCounter = async () => {
        await handleAction('accepted', { salary_offered: offer.counter_salary });
    };

    if (loading) return <HomeSkeleton />;
    if (!offer) return null;

    return (
        <div className={styles.page}>
            <Link href="/recruiter/offers" className={styles.backLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                Back to Offers
            </Link>

            <div className={styles.layout}>
                <div className={styles.left}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>{offer.position_title}</h2>
                                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>For {offer.candidate?.full_name}</p>
                            </div>
                            <span className={`${styles.badge} ${styles[`status_${offer.status}`]}`}>
                                {offer.status}
                            </span>
                        </div>

                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Salary Offered</span>
                                <span className={styles.detailValue}>{formatINR(offer.salary_offered)} p.a.</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Work Mode</span>
                                <span className={styles.detailValue}>{offer.work_mode} {offer.work_location && `(${offer.work_location})`}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Joining Date</span>
                                <span className={styles.detailValue}>{format(parseISO(offer.joining_date), 'MMMM dd, yyyy')}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Valid Until</span>
                                <span className={styles.detailValue}>{format(parseISO(offer.offer_valid_until), 'MMMM dd, yyyy')}</span>
                            </div>
                        </div>

                        <span className={styles.sectionTitle}>Perks & Benefits</span>
                        <div className={styles.perksList}>
                            {offer.perks?.length > 0 ? offer.perks.map((p: string) => (
                                <span key={p} className={styles.perkTag}>{p}</span>
                            )) : <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No perks listed</span>}
                        </div>

                        {offer.additional_terms && (
                            <>
                                <span className={styles.sectionTitle}>Additional Terms</span>
                                <p style={{ fontSize: '0.875rem', color: '#475569' }}>{offer.additional_terms}</p>
                            </>
                        )}
                    </div>

                    <div className={styles.letterPreview}>
                        <h2>LETTER OF INTENT</h2>
                        <div className={styles.letterSection}>
                            <p>Dear {offer.candidate?.full_name},</p>
                            <p>We are pleased to offer you the position of <strong>{offer.position_title}</strong> at <strong>{offer.job?.company_name?.name || 'TalentMesh'}</strong>.</p>
                        </div>

                        <div className={styles.letterSection}>
                            <h4>Compensation</h4>
                            <p>Annual CTC: <strong>{formatINR(offer.salary_offered)}</strong> per annum</p>
                        </div>

                        <div className={styles.letterSection}>
                            <h4>Benefits</h4>
                            <ul>
                                {offer.perks?.map((p: string) => <li key={p}>{p}</li>)}
                            </ul>
                        </div>

                        <p>This offer is valid until {format(parseISO(offer.offer_valid_until), 'MMMM dd, yyyy')}.</p>
                    </div>
                </div>

                <div className={styles.right}>
                    <div className={`${styles.card} ${styles.actionCard}`}>
                        <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Manage Offer</h3>
                        
                        <div className={styles.actionsList}>
                            {offer.status === 'draft' && (
                                <button className={styles.btnPrimary} onClick={() => handleAction('sent')}>Send Offer</button>
                            )}
                            
                            {['sent', 'viewed', 'negotiating'].includes(offer.status) && (
                                <>
                                    <button className={styles.btnSecondary} onClick={() => toast.success('Reminder sent!')}>Send Reminder</button>
                                    <button className={styles.btnSecondary} onClick={handleExtend}>Extend Validity (+7 days)</button>
                                    <button className={styles.btnDanger} onClick={() => handleAction('withdrawn')}>Withdraw Offer</button>
                                </>
                            )}

                            {['sent', 'viewed', 'negotiating'].includes(offer.status) && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                    <button className={styles.btnSecondary} style={{ color: '#166534', borderColor: '#bbf7d0' }} onClick={() => handleAction('accepted')}>Mark as Accepted</button>
                                    <button className={styles.btnSecondary} style={{ color: '#991b1b', borderColor: '#fecaca', marginTop: '0.5rem' }} onClick={() => handleAction('declined')}>Mark as Declined</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {(offer.candidate_response || offer.counter_salary) && (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Candidate Response</h3>
                            <div className={styles.responseBox}>
                                <p className={styles.responseText}>{offer.candidate_response || 'Negotiating salary terms...'}</p>
                                
                                {offer.counter_salary && (
                                    <div className={styles.counterOffer}>
                                        <span className={styles.counterLabel}>Counter Salary</span>
                                        <div className={styles.counterValue}>{formatINR(offer.counter_salary)}</div>
                                        
                                        {offer.status === 'negotiating' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                <button className={styles.btnPrimary} onClick={handleAcceptCounter}>Accept Counter</button>
                                                <button className={styles.btnDanger} onClick={() => handleAction('declined')}>Decline</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Timeline</h3>
                        <div className={styles.timeline}>
                            <div className={styles.timelineItem}>
                                <div className={styles.timelineDot} />
                                <div className={styles.timelineContent}>
                                    <span className={styles.timelineTitle}>Offer Created</span>
                                    <span className={styles.timelineTime}>{format(parseISO(offer.created_at), 'MMM dd, h:mm a')}</span>
                                </div>
                            </div>
                            {offer.status !== 'draft' && (
                                <div className={styles.timelineItem}>
                                    <div className={styles.timelineDot} />
                                    <div className={styles.timelineContent}>
                                        <span className={styles.timelineTitle}>Offer Sent</span>
                                        <span className={styles.timelineTime}>{format(parseISO(offer.created_at), 'MMM dd, h:mm a')}</span>
                                    </div>
                                </div>
                            )}
                            {offer.viewed_at && (
                                <div className={styles.timelineItem}>
                                    <div className={styles.timelineDot} />
                                    <div className={styles.timelineContent}>
                                        <span className={styles.timelineTitle}>Offer Viewed</span>
                                        <span className={styles.timelineTime}>{format(parseISO(offer.viewed_at), 'MMM dd, h:mm a')}</span>
                                    </div>
                                </div>
                            )}
                            {offer.responded_at && (
                                <div className={styles.timelineItem}>
                                    <div className={`${styles.timelineDot} ${offer.status === 'declined' ? styles.timelineDotRed : ''}`} />
                                    <div className={styles.timelineContent}>
                                        <span className={styles.timelineTitle}>Candidate Responded</span>
                                        <span className={styles.timelineTime}>{format(parseISO(offer.responded_at), 'MMM dd, h:mm a')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
