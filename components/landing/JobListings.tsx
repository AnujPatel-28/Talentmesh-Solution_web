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

const jobs = [
    {
        id: 1,
        title: 'Digital Marketing Manager',
        location: 'Tokyo, Japan',
        type: 'Internship',
        typeColor: 'blue',
        logo: 'DM',
        logoColor: '#1a73e8',
        logoBg: '#e8f0fe',
    },
    {
        id: 2,
        title: 'Fresher Dev-Ops Engineer',
        location: 'Remote',
        type: 'Part-Time',
        typeColor: 'default',
        logo: 'in',
        logoColor: '#ffffff',
        logoBg: '#e05c2a',
    },
    {
        id: 3,
        title: 'Technology Analyst: Data Science',
        location: 'Mumbai, India',
        type: 'Full-Time',
        typeColor: 'default',
        logo: 'TA',
        logoColor: '#ffffff',
        logoBg: '#3d5a99',
    },
    {
        id: 4,
        title: 'Senior Frontend Engineer',
        location: 'Miami, Florida',
        type: 'Freelance',
        typeColor: 'default',
        logo: 'SF',
        logoColor: '#ffffff',
        logoBg: '#ff4500',
    },
    {
        id: 5,
        title: 'Android developer',
        location: 'London, UK',
        type: 'Freelance',
        typeColor: 'default',
        logo: 'AD',
        logoColor: '#ffffff',
        logoBg: '#e91e8c',
    },
];

const JobListings = () => {
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
                                className={`${styles.categoryItem} ${cat.active ? styles.categoryActive : ''}`}
                            >
                                <span className={styles.categoryIcon}>{cat.icon}</span>
                                <span className={styles.categoryLabel}>{cat.label}</span>
                            </button>
                        ))}
                    </aside>

                    {/* Job Cards */}
                    <div className={styles.jobsPanel}>
                        <div className={styles.jobList}>
                            {jobs.map((job) => (
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
                                        <span className={`${styles.jobType} ${styles[`jobType_${job.typeColor}`]}`}>
                                            {job.type}
                                        </span>
                                        <Link href="/jobs" className={styles.viewBtn}>
                                            View Job
                                        </Link>
                                    </div>
                                </div>
                            ))}
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
