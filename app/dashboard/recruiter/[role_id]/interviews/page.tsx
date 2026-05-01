"use client";
import React from 'react';
import styles from '../../../shared-dashboard.module.css';
import { formatTime, formatShortDate } from '@/lib/utils/date-utils';

export default function InterviewsPage() {
    const interviews = [
        { name: 'Priya Sharma', role: 'Frontend Engineer', scheduledAt: '2026-04-17T15:00:00Z', type: 'Technical Round', interviewer: 'David K.', status: 'Scheduled' },
        { name: 'Alex Johnson', role: 'UI/UX Designer', scheduledAt: '2026-04-17T16:30:00Z', type: 'Cultural Fit', interviewer: 'Lisa M.', status: 'Scheduled' },
        { name: 'Ravi Kumar', role: 'Backend Developer', scheduledAt: '2026-04-18T10:00:00Z', type: 'System Design', interviewer: 'James P.', status: 'Confirmed' },
        { name: 'Emily Chen', role: 'Data Scientist', scheduledAt: '2026-04-19T14:00:00Z', type: 'Final Round', interviewer: 'Harper R.', status: 'Pending' },
        { name: 'David Park', role: 'DevOps Engineer', scheduledAt: '2026-04-20T11:30:00Z', type: 'Technical Round', interviewer: 'Sarah L.', status: 'Confirmed' },
    ];

    return (
        <div className={styles.dash}>
            <div className={styles.greet}>
                <h1 className={styles.greetTitle}>Interviews</h1>
                <p className={styles.greetSub}>Manage upcoming interviews and schedule new sessions.</p>
            </div>

            <div className={styles.card}>
                {interviews.map((int, i) => (
                    <div key={i} className={styles.intCard} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                        <div className={styles.intTime}>{formatTime(int.scheduledAt)}</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span className={styles.intName}>{int.name} — {int.role}</span>
                            <span className={styles.intType}>{int.type} · {formatShortDate(int.scheduledAt)}</span>
                            <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Interviewer: {int.interviewer}</span>
                        </div>
                        <span style={{
                            fontSize: '0.62rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: 8,
                            background: int.status === 'Pending' ? '#fef3c7' : '#f0fdf4',
                            color: int.status === 'Pending' ? '#f59e0b' : '#10b981',
                        }}>
                            {int.status}
                        </span>
                        <button className={styles.intBtn}>
                            {formatShortDate(int.scheduledAt) === 'Today' ? 'Join' : 'Details'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
