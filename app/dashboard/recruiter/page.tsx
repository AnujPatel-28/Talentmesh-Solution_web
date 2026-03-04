"use client";
import React from 'react';
import styles from './recruiter.module.css';

export default function RecruiterDashboard() {
    const profileCompletion = 35;

    return (
        <div className={styles.dashboard}>
            <div className={styles.greeting}>
                <h1 className={styles.greetTitle}>Welcome back, Harper 👋</h1>
                <p className={styles.greetSub}>Here&apos;s your hiring pipeline overview</p>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📋</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>8</span>
                        <span className={styles.statLabel}>Open Positions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>👥</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>234</span>
                        <span className={styles.statLabel}>Total Applicants</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📅</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>6</span>
                        <span className={styles.statLabel}>This Week&apos;s Interviews</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>✅</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>15</span>
                        <span className={styles.statLabel}>Hires This Quarter</span>
                    </div>
                </div>
            </div>

            {/* Profile banner */}
            {profileCompletion < 50 && (
                <div className={styles.profileBanner}>
                    <div className={styles.bannerLeft}>
                        <span className={styles.bannerIcon}>🏢</span>
                        <div>
                            <h3 className={styles.bannerTitle}>Complete your company profile</h3>
                            <p className={styles.bannerText}>Companies with complete profiles attract 4× more candidates</p>
                        </div>
                    </div>
                    <div className={styles.bannerProgress}>
                        <div className={styles.bannerBar}>
                            <div className={styles.bannerFill} style={{ width: `${profileCompletion}%` }} />
                        </div>
                        <span className={styles.bannerPercent}>{profileCompletion}%</span>
                    </div>
                </div>
            )}

            <div className={styles.grid2}>
                {/* Active Positions */}
                <div className={styles.panel}>
                    <h2 className={styles.panelTitle}>Active Positions</h2>
                    <div className={styles.jobList}>
                        {[
                            { title: 'Senior Frontend Engineer', applicants: 45, new: 8, status: 'Active' },
                            { title: 'Backend Developer (Node.js)', applicants: 32, new: 5, status: 'Active' },
                            { title: 'UI/UX Designer', applicants: 28, new: 3, status: 'Active' },
                        ].map((job, i) => (
                            <div key={i} className={styles.jobItem}>
                                <div className={styles.jobInfo}>
                                    <span className={styles.jobTitle}>{job.title}</span>
                                    <span className={styles.jobMeta}>{job.applicants} applicants · {job.new} new</span>
                                </div>
                                <span className={styles.jobStatus}>{job.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Candidates */}
                <div className={styles.panel}>
                    <h2 className={styles.panelTitle}>Top Candidates</h2>
                    <div className={styles.candidateList}>
                        {[
                            { name: 'Arjun Patel', role: 'Frontend Engineer', match: '96%', skills: 'React, TypeScript' },
                            { name: 'Priya Sharma', role: 'Full Stack Developer', match: '92%', skills: 'Node.js, React' },
                            { name: 'Alex Johnson', role: 'UI/UX Designer', match: '89%', skills: 'Figma, Adobe XD' },
                        ].map((c, i) => (
                            <div key={i} className={styles.candidateItem}>
                                <div className={styles.candidateAvatar}>{c.name.split(' ').map(n => n[0]).join('')}</div>
                                <div className={styles.candidateInfo}>
                                    <span className={styles.candidateName}>{c.name}</span>
                                    <span className={styles.candidateMeta}>{c.role} · {c.skills}</span>
                                </div>
                                <span className={styles.candidateMatch}>{c.match}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
