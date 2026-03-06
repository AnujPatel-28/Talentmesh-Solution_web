"use client";
import React from 'react';
import styles from '../recruiter.module.css';

const IC = {
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
};

export default function RecruiterJobsPage() {
    const jobs = [
        { title: 'Senior Frontend Engineer', loc: 'Remote', posted: '2 days ago', applicants: 45, newCount: 8, status: 'Active' },
        { title: 'Backend Developer (Node.js)', loc: 'Bangalore, IN', posted: '5 days ago', applicants: 32, newCount: 5, status: 'Active' },
        { title: 'UI/UX Designer', loc: 'New York, NY', posted: '1 week ago', applicants: 28, newCount: 3, status: 'Active' },
        { title: 'Data Scientist', loc: 'San Francisco, CA', posted: '3 days ago', applicants: 19, newCount: 2, status: 'Active' },
        { title: 'DevOps Engineer', loc: 'Remote', posted: '2 weeks ago', applicants: 15, newCount: 0, status: 'Paused' },
    ];

    return (
        <div className={styles.jobsPage}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Job Postings</h1>
                <button className={styles.createBtn}>{IC.plus} Post a New Job</button>
            </div>
            {jobs.map((j, i) => (
                <div key={i} className={styles.jobPostCard}>
                    <div className={styles.jobPostBody}>
                        <span className={styles.jobPostTitle}>{j.title}</span>
                        <span className={styles.jobPostMeta}>{IC.mapPin} {j.loc} · Posted {j.posted}</span>
                        <div className={styles.jobPostStats}>
                            <span className={styles.jobPostStat}>{j.applicants} applicants</span>
                            <span className={styles.jobPostStat}>{j.newCount} new</span>
                            <span className={styles.jobPostStat} style={{ color: j.status === 'Active' ? '#10b981' : '#f59e0b' }}>● {j.status}</span>
                        </div>
                    </div>
                    <div className={styles.jobPostActions}>
                        <button className={styles.editBtn}>Edit</button>
                        <button className={styles.editBtn}>View Applicants</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
