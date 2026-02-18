import styles from './landing.module.css';

const Stats = () => {
    return (
        <section className={styles.stats}>
            <div className={styles.container}>
                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <h3>10k+</h3>
                        <p>Companies Hiring</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3>500k+</h3>
                        <p>Active Candidates</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3>98%</h3>
                        <p>Match Accuracy</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3>3 Days</h3>
                        <p>Average Time to Hire</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Stats;
