"use client";
import React from 'react';
import Skeleton from './Skeleton';
import styles from '@/app/dashboard/shared-dashboard.module.css';

export function HomeSkeleton() {
    return (
        <div className={styles.dash}>
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderContent}>
                    <Skeleton width={200} height="2rem" />
                    <Skeleton width={300} height="1rem" style={{ marginTop: '0.5rem' }} />
                </div>
                <Skeleton width={120} height="2.5rem" />
            </div>

            <div className={styles.stats}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={styles.stat}>
                        <div className={styles.statTop}>
                            <Skeleton width={80} height="0.8rem" />
                            <Skeleton width={32} height={32} circle />
                        </div>
                        <Skeleton width={100} height="1.8rem" style={{ marginTop: '0.5rem' }} />
                        <Skeleton width={60} height="0.7rem" style={{ marginTop: '0.3rem' }} />
                    </div>
                ))}
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.leftCol}>
                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <Skeleton width={150} height="1.2rem" />
                        </div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={styles.jobCard}>
                                <Skeleton width={42} height={42} />
                                <div style={{ flex: 1 }}>
                                    <Skeleton width="60%" height="1rem" />
                                    <Skeleton width="40%" height="0.7rem" style={{ marginTop: '0.4rem' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.rightCol}>
                    <div className={styles.card}>
                        <Skeleton width={120} height="1.1rem" />
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                                <Skeleton width={32} height={32} circle />
                                <div style={{ flex: 1 }}>
                                    <Skeleton width="100%" height="0.8rem" />
                                    <Skeleton width="50%" height="0.6rem" style={{ marginTop: '0.3rem' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 5 }) {
    return (
        <div className={styles.dash}>
            <div className={styles.pageHeader}>
                <Skeleton width={250} height="2rem" />
                <Skeleton width={150} height="2.5rem" />
            </div>
            <div className={styles.card} style={{ gap: '1rem' }}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Skeleton width="40%" height="1.2rem" />
                            <Skeleton width={80} height="1.5rem" />
                        </div>
                        <Skeleton width="20%" height="0.8rem" style={{ marginTop: '0.5rem' }} />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                            <Skeleton width={60} height="1.2rem" />
                            <Skeleton width={60} height="1.2rem" />
                            <Skeleton width={60} height="1.2rem" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className={styles.dash}>
            <div className={styles.pageHeader}>
                <Skeleton width={200} height="1.8rem" />
            </div>
            <div className={styles.card}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                        <Skeleton width={120} height="0.9rem" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="100%" height="2.8rem" />
                    </div>
                ))}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <Skeleton width={120} height="2.5rem" />
                    <Skeleton width={120} height="2.5rem" />
                </div>
            </div>
        </div>
    );
}
