"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './utility.module.css';

export default function NotFound() {
    return (
        <main className={styles.utilityPage}>
            {/* Background Blobs for depth */}
            <div className={`${styles.blob} ${styles.blob1}`}></div>
            <div className={`${styles.blob} ${styles.blob2}`}></div>

            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.spotlight}></div>
                    <span className={styles.subtitle}>System Protocol Error</span>
                    <h1 className={styles.big404}>404</h1>
                    <h2 className={styles.title} style={{ fontSize: '3rem', marginTop: '-1rem' }}>
                        Page <br />Not Found !!.
                    </h2>
                    <p className={styles.description}>
                        The requested talent protocol could not be located in our active database.
                        Redirecting to the main command center is recommended.
                    </p>
                    <div className={styles.buttonGroup}>
                        <Link href="/" className={styles.primaryButton}>
                            Return Home
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                        <button onClick={() => window.history.back()} className={styles.secondaryButton}>
                            Retry Trace
                        </button>
                    </div>
                </div>

                <div className={styles.visualSide}>
                    <div className={styles.illustration}>
                        <Image
                            src="/404.png"
                            alt="404 Not Found"
                            width={600}
                            height={600}
                            priority
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
