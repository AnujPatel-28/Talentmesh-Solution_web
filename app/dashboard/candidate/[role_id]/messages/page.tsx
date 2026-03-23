"use client";
import React from 'react';
import styles from '../candidate.module.css';

export default function MessagesPage() {
    const convos = [
        { name: 'Rachel Kim', role: 'HR Manager at Google', lastMsg: "We'd love to schedule a follow-up interview...", time: '2h ago', unread: true },
        { name: 'David Martinez', role: 'Recruiter at Spotify', lastMsg: 'Your application has been shortlisted for the next round.', time: 'Yesterday', unread: true },
        { name: 'Ananya Sharma', role: 'Talent Lead at Razorpay', lastMsg: 'Thanks for your interest in the Frontend role!', time: '2 days ago', unread: false },
        { name: 'James Chen', role: 'CTO at TechFlow', lastMsg: 'Great portfolio! Would you be available for a chat?', time: '3 days ago', unread: false },
        { name: 'Lisa Park', role: 'Recruiter at Netflix', lastMsg: 'Your profile looks like a great fit for our team.', time: '1 week ago', unread: false },
    ];

    return (
        <div className={styles.dash}>
            <div className={styles.greet}>
                <h1 className={styles.greetTitle}>Messages</h1>
                <p className={styles.greetSub}>Your conversations with recruiters and hiring managers.</p>
            </div>
            <div className={styles.card}>
                {convos.map((c, i) => (
                    <div key={i} className={styles.actItem} style={{ cursor: 'pointer', padding: '0.75rem 0.65rem', borderRadius: 8 }}>
                        <div className={styles.jobIcon} style={{ background: '#eff6ff', color: 'var(--primary-blue)', fontSize: '0.75rem', fontWeight: 700 }}>
                            {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className={styles.actContent} style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: c.unread ? 700 : 500, color: '#0f172a' }}>{c.name}</span>
                                <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{c.time}</span>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{c.role}</span>
                            <span style={{ fontSize: '0.72rem', color: c.unread ? '#0f172a' : '#94a3b8', fontWeight: c.unread ? 600 : 400, marginTop: 2 }}>{c.lastMsg}</span>
                        </div>
                        {c.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-blue)', flexShrink: 0 }} />}
                    </div>
                ))}
            </div>
        </div>
    );
}
