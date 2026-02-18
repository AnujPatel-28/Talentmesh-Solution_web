import Link from 'next/link';
import styles from './landing.module.css';

const Hero = () => {
    return (
        <section className={styles.hero}>
            <div className={styles.container}>
                <div className={styles.heroGrid}>
                    <div className={styles.heroBadge}>
                        <span></span> New: AI-Powered Career Coaching
                    </div>

                    <h1 className={styles.heroTitle}>
                        Scale Your Team <br />
                        <span className={styles.highlight}> Not Your Workload</span>
                    </h1>

                    <p className={styles.heroDescription}>
                        The all-in-one recruiting platform that evolves at the speed of AI. ✨
                        Empowering ambitious teams from Startups to Enterprises..
                    </p>

                    <div className={styles.searchContainer}>
                        <div className={styles.searchInputGroup}>
                            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Job title or keyword"
                                className={styles.searchInput}
                            />
                        </div>
                        <div className={styles.searchInputGroup}>
                            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <input
                                type="text"
                                placeholder="City, state, or zip"
                                className={styles.searchInput}
                            />
                        </div>
                        <button className={styles.searchBtn}>Search</button>
                    </div>

                    <div className={styles.trustedContainer}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    background: '#ddd',
                                    marginLeft: i > 1 ? '-0.5rem' : 0,
                                    border: '2px solid white'
                                }} />
                            ))}
                        </div>
                        <p>Trusted by 10,000+ companies worldwide</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
