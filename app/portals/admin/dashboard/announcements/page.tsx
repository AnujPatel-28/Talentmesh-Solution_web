'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@insforge/sdk';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './announcements.module.css';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || ''
});

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'critical';
    target_roles: string[];
    show_as_banner: boolean;
    is_active: boolean;
    scheduled_at: string | null;
    expires_at: string | null;
    view_count: number;
    dismiss_count: number;
    created_at: string;
}

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, viewRate: 0, dismissed: 0 });

    type AnnouncementForm = {
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'critical';
        target_roles: string[];
        show_as_banner: boolean;
        send_as_notification: boolean;
        schedule: 'now' | 'later';
        scheduled_at: string;
        expiry: 'never' | 'date';
        expires_at: string;
    };

    const [form, setForm] = useState<AnnouncementForm>({
        title: '',
        message: '',
        type: 'info' as 'info' | 'success' | 'warning' | 'critical',
        target_roles: ['candidate', 'recruiter'],
        show_as_banner: true,
        send_as_notification: true,
        schedule: 'now' as 'now' | 'later',
        scheduled_at: '',
        expiry: 'never' as 'never' | 'date',
        expires_at: ''
    });

    const fetchAnnouncements = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await insforge.database
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);

            // Calculate Stats
            const active = (data || []).filter(a => a.is_active && (!a.expires_at || new Date(a.expires_at) > new Date())).length;
            const totalViews = (data || []).reduce((sum, a) => sum + a.view_count, 0);
            const totalDismissed = (data || []).reduce((sum, a) => sum + a.dismiss_count, 0);
            
            setStats({
                total: data?.length || 0,
                active,
                viewRate: data?.length ? Math.round(totalViews / data.length) : 0,
                dismissed: totalDismissed
            });
        } catch (err) {
            console.error('Fetch Announcements Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleCreate = async () => {
        if (!user) return;
        
        try {
            const announcementData = {
                title: form.title,
                message: form.message,
                type: form.type,
                target_roles: form.target_roles,
                show_as_banner: form.show_as_banner,
                scheduled_at: form.schedule === 'later' ? new Date(form.scheduled_at).toISOString() : null,
                expires_at: form.expiry === 'date' ? new Date(form.expires_at).toISOString() : null,
                created_by: user.id,
                is_active: true
            };

            const { data: newAnn, error } = await insforge.database
                .from('announcements')
                .insert(announcementData)
                .select()
                .single();

            if (error) throw error;

            if (form.send_as_notification) {
                // Bulk insert notifications
                const { data: targetProfiles } = await insforge.database
                    .from('profiles')
                    .select('id')
                    .in('role', form.target_roles);

                if (targetProfiles && targetProfiles.length > 0) {
                    const notifications = targetProfiles.map(p => ({
                        user_id: p.id,
                        title: form.title,
                        message: form.message.replace(/\*\*/g, ''),
                        type: form.type,
                        metadata: { announcement_id: newAnn.id }
                    }));

                    await insforge.database.from('notifications').insert(notifications);
                }
            }

            setIsModalOpen(false);
            setForm({
                title: '',
                message: '',
                type: 'info',
                target_roles: ['candidate', 'recruiter'],
                show_as_banner: true,
                send_as_notification: true,
                schedule: 'now',
                scheduled_at: '',
                expiry: 'never',
                expires_at: ''
            });
            fetchAnnouncements();
        } catch (err) {
            console.error('Create Announcement Error:', err);
        }
    };

    const toggleActive = async (id: string, current: boolean) => {
        try {
            await insforge.database.from('announcements').update({ is_active: !current }).eq('id', id);
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
        } catch (err) {
            console.error('Toggle Error:', err);
        }
    };

    const deleteAnnouncement = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await insforge.database.from('announcements').delete().eq('id', id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Delete Error:', err);
        }
    };

    const renderFormatted = (text: string) => {
        return text.split('**').map((part, i) => (
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        ));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Platform Announcements</h1>
                <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create Announcement
                </button>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Sent</span>
                    <span className={styles.statValue}>{stats.total}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Active Now</span>
                    <span className={styles.statValue} style={{ color: '#10b981' }}>{stats.active}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Avg View Rate</span>
                    <span className={styles.statValue} style={{ color: '#6366f1' }}>{stats.viewRate}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Dismissed</span>
                    <span className={styles.statValue} style={{ color: '#f59e0b' }}>{stats.dismissed}</span>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Targets</th>
                            <th>Status</th>
                            <th>Views</th>
                            <th>Expires</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Loading announcements...</td></tr>
                        ) : announcements.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>No announcements found.</td></tr>
                        ) : announcements.map(ann => (
                            <tr key={ann.id}>
                                <td style={{ fontWeight: 700 }}>{ann.title}</td>
                                <td>
                                    <span className={styles.typeBadge} style={{ 
                                        background: ann.type === 'info' ? '#eff6ff' : ann.type === 'success' ? '#f0fdf4' : ann.type === 'warning' ? '#fffbeb' : '#fef2f2',
                                        color: ann.type === 'info' ? '#2563eb' : ann.type === 'success' ? '#16a34a' : ann.type === 'warning' ? '#d97706' : '#dc2626'
                                    }}>
                                        {ann.type}
                                    </span>
                                </td>
                                <td>{ann.target_roles.join(', ')}</td>
                                <td>
                                    <div className={styles.statusBadge}>
                                        <div className={styles.dot} style={{ 
                                            background: !ann.is_active ? '#94a3b8' : (ann.expires_at && new Date(ann.expires_at) < new Date()) ? '#94a3b8' : (ann.scheduled_at && new Date(ann.scheduled_at) > new Date()) ? '#3b82f6' : '#10b981' 
                                        }} />
                                        {(!ann.is_active || (ann.expires_at && new Date(ann.expires_at) < new Date())) ? 'Inactive/Expired' : (ann.scheduled_at && new Date(ann.scheduled_at) > new Date()) ? 'Scheduled' : 'Active'}
                                    </div>
                                </td>
                                <td>{ann.view_count}</td>
                                <td>{ann.expires_at ? new Date(ann.expires_at).toLocaleDateString() : 'Never'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className={styles.btnIcon} onClick={() => toggleActive(ann.id, ann.is_active)} title={ann.is_active ? 'Deactivate' : 'Activate'}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d={ann.is_active ? "M18.36 6.64a9 9 0 1 1-12.73 0" : "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"} />
                                                <line x1="12" y1="2" x2="12" y2="12" />
                                            </svg>
                                        </button>
                                        <button className={styles.btnIcon} style={{ color: '#ef4444' }} onClick={() => deleteAnnouncement(ann.id)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Create Announcement</h2>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Title</label>
                            <input 
                                className={styles.input}
                                placeholder="E.g. Scheduled System Maintenance"
                                value={form.title}
                                maxLength={100}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Message (use **bold** for emphasis)</label>
                            <textarea 
                                className={styles.textarea}
                                placeholder="Describe the announcement details..."
                                value={form.message}
                                maxLength={500}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                            />
                            <span className={styles.charCounter}>{form.message.length} / 500</span>
                            
                            <div className={styles.previewBox}>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Preview</span>
                                <div style={{ fontSize: '0.9rem' }}>{renderFormatted(form.message || 'Preview text...')}</div>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Type</label>
                            <div className={styles.typeGrid}>
                                {(['info', 'success', 'warning', 'critical'] as const).map(t => (
                                    <div 
                                        key={t}
                                        className={`${styles.typeOption} ${form.type === t ? styles.typeOptionActive : ''}`}
                                        onClick={() => setForm({ ...form, type: t })}
                                    >
                                        <div className={styles.dot} style={{ background: t === 'info' ? '#3b82f6' : t === 'success' ? '#10b981' : t === 'warning' ? '#f59e0b' : '#ef4444' }} />
                                        <span style={{ textTransform: 'capitalize' }}>{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Target Audience</label>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxItem}>
                                    <input 
                                        type="checkbox" 
                                        checked={form.target_roles.includes('candidate')}
                                        onChange={(e) => {
                                            const roles = e.target.checked ? [...form.target_roles, 'candidate'] : form.target_roles.filter(r => r !== 'candidate');
                                            setForm({ ...form, target_roles: roles });
                                        }}
                                    />
                                    Candidates
                                </label>
                                <label className={styles.checkboxItem}>
                                    <input 
                                        type="checkbox" 
                                        checked={form.target_roles.includes('recruiter')}
                                        onChange={(e) => {
                                            const roles = e.target.checked ? [...form.target_roles, 'recruiter'] : form.target_roles.filter(r => r !== 'recruiter');
                                            setForm({ ...form, target_roles: roles });
                                        }}
                                    />
                                    Recruiters
                                </label>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Display Options</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label className={styles.checkboxItem}>
                                    <input 
                                        type="checkbox" 
                                        checked={form.show_as_banner}
                                        onChange={(e) => setForm({ ...form, show_as_banner: e.target.checked })}
                                    />
                                    Show as banner on dashboards
                                </label>
                                <label className={styles.checkboxItem}>
                                    <input 
                                        type="checkbox" 
                                        checked={form.send_as_notification}
                                        onChange={(e) => setForm({ ...form, send_as_notification: e.target.checked })}
                                    />
                                    Send as notification to each user
                                </label>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button 
                                className={styles.sendBtn}
                                onClick={handleCreate}
                                disabled={!form.title || !form.message || form.target_roles.length === 0}
                            >
                                Send Announcement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
