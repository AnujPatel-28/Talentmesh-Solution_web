import styles from './landing.module.css';

const Testimonials = () => {
    return (
        <section className={styles.testimonials}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <div className={styles.badge}>Success Stories</div>
                    <h2 className={styles.sectionTitle}>Loved by Recruiters & Talent</h2>
                </div>

                <div className={styles.testimonialGrid}>
                    <div className={styles.testimonialCard}>
                        <p className={styles.quote}>
                            "TalentMesh cut our hiring time in half. The quality of candidates we received was unmatched by any other platform we've used."
                        </p>
                        <div className={styles.author}>
                            <div className={styles.avatar}>JS</div>
                            <div className={styles.authorInfo}>
                                <h4>Sarah Jenkins</h4>
                                <p>Head of People, TechFlow</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.testimonialCard}>
                        <p className={styles.quote}>
                            "I stopped applying to black holes. On TalentMesh, companies reached out to me, and I had 3 offers in a week. Incredible experience."
                        </p>
                        <div className={styles.author}>
                            <div className={styles.avatar}>MK</div>
                            <div className={styles.authorInfo}>
                                <h4>Michael Kim</h4>
                                <p>Senior Product Designer</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.testimonialCard}>
                        <p className={styles.quote}>
                            "The bias-free matching is a game changer. We've built our most diverse and high-performing team yet using this tool."
                        </p>
                        <div className={styles.author}>
                            <div className={styles.avatar}>AL</div>
                            <div className={styles.authorInfo}>
                                <h4>Amanda Lee</h4>
                                <p>CTO, InnovateX</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
