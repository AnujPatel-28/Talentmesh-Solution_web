"use client";
import React from 'react';
import { Layers, Rocket, ShieldCheck, Zap } from 'lucide-react';
import styles from './PremiumCardGrid.module.css';

interface CardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

const PremiumCardGrid = ({ items }: { items?: CardProps[] }) => {
    const defaultItems = [
        { icon: <Zap size={28} />, title: "Instant Sourcing", desc: "Our AI agents source candidates in real-time as you type your requirements." },
        { icon: <ShieldCheck size={28} />, title: "Verified Skills", desc: "Every portfolio and resume is cross-verified for technical accuracy." },
        { icon: <Layers size={28} />, title: "Built-in ATS", desc: "A full-featured tracking system that works as fast as your team does." },
        { icon: <Rocket size={28} />, title: "Scalable Infrastructure", desc: "Handle 1 or 1,000 openings without any loss in performance." }
    ];

    const displayItems = items || defaultItems;

    return (
        <section className={styles.section}>
            <div className="premium-container">
                <div className={styles.grid}>
                    {displayItems.map((item, i) => (
                        <div key={i} className={styles.card}>
                            <div className={styles.iconWrap}>{item.icon}</div>
                            <h3 className={styles.title}>{item.title}</h3>
                            <p className={styles.desc}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PremiumCardGrid;
