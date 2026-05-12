'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@insforge/sdk';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './AnnouncementBanner.module.css';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || ''
});

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'critical';
}

export default function AnnouncementBanner({ role }: { role: 'candidate' | 'recruiter' }) {
    const { user } = useAuth();
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchAnnouncement = async () => {
            try {
                const now = new Date().toISOString();
                const { data, error } = await insforge.database
                    .from('announcements')
                    .select('id, title, message, type')
                    .eq('is_active', true)
                    .eq('show_as_banner', true)
                    .contains('target_roles', [role])
                    .or(`expires_at.is.null,expires_at.gt.${now}`)
                    .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) throw error;
                if (!data || data.length === 0) return;

                const ann = data[0];

                // Check local dismissal
                if (localStorage.getItem(`dismissed_announcement_${ann.id}`)) return;

                // Check DB dismissal
                const { data: dismissal } = await insforge.database
                    .from('announcement_dismissals')
                    .select('id')
                    .eq('announcement_id', ann.id)
                    .eq('user_id', user.id)
                    .single();

                if (dismissal) return;

                setAnnouncement(ann);
                setIsVisible(true);

                // Increment view count via RPC
                await insforge.database.rpc('increment_announcement_view', { ann_id: ann.id });

            } catch (err) {
                console.error('Banner Fetch Error:', err);
            }
        };

        fetchAnnouncement();
    }, [user, role]);

    const handleDismiss = async () => {
        if (!announcement || !user) return;

        setIsDismissed(true);
        setTimeout(() => setIsVisible(false), 300);

        try {
            // Store locally
            localStorage.setItem(`dismissed_announcement_${announcement.id}`, '1');

            // Store in DB
            await insforge.database.from('announcement_dismissals').insert({
                announcement_id: announcement.id,
                user_id: user.id
            });

            // Increment dismiss count via RPC
            await insforge.database.rpc('increment_announcement_dismiss', { ann_id: announcement.id });

        } catch (err) {
            console.error('Dismissal Error:', err);
        }
    };

    if (!isVisible || !announcement) return null;

    const renderMessage = (msg: string) => {
        return msg.split('**').map((part, i) => (
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        ));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return (
                    <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
            case 'critical':
                return (
                    <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                );
            default:
                return (
                    <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                );
        }
    };

    return (
        <div className={`${styles.banner} ${styles[announcement.type]} ${isDismissed ? styles.fadeOut : ''}`}>
            <div className={styles.bannerContent}>
                {getIcon(announcement.type)}
                <div className={styles.text}>
                    <span className={styles.title}>{announcement.title}</span>
                    {renderMessage(announcement.message)}
                </div>
            </div>
            <button className={styles.dismissBtn} onClick={handleDismiss} aria-label="Dismiss announcement">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
}
