'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './offer-detail.module.css';

const IC = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  Print: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
  Scales: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h18" /></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Celebrate: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C6 4 7 9 7 9z" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C18 4 17 9 17 9z" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2h4" /><path d="M2 2h4" /><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>,
};

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [negotiateMode, setNegotiateMode] = useState(false);
  const [counterSalary, setCounterSalary] = useState('');
  const [message, setMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchData = async () => {
    try {
      const { data, error } = await insforge.database
        .from('offers')
        .select('*, jobs(title, location, companies(name, logo_url))')
        .eq('id', params.offer_id)
        .single();
      
      if (data) {
        setOffer(data);
        if (data.status === 'sent') {
          // Mark as viewed
          await insforge.database.from('offers').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('id', data.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.offer_id]);

  const handleAccept = async () => {
    if (!confirm('Are you sure you want to accept this offer?')) return;
    try {
      const { error } = await insforge.database
        .from('offers')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', offer.id);
      
      if (!error) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        fetchData();
        // Notify recruiter (out of scope for logic but good to note)
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNegotiate = async () => {
    if (!counterSalary) return alert('Please enter your counter salary');
    try {
      const { error } = await insforge.database
        .from('offers')
        .update({ 
          status: 'negotiating', 
          counter_salary: parseInt(counterSalary), 
          candidate_response: message,
          responded_at: new Date().toISOString() 
        })
        .eq('id', offer.id);
      
      if (!error) {
        setNegotiateMode(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async () => {
    const reason = prompt('Reason for declining (optional):');
    if (reason === null) return;
    if (!confirm('Once declined, this cannot be undone. Proceed?')) return;
    
    try {
      const { error } = await insforge.database
        .from('offers')
        .update({ 
          status: 'declined', 
          candidate_response: reason,
          responded_at: new Date().toISOString() 
        })
        .eq('id', offer.id);
      
      if (!error) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '80px 0', textAlign: 'center' }}>Loading offer details...</div>;
  if (!offer) return <div style={{ padding: '80px 0', textAlign: 'center' }}>Offer not found.</div>;

  const isPending = ['sent', 'viewed', 'negotiating'].includes(offer.status);

  return (
    <div className={styles.pageContainer}>
      {showConfetti && (
        <div className={styles.confettiContainer}>
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className={styles.confetti} 
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      )}

      <Link href="/candidate/offers" className={styles.backLink}>
        <IC.Back /> Back to All Offers
      </Link>

      <div className={styles.offerPaper} id="offer-letter">
        <div className={styles.paperHeader}>
          <div className={styles.companyInfo}>
            <h1>{offer.jobs.companies.name}</h1>
            <p>Official Offer of Employment</p>
          </div>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <IC.Print /> View as PDF
          </button>
        </div>

        <div className={styles.letterBody}>
          <p>Dear {authUser?.name || 'Candidate'},</p>
          <p>
            We are pleased to offer you the position of <strong>{offer.position_title}</strong> with <strong>{offer.jobs.companies.name}</strong>. 
            We were very impressed with your background and feel that you would be a great addition to our team.
          </p>

          <div className={styles.detailGrid}>
            <div>
              <span className={styles.detailLabel}>Position</span>
              <span className={styles.detailValue}>{offer.position_title}</span>
            </div>
            <div>
              <span className={styles.detailLabel}>Base Salary (Annual)</span>
              <span className={styles.detailValue}>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: offer.salary_currency,
                  maximumFractionDigits: 0
                }).format(offer.salary_offered)}
              </span>
            </div>
            <div>
              <span className={styles.detailLabel}>Joining Date</span>
              <span className={styles.detailValue}>{new Date(offer.joining_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
            <div>
              <span className={styles.detailLabel}>Work Mode</span>
              <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>{offer.work_mode}</span>
            </div>
          </div>

          <h3>Benefits & Perks</h3>
          <p>As part of our team, you will be eligible for the following benefits:</p>
          <ul>
            {offer.perks?.map((perk: string, i: number) => (
              <li key={i}>{perk}</li>
            ))}
          </ul>

          <h3>Additional Terms</h3>
          <p>{offer.additional_terms || 'Standard employment terms as per company policy apply.'}</p>

          <p style={{ marginTop: '3rem' }}>Sincerely,</p>
          <p><strong>Talent Acquisition Team</strong><br />{offer.jobs.companies.name}</p>
        </div>

        {isPending && (
          <div className={styles.responseSection}>
            <h2 className={styles.responseTitle}>Your Response</h2>
            
            <div className={styles.actionCards}>
              {/* Accept */}
              <div className={`${styles.actionCard} ${styles.cardAccept}`}>
                <div className={`${styles.iconCircle} ${styles.iconAccept}`}><IC.Check /></div>
                <h3>Accept This Offer</h3>
                <p>I'm excited to join {offer.jobs.companies.name} as {offer.position_title}</p>
                <button className={`${styles.actionBtn} ${styles.btnAccept}`} onClick={handleAccept}>Accept Offer</button>
              </div>

              {/* Negotiate */}
              <div className={`${styles.actionCard} ${styles.cardNegotiate}`}>
                <div className={`${styles.iconCircle} ${styles.iconNegotiate}`}><IC.Scales /></div>
                <h3>Submit Counter-offer</h3>
                <p>I'd like to discuss the salary or other terms of this offer.</p>
                <button className={`${styles.actionBtn} ${styles.btnNegotiate}`} onClick={() => setNegotiateMode(!negotiateMode)}>
                  {negotiateMode ? 'Cancel' : 'Negotiate'}
                </button>
                
                {negotiateMode && (
                  <div className={styles.negotiateForm}>
                    <div className={styles.inputGroup}>
                      <label>Desired Annual Salary (INR)</label>
                      <input 
                        type="number" 
                        className={styles.input} 
                        placeholder="e.g. 1500000"
                        value={counterSalary}
                        onChange={(e) => setCounterSalary(e.target.value)}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Message to Recruiter</label>
                      <textarea 
                        className={styles.textarea} 
                        placeholder="Briefly explain your counter-offer..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <button className={`${styles.actionBtn} ${styles.btnNegotiate}`} onClick={handleNegotiate}>Submit Counter</button>
                  </div>
                )}
              </div>

              {/* Decline */}
              <div className={`${styles.actionCard} ${styles.cardDecline}`}>
                <div className={`${styles.iconCircle} ${styles.iconDecline}`}><IC.X /></div>
                <h3>Decline This Offer</h3>
                <p>I've decided to pursue other opportunities at this time.</p>
                <button className={`${styles.actionBtn} ${styles.btnDecline}`} onClick={handleDecline}>Decline</button>
              </div>
            </div>
          </div>
        )}

        {offer.status === 'accepted' && (
          <div className={styles.nextSteps}>
            <h2><IC.Celebrate /> Congratulations! Offer accepted.</h2>
            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}><IC.Check /></div>
                <div className={styles.stepText}>Save the offer letter for your records (use the "View as PDF" button above).</div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}><IC.Check /></div>
                <div className={styles.stepText}>Note your joining date: <strong>{new Date(offer.joining_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</strong></div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}><IC.Check /></div>
                <div className={styles.stepText}>Contact your recruiter for onboarding details.</div>
              </div>
              <Link href="#" className={styles.actionBtn} style={{ background: '#166534', color: 'white', textDecoration: 'none', textAlign: 'center', marginTop: '1rem' }}>
                Chat with Recruiter
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
