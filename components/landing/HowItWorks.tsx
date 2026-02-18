import styles from './landing.module.css';

const HowItWorks = () => {
    return (
        <section className={styles.howItWorks}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <div className={styles.badge}>Simple Process</div>
                    <h2 className={styles.sectionTitle}>How TalentMesh Works</h2>
                    <p className={styles.sectionDesc}>
                        Our streamlined process gets you from profile creation to hired in record time.
                    </p>
                </div>

                <div className={styles.stepsGrid}>
                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>1</div>
                        <h3>Create Your Profile</h3>
                        <p>Upload your resume or link your LinkedIn. Our AI instantly builds a comprehensive skills profile.</p>
                    </div>

                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>2</div>
                        <h3>Get Matched</h3>
                        <p>Our algorithms match you with opportunities that align with your skills, values, and salary expectations.</p>
                    </div>

                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>3</div>
                        <h3>Direct Connection</h3>
                        <p>Skip the ghosting. Chat directly with hiring managers who have already expressed interest in you.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
