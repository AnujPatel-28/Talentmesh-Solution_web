"use client";
import React from 'react';
import styles from '../../../shared-dashboard.module.css';

const IC = {
    mapPin: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    star: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
};

export default function CandidatesPage() {
    const candidates = [
        { name: 'Arjun Patel', role: 'Senior Frontend Engineer', loc: 'Bangalore, IN', match: 96, skills: ['React', 'TypeScript', 'Next.js', 'CSS'] },
        { name: 'Priya Sharma', role: 'Full Stack Developer', loc: 'Mumbai, IN', match: 92, skills: ['Node.js', 'React', 'PostgreSQL'] },
        { name: 'Alex Johnson', role: 'UI/UX Designer', loc: 'San Francisco, CA', match: 89, skills: ['Figma', 'Adobe XD', 'Prototyping'] },
        { name: 'Ravi Kumar', role: 'Backend Developer', loc: 'Hyderabad, IN', match: 87, skills: ['Python', 'Django', 'Docker'] },
        { name: 'Emily Chen', role: 'Data Scientist', loc: 'Seattle, WA', match: 85, skills: ['Python', 'ML', 'TensorFlow'] },
        { name: 'David Park', role: 'DevOps Engineer', loc: 'Remote', match: 82, skills: ['AWS', 'Kubernetes', 'CI/CD'] },
    ];

    return (
        <div className={styles.candPage}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Candidates</h1>
            </div>
            <div className={styles.candGrid}>
                {candidates.map((c, i) => (
                    <div key={i} className={styles.candFullCard}>
                        <div className={styles.candFullHead}>
                            <div className={styles.candFullAvatar}>{c.name.split(' ').map(n => n[0]).join('')}</div>
                            <div>
                                <div className={styles.candFullName}>{c.name}</div>
                                <div className={styles.candFullRole}>{c.role}</div>
                            </div>
                        </div>
                        <div className={styles.candFullTags}>
                            {c.skills.map(s => <span key={s} className={styles.candFullTag}>{s}</span>)}
                        </div>
                        <div className={styles.candFullFoot}>
                            <span className={styles.candFullLoc}>{IC.mapPin} {c.loc}</span>
                            <span className={styles.candFullMatch}>{IC.star} {c.match}% match</span>
                        </div>
                        <div className={styles.candFullActions}>
                            <button className={styles.candViewBtn}>View Profile</button>
                            <button className={styles.candSaveBtn}>{IC.bookmark}</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
