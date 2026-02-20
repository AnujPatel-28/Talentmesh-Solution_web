"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './JobListings.module.css';

const categories = [
    {
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M9 7h6m-6 0V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6m-3 4v4m0 0H9m3 0h3" />
            </svg>
        ),
        label: 'Accounting',
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        label: 'Business & consulting',
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        label: 'Human research',
        active: true,
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
        ),
        label: 'Marketing and finance',
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
        label: 'Design & development',
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        label: 'Finance management',
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        label: 'Project management',
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        label: 'Customer services',
    },
];

const JobListings = () => {
    const [activeCategory, setActiveCategory] = useState<string>('Marketing and finance');

    // Group jobs by category for demo purposes. 
    // In a real app, you might fetch filtered jobs from an API.
    const allJobs = [
        // Accounting
        { id: 101, category: 'Accounting', title: 'Senior Tax Accountant', location: 'New York, NY', type: 'Full-Time', logo: 'AC', logoColor: '#fff', logoBg: '#2ecc71' },
        { id: 102, category: 'Accounting', title: 'Audit Manager', location: 'Chicago, IL', type: 'Full-Time', logo: 'AM', logoColor: '#fff', logoBg: '#3498db' },

        // Business & Consulting
        { id: 201, category: 'Business & consulting', title: 'Strategy Consultant', location: 'Boston, MA', type: 'Contract', logo: 'SC', logoColor: '#fff', logoBg: '#9b59b6' },
        { id: 202, category: 'Business & consulting', title: 'Business Analyst', location: 'Remote', type: 'Full-Time', logo: 'BA', logoColor: '#fff', logoBg: '#e67e22' },

        // Human Research
        { id: 301, category: 'Human research', title: 'UX Researcher', location: 'San Francisco, CA', type: 'Full-Time', logo: 'UX', logoColor: '#fff', logoBg: '#e74c3c' },
        { id: 302, category: 'Human research', title: 'Behavioral Scientist', location: 'London, UK', type: 'Part-Time', logo: 'BS', logoColor: '#fff', logoBg: '#f1c40f' },

        // Marketing & Finance (Default Active)
        { id: 1, category: 'Marketing and finance', title: 'Digital Marketing Manager', location: 'Tokyo, Japan', type: 'Internship', typeColor: 'blue', logo: 'DM', logoColor: '#1a73e8', logoBg: '#e8f0fe' },
        { id: 2, category: 'Marketing and finance', title: 'Financial Analyst', location: 'Mumbai, India', type: 'Full-Time', logo: 'FA', logoColor: '#ffffff', logoBg: '#3d5a99' },
        { id: 3, category: 'Marketing and finance', title: 'SEO Specialist', location: 'Remote', type: 'Part-Time', logo: 'SEO', logoColor: '#ffffff', logoBg: '#e05c2a' },

        // Design & Development
        { id: 401, category: 'Design & development', title: 'Senior Frontend Engineer', location: 'Miami, Florida', type: 'Freelance', logo: 'SF', logoColor: '#ffffff', logoBg: '#ff4500' },
        { id: 402, category: 'Design & development', title: 'Product Designer', location: 'Austin, TX', type: 'Full-Time', logo: 'PD', logoColor: '#ffffff', logoBg: '#8e44ad' },

        // Finance Management
        { id: 501, category: 'Finance management', title: 'CFO', location: 'New York, NY', type: 'Full-Time', logo: 'CF', logoColor: '#fff', logoBg: '#2c3e50' },

        // Project Management
        { id: 601, category: 'Project management', title: 'Technical Program Manager', location: 'Seattle, WA', type: 'Full-Time', logo: 'PM', logoColor: '#fff', logoBg: '#27ae60' },

        // Customer Services
        { id: 701, category: 'Customer services', title: 'Customer Success Manager', location: 'Dublin, Ireland', type: 'Full-Time', logo: 'CS', logoColor: '#fff', logoBg: '#d35400' },
    ];

    const filteredJobs = allJobs.filter(job => job.category === activeCategory);

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Find your <span className={styles.highlightText}>favorite job</span></h2>

                <div className={styles.layout}>
                    {/* Sidebar */}
                    <aside className={styles.sidebar}>
                        {categories.map((cat) => (
                            <button
                                key={cat.label}
                                className={`${styles.categoryItem} ${activeCategory === cat.label ? styles.categoryActive : ''}`}
                                onClick={() => setActiveCategory(cat.label)}
                            >
                                <span className={styles.categoryIcon}>{cat.icon}</span>
                                <span className={styles.categoryLabel}>{cat.label}</span>
                            </button>
                        ))}
                    </aside>

                    {/* Job Cards */}
                    <div className={styles.jobsPanel}>
                        <div className={styles.jobList}>
                            {filteredJobs.length > 0 ? (
                                filteredJobs.map((job) => (
                                    <div key={job.id} className={styles.jobCard}>
                                        <div className={styles.jobInfo}>
                                            <div
                                                className={styles.jobLogo}
                                                style={{ background: job.logoBg, color: job.logoColor }}
                                            >
                                                {job.logo}
                                            </div>
                                            <div className={styles.jobDetails}>
                                                <h3 className={styles.jobTitle}>{job.title}</h3>
                                                <p className={styles.jobLocation}>
                                                    <span className={styles.locationIcon}>📍</span>
                                                    {job.location}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.jobMeta}>
                                            <span className={`${styles.jobType} ${job.typeColor ? styles[`jobType_${job.typeColor}`] : ''}`}>
                                                {job.type}
                                            </span>
                                            <Link href="/jobs" className={styles.viewBtn}>
                                                View Job
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                                    No jobs found in this category.
                                </p>
                            )}
                        </div>

                        <div className={styles.browseWrapper}>
                            <Link href="/jobs" className={styles.browseBtn}>
                                Browse all jobs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default JobListings;
