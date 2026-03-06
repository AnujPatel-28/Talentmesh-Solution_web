"use client";
import React from 'react';
import styles from '../admin.module.css';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
    x: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    mail: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
};

const CANDIDATES = [
    { name: 'Arjun Patel', email: 'arjun@email.com', role: 'Senior Frontend Engineer', company: 'Google', loc: 'Bangalore', status: 'Pending', match: 96, applied: 'Mar 3', initials: 'AP', color: '#0D47A1' },
    { name: 'Priya Sharma', email: 'priya@email.com', role: 'Product Manager', company: 'Flipkart', loc: 'Mumbai', status: 'Shortlisted', match: 92, applied: 'Mar 2', initials: 'PS', color: '#1565C0' },
    { name: 'Alex Johnson', email: 'alex.j@email.com', role: 'UI/UX Designer', company: 'Razorpay', loc: 'San Francisco', status: 'Pending', match: 89, applied: 'Mar 4', initials: 'AJ', color: '#1E88E5' },
    { name: 'Ravi Kumar', email: 'ravi@email.com', role: 'Backend Developer', company: 'Zoho', loc: 'Hyderabad', status: 'Accepted', match: 87, applied: 'Feb 28', initials: 'RK', color: '#2196F3' },
    { name: 'Emily Chen', email: 'emily@email.com', role: 'Data Scientist', company: 'Wipro', loc: 'Seattle', status: 'Rejected', match: 85, applied: 'Mar 1', initials: 'EC', color: '#42A5F5' },
    { name: 'David Park', email: 'david@email.com', role: 'DevOps Engineer', company: 'CloudNine', loc: 'Remote', status: 'Pending', match: 82, applied: 'Mar 5', initials: 'DP', color: '#0D47A1' },
    { name: 'Neha Gupta', email: 'neha@email.com', role: 'Growth Marketing', company: 'Meesho', loc: 'Delhi', status: 'Shortlisted', match: 78, applied: 'Mar 4', initials: 'NG', color: '#1565C0' },
    { name: 'James Wilson', email: 'james@email.com', role: 'Cloud Architect', company: 'TCS', loc: 'Mumbai', status: 'Pending', match: 89, applied: 'Mar 6', initials: 'JW', color: '#1E88E5' },
];

const statusClass = (s: string) => {
    if (s === 'Accepted') return styles.badgeActive;
    if (s === 'Shortlisted') return styles.badgeNew;
    if (s === 'Pending') return styles.badgePending;
    return styles.badgeClosed;
};

export default function AdminCandidatesPage() {
    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Manage Candidates</h1>
                    <p className={styles.pageSub}>Review, accept, or reject candidate applications across all jobs</p>
                </div>
            </div>

            {/* Search */}
            <div className={styles.searchRow}>
                <div className={styles.searchBar}>
                    {IC.search}
                    <input placeholder="Search candidates by name, role, or company..." />
                </div>
                <button className={styles.filterBtn}>Status</button>
                <button className={styles.filterBtn}>Match Score</button>
            </div>

            {/* Stats Bar */}
            <div className={styles.stats} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className={styles.stat}><span className={styles.statLabel}>Total</span><span className={styles.statVal}>1,847</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Pending</span><span className={styles.statVal} style={{ color: '#d97706' }}>312</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Accepted</span><span className={styles.statVal} style={{ color: '#16a34a' }}>1,203</span></div>
                <div className={styles.stat}><span className={styles.statLabel}>Rejected</span><span className={styles.statVal} style={{ color: '#dc2626' }}>332</span></div>
            </div>

            {/* Table */}
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Applied For</th>
                            <th>Company</th>
                            <th>Match</th>
                            <th>Status</th>
                            <th>Applied</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {CANDIDATES.map((c, i) => (
                            <tr key={i}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div className={styles.avatar} style={{ background: c.color }}>{c.initials}</div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>{IC.mail} {c.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 500 }}>{c.role}</td>
                                <td>{c.company}</td>
                                <td><span style={{ fontWeight: 700, color: c.match >= 90 ? '#16a34a' : c.match >= 80 ? 'var(--primary-blue)' : '#64748b' }}>{c.match}%</span></td>
                                <td><span className={`${styles.badge} ${statusClass(c.status)}`}>{c.status}</span></td>
                                <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.applied}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        {c.status === 'Pending' && (
                                            <>
                                                <button className={styles.successBtn} title="Accept">{IC.check} Accept</button>
                                                <button className={styles.dangerBtn} title="Reject">{IC.x} Reject</button>
                                            </>
                                        )}
                                        {c.status === 'Shortlisted' && (
                                            <button className={styles.successBtn}>Accept</button>
                                        )}
                                        {(c.status === 'Accepted' || c.status === 'Rejected') && (
                                            <button className={styles.secondaryBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>View</button>
                                        )}
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
