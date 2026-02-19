"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './JobListings.module.css';

const categories = [
    { icon: '💰', label: 'Accounting' },
    { icon: '🤝', label: 'Business & consulting' },
    { icon: '🔬', label: 'Human research', active: true },
    { icon: '📊', label: 'Marketing and finance' },
    { icon: '🎨', label: 'Design & development' },
    { icon: '💼', label: 'Finance management' },
    { icon: '📋', label: 'Project management' },
    { icon: '🌐', label: 'Customer services' },
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
                <h2 className={styles.title}>Find your favorite job</h2>

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
