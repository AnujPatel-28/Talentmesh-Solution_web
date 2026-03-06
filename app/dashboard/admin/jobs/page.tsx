"use client";
import React, { useState } from 'react';
import styles from '../admin.module.css';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
};

const ALL_JOBS = [
    { id: 1, title: 'Senior AI Researcher', company: 'Quantum Leap', loc: 'Palo Alto', status: 'Active', applicants: 45, posted: 'Mar 1', recruiter: 'Harper Reid' },
    { id: 2, title: 'Product Designer', company: 'VividOps', loc: 'Remote', status: 'Active', applicants: 32, posted: 'Mar 2', recruiter: 'Harper Reid' },
    { id: 3, title: 'Blockchain Architect', company: 'DefiCore', loc: 'Singapore', status: 'Pending', applicants: 18, posted: 'Mar 3', recruiter: 'Raj Malhotra' },
    { id: 4, title: 'Growth Engineer', company: 'ScaleUp', loc: 'New York', status: 'Active', applicants: 27, posted: 'Mar 4', recruiter: 'Emily Zhang' },
    { id: 5, title: 'ML Infrastructure Lead', company: 'DataFlux', loc: 'Berlin', status: 'Flagged', applicants: 12, posted: 'Mar 5', recruiter: 'Harper Reid' },
    { id: 6, title: 'Head of Product', company: 'Aether', loc: 'London', status: 'Active', applicants: 56, posted: 'Mar 1', recruiter: 'Emily Zhang' },
    { id: 7, title: 'Backend Engineer', company: 'Zoho', loc: 'Chennai', status: 'Closed', applicants: 41, posted: 'Feb 28', recruiter: 'Raj Malhotra' },
    { id: 8, title: 'Data Scientist', company: 'Wipro', loc: 'Hyderabad', status: 'Active', applicants: 38, posted: 'Mar 1', recruiter: 'Raj Malhotra' },
];

const statusClass = (s: string) => {
    if (s === 'Active') return styles.badgeActive;
    if (s === 'Pending') return styles.badgeNew;
    if (s === 'Flagged') return styles.badgePending;
    return styles.badgeClosed;
};

export default function AdminJobsPage() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Manage Jobs</h1>
                    <p className={styles.pageSub}>Post, edit, and manage all job listings across the platform</p>
                </div>
                <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
                    {IC.plus} Post New Job
                </button>
            </div>

            {/* Post Job Form */}
            {showForm && (
                <div className={styles.card} style={{ borderColor: 'var(--primary-blue)', borderWidth: 2 }}>
                    <h3 className={styles.cardTitle}>Create Job Posting</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Job Title</label>
                            <input style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} placeholder="e.g. Senior Frontend Engineer" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Company</label>
                            <input style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} placeholder="e.g. Google" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Location</label>
                            <input style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} placeholder="e.g. Remote, New York" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Salary Range</label>
                            <input style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} placeholder="e.g. $120k - $180k" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Description</label>
                            <textarea rows={3} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} placeholder="Job description..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Job Type</label>
                            <select style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}>
                                <option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Remote</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Assign Recruiter</label>
                            <select style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}>
                                <option>Harper Reid</option><option>Emily Zhang</option><option>Raj Malhotra</option><option>Admin (Self)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className={styles.primaryBtn}>Publish Job</button>
                        <button className={styles.secondaryBtn} onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className={styles.searchRow}>
                <div className={styles.searchBar}>
                    {IC.search}
                    <input placeholder="Search jobs by title, company, or recruiter..." />
                </div>
                <button className={styles.filterBtn}>Status</button>
                <button className={styles.filterBtn}>{IC.mapPin} Location</button>
            </div>

            {/* Jobs Table */}
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Job Title</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Recruiter</th>
                            <th>Status</th>
                            <th>Applicants</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ALL_JOBS.map(j => (
                            <tr key={j.id}>
                                <td style={{ fontWeight: 600 }}>{j.title}</td>
                                <td>{j.company}</td>
                                <td style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{IC.mapPin} {j.loc}</td>
                                <td>{j.recruiter}</td>
                                <td><span className={`${styles.badge} ${statusClass(j.status)}`}>{j.status}</span></td>
                                <td>{j.applicants}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button className={styles.secondaryBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Edit</button>
                                        {j.status === 'Pending' && <button className={styles.successBtn}>Approve</button>}
                                        {j.status === 'Flagged' && <button className={styles.dangerBtn}>Remove</button>}
                                        {j.status === 'Active' && <button className={styles.dangerBtn}>Pause</button>}
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
