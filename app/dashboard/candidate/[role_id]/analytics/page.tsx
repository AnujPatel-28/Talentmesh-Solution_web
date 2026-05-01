"use client";
import React from 'react';
import styles from '../../../shared-dashboard.module.css';

export default function AnalyticsPage() {
    return (
        <div className={styles.dash}>
            <div className={styles.greet}>
                <h1 className={styles.greetTitle}>Analytics</h1>
                <p className={styles.greetSub}>Track your job search progress and activity insights.</p>
            </div>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <div className={styles.statTop}>
                        <span className={styles.statLabel}>Profile Views</span>
                        <span className={styles.statIconBox} style={{ background: '#eff6ff', color: 'var(--primary-blue)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        </span>
                    </div>
                    <span className={styles.statVal}>142</span>
                    <span className={styles.statChange}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                        +23% from last month
                    </span>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statTop}>
                        <span className={styles.statLabel}>Search Appearances</span>
                        <span className={styles.statIconBox} style={{ background: '#f0fdf4', color: '#10b981' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </span>
                    </div>
                    <span className={styles.statVal}>89</span>
                    <span className={styles.statHint}>Appeared in recruiter searches</span>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statTop}>
                        <span className={styles.statLabel}>Response Rate</span>
                        <span className={styles.statIconBox} style={{ background: '#fef3c7', color: '#f59e0b' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        </span>
                    </div>
                    <span className={styles.statVal}>68%</span>
                    <span className={styles.statHint}>Above average for your role</span>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.leftCol}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Application Activity</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                            {[
                                { label: 'Applications Sent', value: 24, bar: '80%', color: 'var(--primary-blue)' },
                                { label: 'Responses Received', value: 16, bar: '55%', color: '#10b981' },
                                { label: 'Interviews Scheduled', value: 8, bar: '30%', color: '#7c3aed' },
                                { label: 'Offers Received', value: 2, bar: '10%', color: '#f59e0b' },
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
                        <h2 className={styles.cardTitle}>Who Viewed Your Profile</h2>
                        {[
                            { company: 'Google', role: 'Technical Recruiter', time: '2 hours ago' },
                            { company: 'Netflix', role: 'Hiring Manager', time: 'Yesterday' },
                            { company: 'Stripe', role: 'Engineering Lead', time: '3 days ago' },
                        ].map((v, i) => (
                            <div key={i} className={styles.actItem}>
                                <div className={styles.jobIcon} style={{ width: 36, height: 36 }}>{v.company[0]}</div>
                                <div className={styles.actContent}>
                                    <span className={styles.actText}><b>{v.company}</b></span>
                                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{v.role}</span>
                                    <span className={styles.actTime}>{v.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
