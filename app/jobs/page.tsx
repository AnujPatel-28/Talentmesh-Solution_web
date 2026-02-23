"use client";
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './jobs.module.css';

// --- Premium Custom Icons ---
const IconSearch = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
);

const IconLocation = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

const IconFilter = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

const IconSparkle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" />
    </svg>
);

const IconClose = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18M6 6l12 12" />
    </svg>
);

const JOBS_DATA = [
    { id: 1, title: "Senior AI Researcher", company: "Quantum Leap", location: "Palo Alto", salary: 220000, salaryLabel: "$190k - $260k", type: "Full-time", expertise: "Engineering", logo: "QL" },
    { id: 2, title: "Product Designer", company: "VividOps", location: "Remote", salary: 150000, salaryLabel: "$130k - $170k", type: "Full-time", expertise: "Design", logo: "VO" },
    { id: 3, title: "Blockchain Architect", company: "DefiCore", location: "Singapore", salary: 180000, salaryLabel: "$150k - $210k", type: "Contract", expertise: "Engineering", logo: "DC" },
    { id: 4, title: "Growth Engineer", company: "ScaleUp", location: "New York", salary: 160000, salaryLabel: "$140k - $185k", type: "Full-time", expertise: "Marketing", logo: "SU" },
    { id: 5, title: "ML Infrastructure", company: "DataFlux", location: "Berlin", salary: 135000, salaryLabel: "$110k - $160k", type: "Full-time", expertise: "Engineering", logo: "DF" },
    { id: 6, title: "Head of Product", company: "Aether", location: "London", salary: 205000, salaryLabel: "$180k - $230k", type: "Full-time", expertise: "Product", logo: "AE" }
];

const PARTNERS = ["Artificial Intelligence", "Fintech Frontier", "Cyber Security", "Quantum Future", "Blockchain Vision", "Deep Learning", "SaaS Excellence"];

