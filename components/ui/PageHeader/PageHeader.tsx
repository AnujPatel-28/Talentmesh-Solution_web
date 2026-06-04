"use client";
import React from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
    title: string;
    description: string;
    breadcrumb?: string;
    highlight?: string;
    light?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumb, highlight, light }) => {
    return (
        <section className={`${styles.header} ${light ? styles.light : ''}`}>
            <div className={styles.container}>
                {breadcrumb && <span className={styles.breadcrumb}>{breadcrumb}</span>}
                <h1 className={styles.title}>
                    {title} {highlight && <span className={styles.highlight}>{highlight}</span>}
                </h1>
                <p className={styles.description}>{description}</p>
            </div>
            <div className={styles.decor1}></div>
            <div className={styles.decor2}></div>
        </section>
    );
};

export default PageHeader;
