"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../candidate.module.css';

/* ─── Icons ─── */
const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    mapPin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    dollar: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    briefcase: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    alert: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    bookmark: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    clock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    cal: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
};

import { JOBS } from '../../../browse-jobs/jobsData';

export default function JobsPage() {

    return (
        <div className={styles.jobsPage}>
            <div className={styles.searchRow}>
                <div className={styles.searchBarFull}>
                    {IC.search}
                    <input placeholder="Search job title, keyword, or company" />
                </div>
                <button className={styles.filterBtn}>{IC.mapPin} Location</button>
                <button className={styles.filterBtn}>{IC.dollar} Salary</button>
                <button className={styles.filterBtn}>{IC.briefcase} Job Type</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Recommended for You</h2>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Based on your profile and recent activity</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                {JOBS.map((j) => (
                    <Link key={j.id} href={`/dashboard/candidate/jobs/${j.id}`} style={{ textDecoration: 'none' }}>
                        <div className={styles.jobListCard} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.2rem', gap: '1rem', borderRadius: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className={styles.jobListIcon} style={{ background: j.color + '18', color: j.color, width: 44, height: 44, fontSize: '1.1rem' }}>
                                    {j.logo || j.company[0]}
                                </div>
                                <span className={styles.jobListMatch} style={{ background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: 12 }}>{j.match}% Match</span>
                            </div>

                            <div className={styles.jobListBody}>
                                <span className={styles.jobListTitle} style={{ fontSize: '1rem' }}>{j.title}</span>
                                <span className={styles.jobListCompany} style={{ fontSize: '0.8rem', marginTop: 4 }}>{j.company} · {j.location}</span>
                                <div className={styles.jobListMeta} style={{ marginTop: '0.8rem', gap: '0.5rem' }}>
                                    <span className={styles.jobListTag} style={{ background: '#f8fafc', padding: '0.3rem 0.6rem', fontSize: '0.65rem' }}>{IC.dollar} {j.salary}</span>
                                    <span className={styles.jobListTag} style={{ background: '#f8fafc', padding: '0.3rem 0.6rem', fontSize: '0.65rem' }}>{IC.briefcase} {j.type}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                    {[j.industry, j.exp].filter(Boolean).map(t => <span key={t} className={styles.jobListTag} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.15rem 0.4rem' }}>{t}</span>)}
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    View Job <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