export default function JobsPage() {
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
    const [selectedCommitment, setSelectedCommitment] = useState<string[]>([]);
    const [minSalary, setMinSalary] = useState<number>(0);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredJobs = useMemo(() => {
        return JOBS_DATA.filter(job => {
            const matchesExpertise = selectedExpertise.length === 0 || selectedExpertise.includes(job.expertise);
            const matchesCommitment = selectedCommitment.length === 0 || selectedCommitment.includes(job.type);
            const matchesSalary = job.salary >= minSalary;
            const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.company.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesExpertise && matchesCommitment && matchesSalary && matchesSearch;
        });
    }, [selectedExpertise, selectedCommitment, minSalary, searchQuery]);

    const toggleExpertise = (val: string) => {
        setSelectedExpertise(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
    };

    const toggleCommitment = (val: string) => {
        setSelectedCommitment(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
    };

    const SidebarContent = () => (
        <>
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Expertise</label>
                {['Engineering', 'Design', 'Marketing', 'Product', 'Operations'].map(item => (
                    <label key={item} className={styles.filterOption}>
                        <input
                            type="checkbox"
                            checked={selectedExpertise.includes(item)}
                            onChange={() => toggleExpertise(item)}
                        />
                        <span>{item}</span>
                    </label>
                ))}
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Commitment</label>
                {['Full-time', 'Contract', 'Part-time'].map(item => (
                    <label key={item} className={styles.filterOption}>
                        <input
                            type="checkbox"
                            checked={selectedCommitment.includes(item)}
                            onChange={() => toggleCommitment(item)}
                        />
                        <span>{item}</span>
                    </label>
                ))}
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Min Compensation</label>
                {[0, 100000, 150000, 200000].map(val => (
                    <label key={val} className={styles.filterOption}>
                        <input
                            type="radio"
                            name="salary"
                            checked={minSalary === val}
                            onChange={() => setMinSalary(val)}
                        />
                        <span>{val === 0 ? "Any Salary" : `$${val / 1000}k+`}</span>
                    </label>
                ))}
            </div>
        </>
    );

    return (
        <main style={{ background: '#fff' }}>
            {/* 1. Hero Section */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>
                            <IconSparkle /> Network Latency: 24ms (Optimized)
                        </div>
                        <h1 className={styles.title}>
                            Explore your <br />
                            <span className={styles.highlight}>next chapter.</span>
                        </h1>
                        <p className={styles.description}>
                            Access the world's most innovative roles in AI, Fintech, and SaaS.
                            Our board is refreshed every 15 minutes with vetted opportunities.
                        </p>

                        <div className={styles.searchBar}>
                            <div className={styles.searchField}>
                                <IconSearch />
                                <input
                                    type="text"
                                    placeholder="Job title or company"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className={styles.searchField}>
                                <IconLocation />
                                <input type="text" placeholder="Remote or City" />
                            </div>
                            <button className={styles.searchBtn}>Search</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Brand Marquee */}
            <div className={styles.partnerMarquee}>
                <div className={styles.marqueeContent}>
                    {[...PARTNERS, ...PARTNERS].map((p, i) => (
                        <span key={i} className={styles.partnerName}>{p}</span>
                    ))}
                </div>
            </div>

            {/* 3. Job Explorer */}
            <section className={styles.discoverySection}>
                <div className="premium-container">
                    <div className={styles.jobGridContainer}>
                        {/* Desktop Sidebar */}
                        <aside className={styles.sidebar}>
                            <SidebarContent />
                        </aside>

                        {/* Main Grid */}
                        <div>
                            <div className={styles.gridHeader}>
                                <h2 className={styles.resultsCount}>{filteredJobs.length} Opportunities Found</h2>
                                <button
                                    className={styles.mobileFilterToggle}
                                    onClick={() => setIsMobileFilterOpen(true)}
                                >
                                    <IconFilter /> Filters
                                </button>
                                <div className={styles.sortWrapper}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>Sort by:</span>
                                    <select className={styles.sortSelect}>
                                        <option>Recommended</option>
                                        <option>Newest</option>
                                        <option>Highest Salary</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.jobGrid}>
                                {filteredJobs.length > 0 ? (
                                    filteredJobs.map((job) => (
                                        <div key={job.id} className={styles.jobCard}>
                                            <div className={styles.jobHeader}>
                                                <div className={styles.companyLogo} style={{ background: 'var(--primary-blue)' }}>
                                                    {job.logo}
                                                </div>
                                                <div className={styles.salaryTag}>{job.salaryLabel}</div>
                                            </div>
                                            <h3 className={styles.jobTitle}>{job.title}</h3>
                                            <span className={styles.companyName}>{job.company}</span>
                                            <div className={styles.jobMeta}>
                                                <div className={styles.metaItem}><IconLocation /> {job.location}</div>
                                                <div className={styles.typeBadge}>{job.type}</div>
                                                <div className={styles.expertiseBadge}>{job.expertise}</div>
                                            </div>
                                            <div className={styles.jobFooter}>
                                                <span className={styles.postedTime}>Active Now</span>
                                                <Link href={`/jobs/${job.id}`} className={styles.viewBtn}>
                                                    View Details <IconArrowRight />
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>
                                        <h3>No results found</h3>
                                        <p>Try adjusting your search or filters to find more opportunities.</p>
                                        <button onClick={() => {
                                            setSelectedExpertise([]);
                                            setSelectedCommitment([]);
                                            setMinSalary(0);
                                            setSearchQuery("");
                                        }} className={styles.resetBtn}>Reset All Filters</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Mobile Filter Drawer */}
            <div className={`${styles.mobileDrawer} ${isMobileFilterOpen ? styles.drawerOpen : ''}`}>
                <div className={styles.drawerHeader}>
                    <h3>Filters</h3>
                    <button onClick={() => setIsMobileFilterOpen(false)}><IconClose /></button>
                </div>
                <div className={styles.drawerBody}>
                    <SidebarContent />
                </div>
                <div className={styles.drawerFooter}>
                    <button onClick={() => setIsMobileFilterOpen(false)} className={styles.applyFiltersBtn}>Show {filteredJobs.length} results</button>
                </div>
            </div>

            {/* 5. Insight Section */}
            <section className={styles.insightSection}>
                <div className="premium-container">
                    <div className={styles.insightGrid}>
                        <div className={styles.insightContent}>
                            <div className={styles.insightBadge}>
                                <IconSparkle />
                                <span>Market Pulse AI</span>
                            </div>
                            <h2 className={styles.insightTitle}>Live Market <br /> Intelligence.</h2>
                            <p className={styles.insightText}>
                                Our engine doesn't just list jobs. It analyzes global hiring trends to help you negotiate like a pro and target companies with high retention.
                            </p>

                            <div className={styles.insightFeatures}>
                                <div className={styles.insightFeature}>
                                    <h4>Salary Benchmarking</h4>
                                    <p>Real-time compensation data mapped to your specific seniority.</p>
                                </div>
                                <div className={styles.insightFeature}>
                                    <h4>Hiring Velocity</h4>
                                    <p>Track how fast roles are closing and identify aggressive recruiters.</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.visualContainer}>
                            <div className={styles.glow}></div>
                            <div className={styles.dataCard} style={{ top: '10%', left: '10%' }}>
                                <div className={styles.dataLabel}>AVG SALARY TREND</div>
                                <div className={styles.dataValue}>+12.4%</div>
                                <div className={styles.dataDesc}>AI Roles YoY Growth</div>
                            </div>
                            <div className={styles.dataCard} style={{ bottom: '15%', right: '10%' }}>
                                <div className={styles.dataLabel}>HIRING VELOCITY</div>
                                <div className={styles.dataValue}>8.2 Days</div>
                                <div className={styles.dataDesc}>Avg. Time to Offer</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Custom CTA */}
            <section className={styles.ctaSection}>
                <div className="premium-container">
                    <div className={styles.ctaCard}>
                        <h2 className={styles.ctaTitle}>Stay ahead of the curve.</h2>
                        <p className={styles.ctaDesc}>
                            Join 5,000+ engineers receiving curated opportunities before they go public.
                        </p>
                        <div className={styles.ctaButtons}>
                            <Link href="/register" className={styles.primaryCta}>Get Early Access</Link>
                            <Link href="/how-it-works" className={styles.secondaryCta}>See Pricing</Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
