import styles from './landing.module.css';

const Features = () => {
    return (
        <section className={styles.features}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <div className={styles.badge}>Why TalentMesh?</div>
                    <h2 className={styles.sectionTitle}>
                        Smarter Hiring, <span className={styles.highlightText}>Better Results</span>
                    </h2>
                    <p className={styles.sectionDesc}>
                        We combine cutting-edge AI with intuitive design to revolutionize how you hire and get hired.
                    </p>
                </div>

                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🎯</div>
                        <h3>Precision Matching</h3>
                        <p>Our AI analyzes 50+ data points to match skills, culture, and potential with 98% accuracy.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>⏱️</div>
                        <h3>Instant Screening</h3>
                        <p>Save hours of manual review. Our system automatically parses and ranks resumes instantly.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🛡️</div>
                        <h3>Unbiased Selection</h3>
                        <p>Blind screening protocols ensure every candidate is evaluated purely on merit.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>📈</div>
                        <h3>Smart Analytics</h3>
                        <p>Get real-time insights into your hiring pipeline and market salary trends.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>💬</div>
                        <h3>Seamless Chat</h3>
                        <p>Integrated messaging platform to connect with candidates directly and securely.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🤝</div>
                        <h3>Culture Fit</h3>
                        <p>Go beyond skills. Match candidates who align with your company values and vision.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
