import Link from 'next/link';
import styles from './landing.module.css';

const Features = () => {
    return (
        <section className={styles.features}>
            <div className={styles.featureContainer}>
                {/* Header */}
                <div className={styles.featureHeader}>
                    <div className={styles.badge}>FOR EMPLOYERS</div>
                    <h2 className={styles.sectionTitle}>
                        Hire the best talent, faster.
                    </h2>
                    <p className={styles.sectionDesc}>
                        Automate your hiring pipeline with our Employer Dashboard. Post jobs, track applicants, and schedule interviews in one place.
                    </p>
                </div>

                {/* Features Grid */}
                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <h3>Job Post Generator</h3>
                        <p>Generate detailed job descriptions in seconds using just a title and keywords.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <h3>Smart Screening</h3>
                        <p>Automatically rank candidates based on fit score. No more manual resume sifting.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                        </div>
                        <h3>Direct Messaging</h3>
                        <p>Chat directly with top candidates. Schedule interviews with calendar integration.</p>
                    </div>
                </div>

                <div className={styles.featureAction}>
                    <Link href="/employer/signup" className={styles.ctaBtn}>
                        Start Hiring Now
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Features;
