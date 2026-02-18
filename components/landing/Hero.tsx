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

                    <div className={styles.heroActions}>
                        <Link href="/employers" className={styles.primaryBtn}>
                            For Employers
                        </Link>
                        <Link href="/job-seekers" className={styles.secondaryBtn}>
                            For Job Seekers
                        </Link>
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
