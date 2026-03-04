"use client";
import React from 'react';
import styles from './candidate.module.css';

export default function CandidateDashboard() {
    const profileCompletion = 35;

    return (
        <div className={styles.dashboard}>
            <div className={styles.greeting}>
                <h1 className={styles.greetTitle}>Welcome back, Raj 👋</h1>
                <p className={styles.greetSub}>Here&apos;s what&apos;s happening with your job search</p>
            </div>

            {/* Stats Row */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📨</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>12</span>
                        <span className={styles.statLabel}>Applications</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>👀</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>48</span>
                        <span className={styles.statLabel}>Profile Views</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📅</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>3</span>
                        <span className={styles.statLabel}>Interviews</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>💼</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>156</span>
                        <span className={styles.statLabel}>Job Matches</span>
                    </div>
                </div>
            </div>

            {/* Profile completion banner */}
            {profileCompletion < 50 && (
                <div className={styles.profileBanner}>
                    <div className={styles.bannerLeft}>
                        <span className={styles.bannerIcon}>⚡</span>
                        <div>
                            <h3 className={styles.bannerTitle}>Complete your profile to get more matches</h3>
                            <p className={styles.bannerText}>Profiles with 50%+ completion get 3× more views from recruiters</p>
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
                {/* Recommended Jobs */}
                <div className={styles.panel}>
                    <h2 className={styles.panelTitle}>Recommended for you</h2>
                    <div className={styles.jobList}>
                        {[
                            { title: 'Senior Frontend Engineer', company: 'Razorpay', loc: 'Bangalore, IN', salary: '₹30-45L', tag: '95% match' },
                            { title: 'React Developer', company: 'Flipkart', loc: 'Mumbai, IN', salary: '₹25-35L', tag: '88% match' },
                            { title: 'Full Stack Developer', company: 'Stripe', loc: 'Remote, USA', salary: '$130-170K', tag: '82% match' },
                        ].map((job, i) => (
                            <div key={i} className={styles.jobItem}>
                                <div className={styles.jobInfo}>
                                    <span className={styles.jobTitle}>{job.title}</span>
                                    <span className={styles.jobMeta}>{job.company} · {job.loc}</span>
                                    <span className={styles.jobSalary}>{job.salary}</span>
                                </div>
                                <span className={styles.jobTag}>{job.tag}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Interviews */}
                <div className={styles.panel}>
                    <h2 className={styles.panelTitle}>Upcoming Interviews</h2>
                    <div className={styles.interviewList}>
                        {[
                            { company: 'Razorpay', role: 'Senior Frontend', date: 'Today, 3:00 PM', type: 'Video Call' },
                            { company: 'Flipkart', role: 'React Developer', date: 'Mar 5, 11:00 AM', type: 'On-site' },
                            { company: 'Stripe', role: 'Full Stack Dev', date: 'Mar 8, 2:00 PM', type: 'Video Call' },
                        ].map((int, i) => (
                            <div key={i} className={styles.interviewItem}>
                                <div className={styles.interviewDate}>{int.date}</div>
                                <div className={styles.interviewInfo}>
                                    <span className={styles.interviewRole}>{int.role}</span>
                                    <span className={styles.interviewCompany}>{int.company} · {int.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
