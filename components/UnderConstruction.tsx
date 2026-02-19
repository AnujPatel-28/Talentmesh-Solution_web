"use client";
import React from 'react';
import Link from 'next/link';
import styles from './UnderConstruction.module.css';

interface Props {
    title?: string;
    message?: string;
}

const UnderConstruction: React.FC<Props> = ({
    title = "Platform Under Construction",
    message = "We're currently building a world-class experience. Check back soon for the launch of something extraordinary."
}) => {
    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
                <div className={`${styles.blob} ${styles.blob3}`}></div>
            </div>

            <div className={styles.content}>
                <div className={styles.iconWrapper}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={styles.icon}
                        style={{ color: 'var(--primary-blue)' }}
                    >
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                    </svg>
                </div>

                <div className={styles.textGroup}>
                    <h1 className={styles.title}>{title}</h1>
                    <p className={styles.message}>{message}</p>
                </div>

                <div className={styles.actions}>
                    <div className={styles.notifyForm}>
                        <input
                            type="email"
                            placeholder="Enter your email for updates..."
                            className={styles.input}
                            aria-label="Email for notifications"
                        />
                        <button className={styles.submitBtn}>Notify Me</button>
                    </div>

                    <Link href="/" className={styles.homeBtn}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UnderConstruction;
