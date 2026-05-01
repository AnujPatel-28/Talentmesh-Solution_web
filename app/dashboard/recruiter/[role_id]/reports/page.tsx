"use client";
import React from 'react';
import styles from '../../../shared-dashboard.module.css';

export default function ReportsPage() {
    return (
        <div className={styles.dash}>
            <div className={styles.greet}>
                <h1 className={styles.greetTitle}>Reports</h1>
                <p className={styles.greetSub}>Hiring metrics and recruitment analytics.</p>
            </div>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <div className={styles.statTop}>
                        <span className={styles.statLabel}>Avg. Time to Hire</span>
                        <span className={styles.statBox} style={{ background: '#eff6ff', color: 'var(--primary-blue)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </span>
                    </div>
                    <span className={styles.statVal}>18 days</span>
                    <span className={styles.statChange}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                        -3 days from last quarter
                    </span>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statTop}>
                        <span className={styles.statLabel}>Offer Accept Rate</span>
                        <span className={styles.statBox} style={{ background: '#f0fdf4', color: '#10b981' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </span>
                    </div>
                    <span className={styles.statVal}>82%</span>
                    <span className={styles.statHint}>Industry avg: 70%</span>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statTop}>
                        <span className={styles.statLabel}>Cost per Hire</span>
                        <span className={styles.statBox} style={{ background: '#fef3c7', color: '#f59e0b' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </span>
                    </div>
                    <span className={styles.statVal}>$4,200</span>
                    <span className={styles.statHint}>Under budget</span>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statTop}>
                        <span className={styles.statLabel}>Candidate Quality</span>
                        <span className={styles.statBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        </span>
                    </div>
                    <span className={styles.statVal}>4.5/5</span>
                    <span className={styles.statHint}>Avg. hiring manager rating</span>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.leftCol}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Hiring Funnel</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                            {[
                                { label: 'Applications Received', value: 234, bar: '100%', color: '#3b82f6' },
                                { label: 'Screened', value: 156, bar: '67%', color: '#60a5fa' },
                                { label: 'Interviewed', value: 48, bar: '21%', color: '#7c3aed' },
                                { label: 'Assessed', value: 22, bar: '9%', color: '#f59e0b' },
                                { label: 'Offers Made', value: 12, bar: '5%', color: '#10b981' },
                                { label: 'Hired', value: 8, bar: '3%', color: '#059669' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                        <span style={{ color: '#475569' }}>{item.label}</span>
                                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                                    </div>
                                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                        <div style={{ height: '100%', width: item.bar, background: item.color, borderRadius: 3 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.rightCol}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Top Sources</h2>
                        {[
                            { source: 'LinkedIn', hires: 6, pct: '40%' },
                            { source: 'Company Website', hires: 4, pct: '27%' },
                            { source: 'Referrals', hires: 3, pct: '20%' },
                            { source: 'Job Boards', hires: 2, pct: '13%' },
                        ].map((s, i) => (
                            <div key={i} className={styles.intCard}>
                                <div className={styles.candAvatar} style={{ borderRadius: 6 }}>{s.source[0]}</div>
                                <div className={styles.intBody}>
                                    <span className={styles.intName}>{s.source}</span>
                                    <span className={styles.intType}>{s.hires} hires</span>
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{s.pct}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
