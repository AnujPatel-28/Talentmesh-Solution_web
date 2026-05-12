"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ImpersonationBanner.module.css';

interface ImpersonationBannerProps {
    userName: string;
    userEmail: string;
    role: string;
}

export default function ImpersonationBanner({ userName, userEmail, role }: ImpersonationBannerProps) {
    const router = useRouter();
    const [isExiting, setIsExiting] = useState(false);

    const handleExit = async () => {
        setIsExiting(true);
        try {
            const res = await fetch('/api/impersonate', {
                method: 'DELETE',
            });
            if (res.ok) {
                // Clear any local storage states if necessary
                window.location.href = '/dashboard/admin/impersonate';
            }
        } catch (err) {
            console.error('Failed to exit impersonation:', err);
            setIsExiting(false);
        }
    };

    return (
        <div className={styles.banner}>
            <div className={styles.content}>
                <span className={styles.icon}>🔍</span>
                <div className={styles.userInfo}>
                    <div>
                        <span className={styles.badge}>Admin View</span>
                        Viewing as <strong>{userName}</strong> ({role})
                    </div>
                    <span className={styles.email}>{userEmail}</span>
                </div>
            </div>

            <div className={styles.actions}>
                <div className={styles.warning}>
                    <strong>READ-ONLY MODE</strong>: Changes will not be saved.
                </div>
                <button 
                    onClick={handleExit} 
                    className={styles.exitBtn}
                    disabled={isExiting}
                >
                    {isExiting ? 'Exiting...' : 'Exit Impersonation'}
                </button>
            </div>
        </div>
    );
}
