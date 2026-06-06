'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './offers.module.css';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';

// ─── Icons ──────────────────────────────────────────────────────────────────────
const IC = {
  Gift: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Info: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
};

type OfferStatus = 'sent' | 'viewed' | 'accepted' | 'declined' | 'negotiating' | 'expired';

interface Offer {
  id: string;
  position_title: string;
  salary_offered: number;
  salary_currency: string;
  joining_date: string;
  offer_valid_until: string;
  work_mode: string;
  work_location: string;
  status: OfferStatus;
  perks: string[];
  responded_at: string | null;
  jobs: {
    title: string;
    companies: {
      name: string;
      logo_url: string | null;
    }
  }
}

export default function OffersPage() {
  const params = useParams();
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Accepted' | 'Declined'>('All');

  const fetchOffers = async () => {
    if (!user) return;
    try {
      // Get candidate profile
      const { data: profile } = await insforge.database
        .from('candidate_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const { data, error } = await insforge.database
          .from('offers')
          .select('*, jobs(title, companies(name, logo_url))')
          .eq('candidate_id', profile.id)
          .order('created_at', { ascending: false });

        if (data) setOffers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return ['sent', 'viewed', 'negotiating'].includes(offer.status);
    if (activeTab === 'Accepted') return offer.status === 'accepted';
    if (activeTab === 'Declined') return offer.status === 'declined';
    return true;
  });

  const pendingCount = offers.filter(o => ['sent', 'viewed'].includes(o.status)).length;

  const getStatusLabel = (offer: Offer) => {
    const expires = new Date(offer.offer_valid_until);
    const today = new Date();
    const diffTime = expires.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (offer.status) {
      case 'sent': return `⏳ Awaiting Your Response · Expires in ${diffDays} days`;
      case 'viewed': return `👁 You've viewed this offer · Expires in ${diffDays} days`;
      case 'accepted': return `✅ Accepted on ${new Date(offer.responded_at!).toLocaleDateString()}`;
      case 'declined': return `❌ Declined on ${new Date(offer.responded_at!).toLocaleDateString()}`;
      case 'negotiating': return `💬 Counter-offer submitted`;
      case 'expired': return `⏰ This offer has expired`;
      default: return offer.status;
    }
  };

  const updateOfferStatus = async (offerId: string, newStatus: OfferStatus) => {
    try {
      const { error } = await insforge.database
        .from('offers')
        .update({ status: newStatus, responded_at: newStatus !== 'viewed' ? new Date().toISOString() : undefined })
        .eq('id', offerId);
      
      if (!error) fetchOffers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '80px 0', textAlign: 'center' }}>Loading your offers...</div>;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Offers</h1>
        {pendingCount > 0 && (
          <div className={styles.infoBanner}>
            <IC.Info />
            You have {pendingCount} offer{pendingCount > 1 ? 's' : ''} awaiting your response
          </div>
        )}
      </header>

      <div className={styles.tabs}>
        {['All', 'Pending', 'Accepted', 'Declined'].map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredOffers.length > 0 ? (
        <div className={styles.offersGrid}>
          {filteredOffers.map((offer) => (
            <div key={offer.id} className={styles.offerCard}>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  {offer.jobs.companies.logo_url ? (
                    <img src={getPublicStorageUrl('company-logos', offer.jobs.companies.logo_url)} className={styles.companyLogo} alt="" />
                  ) : (
                    <div className={styles.logoFallback}>{offer.jobs.companies.name[0]}</div>
                  )}
                  <div className={styles.companyInfo}>
                    <h3>{offer.jobs.title}</h3>
                    <p>{offer.jobs.companies.name}</p>
                  </div>
                </div>

                <div className={styles.salarySection}>
                  <span className={styles.salaryAmount}>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: offer.salary_currency,
                      maximumFractionDigits: 0
                    }).format(offer.salary_offered)}
                  </span>
                  <span className={styles.salaryLabel}>per annum</span>
                </div>

                <div className={styles.detailsRow}>
                  <div className={styles.detailItem}>
                    <span className={styles.badge}>{offer.work_mode}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <IC.MapPin /> {offer.work_location}
                  </div>
                  <div className={styles.detailItem}>
                    <IC.Calendar /> Join: {new Date(offer.joining_date).toLocaleDateString()}
                  </div>
                </div>

                <div className={styles.perksRow}>
                  {(offer.perks || []).slice(0, 3).map((perk, i) => (
                    <span key={i} className={styles.perkPill}>{perk}</span>
                  ))}
                  {offer.perks?.length > 3 && (
                    <span className={styles.perkPill}>+{offer.perks.length - 3} more</span>
                  )}
                </div>

                {['sent', 'viewed'].includes(offer.status) && (
                  <div className={styles.actions}>
                    <button 
                      className={styles.btnPrimary}
                      onClick={() => {
                        if (confirm('Are you sure you want to accept this offer?')) {
                          updateOfferStatus(offer.id, 'accepted');
                        }
                      }}
                    >
                      Accept
                    </button>
                    <button 
                      className={styles.btnOutline}
                      onClick={() => {
                        if (confirm('Once declined, this cannot be undone. Proceed?')) {
                          updateOfferStatus(offer.id, 'declined');
                        }
                      }}
                    >
                      Decline
                    </button>
                  </div>
                )}

                <Link href={`/candidate/offers/${offer.id}`} className={styles.btnGhost}>
                  View Full Offer
                </Link>
              </div>

              <div className={`${styles.statusBanner} ${styles[`status_${offer.status}`]}`}>
                {getStatusLabel(offer)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <IC.Gift />
          <h2>No offers found</h2>
          <p>Offers from recruiters will appear here once they are sent to you.</p>
        </div>
      )}
    </div>
  );
}
