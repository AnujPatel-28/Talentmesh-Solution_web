"use client";
import React from 'react';
import styles from '../admin.module.css';

const IC = {
    trending: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
};

const METRICS = [
    { label: 'Total Applications', value: '4,283', change: '+18% vs last month' },
    { label: 'Avg. Time to Hire', value: '14 days', change: '-3 days improvement' },
    { label: 'Offer Acceptance Rate', value: '84%', change: '+5% vs last month' },
    { label: 'Active Job Postings', value: '248', change: '+12 this week' },
];

const TOP_RECRUITERS = [
    { name: 'Raj Malhotra', hires: 47, fill: '94%' },
    { name: 'Harper Reid', hires: 34, fill: '68%' },
    { name: 'Anita Desai', hires: 28, fill: '56%' },
    { name: 'Emily Zhang', hires: 21, fill: '42%' },
];

const TOP_JOBS = [
    { title: 'Senior AI Researcher', applicants: 156, company: 'Quantum Leap' },
    { title: 'Product Manager', applicants: 124, company: 'Flipkart' },
    { title: 'Full Stack Developer', applicants: 98, company: 'Infosys' },
    { title: 'Head of Product', applicants: 87, company: 'Aether' },
];

export default function AdminReportsPage() {
    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Platform Reports</h1>
                    <p className={styles.pageSub}>Analytics and insights across the entire TalentMesh platform</p>
                </div>
                <button className={styles.secondaryBtn}>Export Report</button>
            </div>

            {/* Metrics */}
            <div className={styles.stats}>
                {METRICS.map((m, i) => (
                    <div key={i} className={styles.stat}>
                        <span className={styles.statLabel}>{m.label}</span>
                        <span className={styles.statVal}>{m.value}</span>
                        <span className={styles.statChange}>{IC.trending} {m.change}</span>
                    </div>
                ))}
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.leftCol}>
                    {/* Top Jobs */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Most Popular Job Postings</h2>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Job Title</th><th>Company</th><th>Applicants</th></tr>
                            </thead>
                            <tbody>
                                {TOP_JOBS.map((j, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{j.title}</td>
                                        <td>{j.company}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{j.applicants}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Hiring Funnel */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Hiring Funnel</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                            {[
                                { label: 'Applied', val: 4283, pct: 100, color: '#007BFF' },
                                { label: 'Screened', val: 2847, pct: 66, color: '#2563eb' },
                                { label: 'Interviewed', val: 1423, pct: 33, color: '#7c3aed' },
                                { label: 'Offered', val: 487, pct: 11, color: '#10b981' },
                                { label: 'Hired', val: 409, pct: 10, color: '#059669' },
                            ].map((f, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                        <span style={{ fontWeight: 600, color: '#374151' }}>{f.label}</span>
                                        <span style={{ color: '#64748b' }}>{f.val.toLocaleString()} ({f.pct}%)</span>
                                    </div>
                                    <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${f.pct}%`, height: '100%', background: f.color, borderRadius: 4 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.rightCol}>
                    {/* Top Recruiters */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Top Recruiters</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.3rem' }}>
                            {TOP_RECRUITERS.map((r, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div className={styles.avatar} style={{ background: `hsl(${220 + i * 15}, 70%, ${40 + i * 5}%)`, width: 32, height: 32, fontSize: '0.65rem' }}>
                                        {r.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{r.name}</div>
                                        <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 3, marginTop: 4 }}>
                                            <div style={{ width: r.fill, height: '100%', background: 'var(--primary-blue)', borderRadius: 3 }} />
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{r.hires} hires</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Geo */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Top Locations</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
                            {[
                                { loc: 'Bangalore, India', jobs: 48 },
                                { loc: 'San Francisco, USA', jobs: 42 },
                                { loc: 'Remote', jobs: 38 },
                                { loc: 'Mumbai, India', jobs: 31 },
                                { loc: 'New York, USA', jobs: 27 },
                            ].map((l, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                                    <span style={{ fontSize: '0.82rem', color: '#374151' }}>{l.loc}</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{l.jobs} jobs</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
