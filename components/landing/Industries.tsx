import styles from './landing.module.css';

const Industries = () => {
    const industries = [
        { name: "Accounting", icon: "🏛️" },
        { name: "Business & Consulting", icon: "🤝" },
        { name: "Human Research", icon: "🕵️" },
        { name: "Marketing & Finance", icon: "📢" },
        { name: "Design & Development", icon: "✒️" },
        { name: "Finance Management", icon: "💰" },
        { name: "Project Management", icon: "📑" },
        { name: "Customer Services", icon: "🎧" },
        { name: "Technology & SaaS", icon: "💻" },
        { name: "Healthcare & AI", icon: "🏥" },
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
