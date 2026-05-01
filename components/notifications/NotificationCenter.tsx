"use client";

import React, { useState } from 'react';
import styles from './notification-center.module.css';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
    id: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    snippet: string;
    body: string;
    timestamp: Date;
    read: boolean;
    folder: 'inbox' | 'archived';
};

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        senderName: 'System Alerts',
        senderEmail: 'noreply@talentmesh.com',
        subject: 'New Candidate Match',
        snippet: 'A top candidate matching your Sr. React Developer role was just found...',
        body: 'Hello,\n\nWe found a highly matching candidate for your Senior React Developer position. Their AI Karma score is 95% based on your job description requirements.\n\nPlease log in to review their profile and initiate an interview process.\n\nBest,\nTalentMesh System',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
        read: false,
        folder: 'inbox'
    },
    {
        id: '2',
        senderName: 'Jane Doe (HR)',
        senderEmail: 'jane.doe@company.com',
        subject: 'Interview Scheduled: John Smith',
        snippet: 'The technical interview for John Smith has been confirmed for tomorrow at 2 PM EST.',
        body: 'Hi Team,\n\nJust confirming that John Smith has accepted the calendar invite for the technical interview tomorrow at 2:00 PM EST.\n\nI have attached their resume and the technical assessment rubric to the calendar invite.\n\nThanks,\nJane',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        folder: 'inbox'
    },
    {
        id: '3',
        senderName: 'Platform Update',
        senderEmail: 'updates@talentmesh.com',
        subject: 'New Features Available',
        snippet: 'We just released a new dashboard update with live analytics and more...',
        body: 'Welcome to the latest version of TalentMesh!\n\nWe are excited to announce new features including live dashboard analytics, a brand new notification center, and faster candidate matching algorithms.\n\nCheck out the release notes for more details.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        folder: 'inbox'
    },
    {
        id: '4',
        senderName: 'Security Team',
        senderEmail: 'security@talentmesh.com',
        subject: 'Weekly Security Audit Report',
        snippet: 'Your weekly security audit report is ready to view. No critical issues found.',
        body: 'Hello,\n\nYour automated weekly security audit completed successfully. There were 0 critical vulnerabilities found across your active job postings and recruiter accounts.\n\nView the full report in the Admin portal.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        read: true,
        folder: 'archived'
    }
];

// Icons
const Icons = {
    inbox: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>,
    archive: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>,
    back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    mailOpen: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6z"></path><line x1="22" y1="10" x2="12" y2="17"></line><line x1="2" y1="10" x2="12" y2="17"></line></svg>,
    check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

export default function NotificationCenter({ role }: { role: 'admin' | 'recruiter' | 'candidate' }) {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filteredNotifications = notifications.filter(n => n.folder === activeTab);
    const selectedMessage = notifications.find(n => n.id === selectedId);
    
    const unreadCount = notifications.filter(n => !n.read && n.folder === 'inbox').length;

    const handleSelectMessage = (id: string) => {
        setSelectedId(id);
        // Mark as read
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleArchive = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, folder: 'archived' } : n));
        setSelectedId(null);
    };

    const handleDelete = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setSelectedId(null);
    };

    return (
        <div className={`${styles.container} ${selectedId ? styles.viewingDetail : ''}`}>
            
            {/* ── Sidebar ── */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    Notifications
                </div>
                
                <div 
                    className={`${styles.navItem} ${activeTab === 'inbox' ? styles.navItemActive : ''}`}
                    onClick={() => { setActiveTab('inbox'); setSelectedId(null); }}
                >
                    <div className={styles.navLabel}>
                        {Icons.inbox}
                        <span>Inbox</span>
                    </div>
                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                </div>
                
                <div 
                    className={`${styles.navItem} ${activeTab === 'archived' ? styles.navItemActive : ''}`}
                    onClick={() => { setActiveTab('archived'); setSelectedId(null); }}
                >
                    <div className={styles.navLabel}>
                        {Icons.archive}
                        <span>Archived</span>
                    </div>
                </div>
            </div>

            {/* ── Message List ── */}
            <div className={styles.listContainer}>
                <div className={styles.listHeader}>
                    <span className={styles.listTitle}>
                        {activeTab === 'inbox' ? 'Inbox' : 'Archived'}
                    </span>
                </div>
                
                <div className={styles.scrollArea}>
                    {filteredNotifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                            No messages here.
                        </div>
                    ) : (
                        filteredNotifications.map(msg => (
                            <div 
                                key={msg.id} 
                                className={`${styles.messageItem} ${!msg.read ? styles.messageItemUnread : ''} ${selectedId === msg.id ? styles.messageItemActive : ''}`}
                                onClick={() => handleSelectMessage(msg.id)}
                            >
                                <div className={styles.avatar}>
                                    {msg.senderName.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.messageContent}>
                                    <div className={styles.messageTop}>
                                        <span className={styles.sender}>{msg.senderName}</span>
                                        <span className={styles.time}>
                                            {formatDistanceToNow(msg.timestamp, { addSuffix: true }).replace('about ', '')}
                                        </span>
                                    </div>
                                    <div className={styles.subject}>{msg.subject}</div>
                                    <div className={styles.snippet}>{msg.snippet}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Detail Pane ── */}
            <div className={styles.detailContainer}>
                {selectedMessage ? (
                    <>
                        <div className={styles.detailHeader}>
                            <button className={styles.backBtn} onClick={() => setSelectedId(null)}>
                                {Icons.back}
                            </button>
                            <div className={styles.detailActions}>
                                {activeTab === 'inbox' && (
                                    <button className={styles.actionBtn} onClick={() => handleArchive(selectedMessage.id)} title="Archive">
                                        {Icons.archive} <span className="mobile-hide">Archive</span>
                                    </button>
                                )}
                                <button className={styles.actionBtn} onClick={() => handleDelete(selectedMessage.id)} title="Delete">
                                    {Icons.trash} <span className="mobile-hide">Delete</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className={styles.detailScroll}>
                            <h2 className={styles.detailSubject}>{selectedMessage.subject}</h2>
                            
                            <div className={styles.detailMeta}>
                                <div className={styles.avatar}>
                                    {selectedMessage.senderName.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.detailSenderInfo}>
                                    <div className={styles.detailSenderName}>{selectedMessage.senderName}</div>
                                    <div className={styles.detailSenderEmail}>to me</div>
                                </div>
                                <div className={styles.detailTime}>
                                    {selectedMessage.timestamp.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                            </div>
                            
                            <div className={styles.detailBody} style={{ whiteSpace: 'pre-wrap' }}>
                                {selectedMessage.body}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            {Icons.mailOpen}
                        </div>
                        <div className={styles.emptyText}>Select an item to read</div>
                        <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>Nothing is selected</div>
                    </div>
                )}
            </div>

        </div>
    );
}
