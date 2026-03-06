"use client";
import React from 'react';
import styles from '../admin.module.css';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    mail: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    briefcase: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
};

const RECRUITERS = [
    { name: 'Harper Reid', email: 'harper@techcorp.com', company: 'TechCorp Inc.', loc: 'San Francisco', jobs: 12, hires: 34, status: 'Active', joined: 'Jan 2025', initials: 'HR', color: '#0D47A1' },
    { name: 'Emily Zhang', email: 'emily@innovate.co', company: 'Innovate Co.', loc: 'New York', jobs: 8, hires: 21, status: 'Active', joined: 'Feb 2025', initials: 'EZ', color: '#1565C0' },
    { name: 'Raj Malhotra', email: 'raj@globalhr.in', company: 'GlobalHR India', loc: 'Mumbai', jobs: 15, hires: 47, status: 'Active', joined: 'Dec 2024', initials: 'RM', color: '#1E88E5' },
    { name: 'Sarah Kim', email: 'sarah@startupx.io', company: 'StartupX', loc: 'Berlin', jobs: 5, hires: 12, status: 'Pending', joined: 'Mar 2026', initials: 'SK', color: '#2196F3' },
    { name: 'Michael Torres', email: 'michael@recruit.co', company: 'RecruitPro', loc: 'Chicago', jobs: 0, hires: 0, status: 'Suspended', joined: 'Jan 2026', initials: 'MT', color: '#42A5F5' },
    { name: 'Anita Desai', email: 'anita@hrplus.in', company: 'HR Plus', loc: 'Bangalore', jobs: 9, hires: 28, status: 'Active', joined: 'Nov 2024', initials: 'AD', color: '#0D47A1' },
];

const statusClass = (s: string) => {
    if (s === 'Active') return styles.badgeActive;
    if (s === 'Pending') return styles.badgeNew;
    return styles.badgeClosed;
};

export default function AdminRecruitersPage() {
    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Manage Recruiters</h1>
                    <p className={styles.pageSub}>View, approve, and manage recruiter accounts across the platform</p>
                </div>
                <button className={styles.primaryBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Invite Recruiter
                </button>
            </div>

            <div className={styles.searchRow}>
                <div className={styles.searchBar}>
                    {IC.search}
                    <input placeholder="Search recruiters by name, company, or email..." />
                </div>
                <button className={styles.filterBtn}>Status</button>
                <button className={styles.filterBtn}>{IC.mapPin} Location</button>
            </div>

            {/* Stats */}
            <div className={styles.stats} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className={styles.stat}><span className={styles.statLabel}>Total Recruiters</span><span className={styles.statVal}>42</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Pending Approval</span><span className={styles.statVal} style={{ color: '#d97706' }}>6</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Suspended</span><span className={styles.statVal} style={{ color: '#dc2626' }}>2</span></div>
            </div>

            {/* Table */}
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Recruiter</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Active Jobs</th>
                            <th>Total Hires</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {RECRUITERS.map((r, i) => (
                            <tr key={i}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div className={styles.avatar} style={{ background: r.color }}>{r.initials}</div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{r.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>{IC.mail} {r.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 500 }}>{r.company}</td>
                                <td style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>{IC.mapPin} {r.loc}</td>
                                <td>{IC.briefcase} {r.jobs}</td>
                                <td style={{ fontWeight: 600 }}>{r.hires}</td>
                                <td><span className={`${styles.badge} ${statusClass(r.status)}`}>{r.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        {r.status === 'Pending' && <button className={styles.successBtn}>Approve</button>}
                                        {r.status === 'Active' && <button className={styles.secondaryBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>View</button>}
                                        {r.status === 'Active' && <button className={styles.dangerBtn}>Suspend</button>}
                                        {r.status === 'Suspended' && <button className={styles.successBtn}>Reactivate</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
