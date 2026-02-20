import { Landmark, Handshake, Search, Megaphone, PenTool, HandCoins, FileCog, Headset } from 'lucide-react';
import styles from './landing.module.css';

const industries = [
    { name: "Accounting", icon: <Landmark size={20} />, color: "#3b82f6" },
    { name: "Business & consulting", icon: <Handshake size={20} />, color: "#10b981" },
    { name: "Human research", icon: <Search size={20} />, color: "#f59e0b" },
    { name: "Marketing and finance", icon: <Megaphone size={20} />, color: "#ef4444" },
    { name: "Design & development", icon: <PenTool size={20} />, color: "#8b5cf6" },
    { name: "Finance management", icon: <HandCoins size={20} />, color: "#06b6d4" },
    { name: "Project management", icon: <FileCog size={20} />, color: "#ec4899" },
    { name: "Customer services", icon: <Headset size={20} />, color: "#f97316" }
];

const Industries = () => {
    return (
        <section className={styles.industries}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        Trusted by <span className={styles.highlightText}>industry-leading</span> teams.
                    </h2>
                </div>

                <div className={styles.industryFlex}>
                    {industries.map((ind, i) => (
                        <div
                            key={i}
                            className={styles.industryTag}
                            style={{ '--hover-color': ind.color } as React.CSSProperties}
                        >
                            <span className={styles.tagIcon}>{ind.icon}</span>
                            <span className={styles.tagName}>{ind.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Industries;
