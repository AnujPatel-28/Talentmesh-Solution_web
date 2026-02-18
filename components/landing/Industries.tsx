import styles from './landing.module.css';

const Industries = () => {
    const industries = [
        { name: "Technology & SaaS", icon: "💻" },
        { name: "Finance & Fintech", icon: "💳" },
        { name: "Healthcare & AI", icon: "🏥" },
        { name: "E-commerce", icon: "🛍️" },
        { name: "Green Energy", icon: "⚡" },
        { name: "EdTech", icon: "🎓" },
        { name: "Logistics", icon: "🚚" },
        { name: "Media & Design", icon: "🎨" }
    ];

    return (
        <section className={styles.industries}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <span className={styles.badge}>Sectors</span>
                    <h2 className={styles.sectionTitle}>Industries We <span className={styles.highlightText}>Empower</span></h2>
                    <p className={styles.sectionDesc}>
                        Our matching engine is trained on specialized datasets across key global industries.
                    </p>
                </div>

                <div className={styles.industryGrid}>
                    {industries.map((ind, i) => (
                        <div key={i} className={styles.industryCard}>
                            <div className={styles.industryIcon}>{ind.icon}</div>
                            <h3 className={styles.industryName}>{ind.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Industries;
