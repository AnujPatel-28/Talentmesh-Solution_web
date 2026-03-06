"use client";
import React from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    briefcase: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    trending: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
};

const STATS = [
    { label: 'Total Jobs', value: '248', change: '+12 this week', color: '#eff6ff', iconBg: 'linear-gradient(135deg, #007BFF, #2563eb)' },
    { label: 'Candidates', value: '1,847', change: '+89 this week', color: '#f0fdf4', iconBg: 'linear-gradient(135deg, #10b981, #059669)' },
    { label: 'Recruiters', value: '42', change: '+3 this month', color: '#fefce8', iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { label: 'Pending Actions', value: '37', change: '5 urgent', color: '#fef2f2', iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
];

const RECENT_ACTIVITY = [
    { text: 'New recruiter TechCorp Inc. registered and awaiting approval', time: '5 mins ago', color: '#3b82f6' },
    { text: 'Arjun Patel applied to Senior Frontend Engineer at Google', time: '12 mins ago', color: '#10b981' },
    { text: 'Job posting "Data Scientist" by Wipro was flagged for review', time: '30 mins ago', color: '#f59e0b' },
    { text: 'Recruiter Harper Reid updated 3 job postings', time: '1 hour ago', color: '#8b5cf6' },
    { text: 'Candidate Priya Sharma was accepted for Product Manager role', time: '2 hours ago', color: '#10b981' },
];

const PENDING_JOBS = [
    { title: 'Cloud Solutions Architect', company: 'TCS', status: 'Pending Review', date: 'Mar 5', applicants: 24 },
    { title: 'Backend Engineer', company: 'Zoho', status: 'Flagged', date: 'Mar 4', applicants: 18 },
    { title: 'Marketing Head', company: 'Meesho', status: 'Pending Review', date: 'Mar 3', applicants: 31 },
];

export default function AdminPage() {
    return (
        <div className={styles.dash}>
            {/* Greeting Banner */}
            <div className={styles.greetBanner}>
                <h1 className={styles.greetTitle}>Admin Control Center</h1>
                <p className={styles.greetSub}>Monitor platform activity, manage jobs, and oversee all users from one place.</p>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                {STATS.map((s, i) => (
                    <div key={i} className={styles.stat}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>{s.label}</span>
                            <div className={styles.statBox} style={{ background: s.iconBg }}>
                                {i === 0 ? IC.briefcase : i === 1 ? IC.users : i === 2 ? IC.shield : IC.briefcase}
                            </div>
                        </div>
                        <span className={styles.statVal}>{s.value}</span>
                        <span className={styles.statChange}>{IC.trending} {s.change}</span>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className={styles.quickGrid}>
                <Link href="/dashboard/admin/jobs" className={styles.quickCard}>
                    <div className={styles.quickIcon} style={{ background: 'linear-gradient(135deg, #007BFF, #2563eb)' }}>{IC.briefcase}</div>
                    <span className={styles.quickLabel}>Post a Job</span>
                    <span className={styles.quickHint}>Create job listings on behalf of recruiters</span>
                </Link>
                <Link href="/dashboard/admin/candidates" className={styles.quickCard}>
                    <div className={styles.quickIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>{IC.users}</div>
                    <span className={styles.quickLabel}>Review Candidates</span>
                    <span className={styles.quickHint}>Accept or reject pending applications</span>
                </Link>
                <Link href="/dashboard/admin/recruiters" className={styles.quickCard}>
                    <div className={styles.quickIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>{IC.shield}</div>
                    <span className={styles.quickLabel}>Manage Recruiters</span>
                    <span className={styles.quickHint}>Handle recruiter accounts and issues</span>
                </Link>
            </div>

            {/* Main Grid */}
            <div className={styles.mainGrid}>
                <div className={styles.leftCol}>
                    {/* Pending Jobs */}
                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <h2 className={styles.cardTitle}>Pending Job Reviews</h2>
                            <Link href="/dashboard/admin/jobs" className={styles.viewAll}>View All</Link>
                        </div>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Applicants</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PENDING_JOBS.map((j, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{j.title}</td>
                                        <td>{j.company}</td>
                                        <td>
                                            <span className={`${styles.badge} ${j.status === 'Flagged' ? styles.badgePending : styles.badgeNew}`}>
                                                {j.status}
                                            </span>
                                        </td>
                                        <td>{j.applicants}</td>
                                        <td>
                                            <button className={styles.successBtn}>Approve</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.rightCol}>
                    {/* Activity Feed */}
                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <h2 className={styles.cardTitle}>Recent Activity</h2>
                        </div>
                        {RECENT_ACTIVITY.map((a, i) => (
                            <div key={i} className={styles.actItem}>
                                <div className={styles.actDot} style={{ background: a.color }} />
                                <div className={styles.actBody}>
                                    <span className={styles.actText}>{a.text}</span>
                                    <span className={styles.actTime}>{a.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
