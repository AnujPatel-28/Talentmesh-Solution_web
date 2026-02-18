import Link from 'next/link';
import styles from './landing.module.css';

const CTA = () => {
    return (
        <section className={styles.cta}>
            <div className={styles.container}>
                <div className={styles.ctaCard}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>Ready to Transform Your Hiring?</h2>
                        <p className={styles.ctaDesc}>
                            Join 10,000+ companies and job seekers using TalentMesh today.
                            Start for free, no credit card required.
                        </p>
                        <Link href="/signup" className={styles.ctaBtn}>
                            Get Started Now
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
