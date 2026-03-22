"use client";

import React, { useState, useEffect, useTransition } from 'react';
import styles from './audit.module.css';
import { insforge } from '@/lib/insforge';

export default function AuditLogClient({ admins, totalInitial, stats }: { admins: any[], totalInitial: number, stats: any }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(totalInitial);
    const [filters, setFilters] = useState({
        adminId: '',
        type: 'all',
        search: '',
        from: '',
        to: ''
    });
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const [activeTab, setActiveTab] = useState<'all' | 'login'>('all');
    
    const fetchLogs = async () => {
        setLoading(true);
        let query = insforge.database
            .from('audit_logs')
            .select(`
                *,
                profiles:actor_id (
                    name,
                    email
                )
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (activeTab === 'login') {
            query = query.ilike('action', '%security%').or('action.ilike.%login%').or('action.ilike.%mfa%');
        } else {
            if (filters.adminId) query = query.eq('actor_id', filters.adminId);
            if (filters.search) query = query.or(`action.ilike.%${filters.search}%,record_id.ilike.%${filters.search}%`);
            if (filters.from) query = query.gte('created_at', new Date(filters.from).toISOString());
            if (filters.to) query = query.lte('created_at', new Date(filters.to).toISOString());
            
            if (filters.type !== 'all') {
                if (filters.type === 'user') query = query.ilike('action', '%user%').or('action.ilike.%recruiter%');
                if (filters.type === 'job') query = query.ilike('action', '%job%');
                if (filters.type === 'security') query = query.ilike('action', '%security%').or('action.ilike.%login%').or('action.ilike.%mfa%');
                if (filters.type === 'settings') query = query.ilike('action', '%settings%');
            }
        }

        const { data, count } = await query;
        setLogs(data || []);
        if (count !== null) setTotal(count);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [filters, activeTab]);

    const getBadgeClass = (action: string, status: string) => {
        const a = action.toLowerCase();
        if (a.includes('user') || a.includes('recruiter')) return styles.userBadge;
        if (a.includes('job')) return styles.jobBadge;
        if (a.includes('security') || a.includes('login') || a.includes('mfa')) {
            return status === 'failure' ? styles.securityBadgeFailure : styles.securityBadgeSuccess;
        }
        if (a.includes('settings')) return styles.settingsBadge;
        return styles.badge;
    };

    const handleExport = () => {
        const params = new URLSearchParams(filters);
        params.append('activeTab', activeTab);
        window.open(`/api/admin/export-audit?${params.toString()}`, '_blank');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>
                    Audit Log 
                    <span className={styles.countBadge}>{total} entries</span>
                </h1>
                <p className={styles.subtitle}>Every admin action on TalentMesh is recorded here. This log cannot be modified.</p>
            </header>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Actions Today</span>
                    <div className={styles.statValue}>{stats.today}</div>
                    <span className={styles.statTrend} style={{ background: '#f0fdf4', color: '#16a34a' }}>↑ 12% vs yesterday</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Security Events (24h)</span>
                    <div className={styles.statValue}>{stats.security}</div>
                    <span className={styles.statTrend} style={{ background: '#fef2f2', color: '#dc2626' }}>Manual review suggested</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Most Active Admin</span>
                    <div className={styles.statValue} style={{ fontSize: '1.1rem' }}>{stats.topAdmin}</div>
                </div>
            </div>

            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Full Audit Trail
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'login' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('login')}
                >
                    Login & Security Activity
                </button>
            </div>

            {activeTab === 'all' && (
                <div className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <label>Admin</label>
                        <select 
                            className={styles.select}
                            value={filters.adminId}
                            onChange={(e) => setFilters({...filters, adminId: e.target.value})}
                        >
                            <option value="">All Admins</option>
                            {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>Action Type</label>
                        <select 
                            className={styles.select}
                            value={filters.type}
                            onChange={(e) => setFilters({...filters, type: e.target.value})}
                        >
                            <option value="all">All Actions</option>
                            <option value="user">User Actions</option>
                            <option value="job">Job Actions</option>
                            <option value="security">Security Events</option>
                            <option value="settings">Settings</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>Date Range</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="date" className={styles.input} style={{ minWidth: 'auto' }} onChange={(e) => setFilters({...filters, from: e.target.value})} />
                            <input type="date" className={styles.input} style={{ minWidth: 'auto' }} onChange={(e) => setFilters({...filters, to: e.target.value})} />
                        </div>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>Search</label>
                        <input 
                            placeholder="Search description or ID..." 
                            className={styles.input} 
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <button className={styles.exportBtn} onClick={handleExport}>
                        📥 Export CSV
                    </button>
                </div>
            )}

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Admin</th>
                            <th>Action</th>
                            <th>Resource</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Fetching secure logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No audit entries match these filters.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <React.Fragment key={log.id}>
                                    <tr className={styles.rowExpandable} onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                                        <td className={styles.timestamp}>
                                            {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td>
                                            <strong>{log.profiles?.name || 'System'}</strong>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${getBadgeClass(log.action, log.status)}`}>
                                                {log.action.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            {log.table_name ? <span style={{ color: '#64748b' }}>{log.table_name}:</span> : null} {log.record_id || 'Global'}
                                        </td>
                                        <td className={styles.ip}>{log.ip_address}</td>
                                    </tr>
                                    {expandedId === log.id && (
                                        <tr>
                                            <td colSpan={5} className={styles.expandedArea}>
                                                <div className={styles.diffGrid}>
                                                    <div className={styles.diffBox}>
                                                        <h4>State Before</h4>
                                                        <pre className={styles.json}>{log.old_data ? JSON.stringify(JSON.parse(log.old_data), null, 2) : 'N/A: Creation event'}</pre>
                                                    </div>
                                                    <div className={styles.diffBox}>
                                                        <h4>State After</h4>
                                                        <pre className={styles.json}>{log.new_data ? JSON.stringify(JSON.parse(log.new_data), null, 2) : 'N/A: Deletion or pure event'}</pre>
                                                    </div>
                                                </div>
                                                <div className={styles.metaInfo}>
                                                    <span><strong>User Agent:</strong> {log.user_agent}</span>
                                                    <span><strong>Status:</strong> {log.status}</span>
                                                    <span><strong>Audit ID:</strong> {log.id}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
