"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { insforge } from '@/lib/insforge';
import styles from './impersonate.module.css';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuditLog {
    id: string;
    created_at: string;
    actor_id: string;
    action: string;
    target_id: string;
    metadata: any;
}

export default function ImpersonationPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const { data, error } = await insforge.database
                .from('audit_logs')
                .select('*')
                .eq('action', 'user_impersonation_start')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        try {
            const { data, error } = await insforge.database
                .from('profiles')
                .select('id, name, email, role')
                .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .limit(10);
            
            if (error) throw error;
            setSearchResults(data || []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleImpersonate = async (targetUser: UserProfile) => {
        const confirmMsg = `You are about to view the platform as ${targetUser.name} (${targetUser.email}).\n\nAll actions will be READ-ONLY and this session will be logged.\n\nContinue?`;
        
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: targetUser.id, 
                    userRole: targetUser.role 
                })
            });

            if (res.ok) {
                // Redirect to the appropriate dashboard
                if (targetUser.role === 'recruiter') {
                    window.location.href = `/dashboard/recruiter/${targetUser.id}`;
                } else {
                    window.location.href = `/dashboard/candidate/${targetUser.id}`;
                }
            } else {
                const err = await res.json();
                alert(`Impersonation failed: ${err.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Impersonation error:', err);
            alert('Failed to start impersonation session.');
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>User Impersonation</h1>
                <p className={styles.subtitle}>View the platform as a specific user for support and debugging.</p>
            </header>

            <section className={styles.searchSection}>
                <label className={styles.searchLabel}>Find a user to impersonate</label>
                <form onSubmit={handleSearch} className={styles.searchBox}>
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className={styles.impersonateBtn} disabled={isSearching}>
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {searchResults.length > 0 && (
                    <div className={styles.resultsList}>
                        {searchResults.map(user => (
                            <div key={user.id} className={styles.resultItem}>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{user.name}</span>
                                    <span className={styles.userEmail}>{user.email}</span>
                                    <span className={`${styles.roleBadge} ${styles[`role_${user.role}`]}`}>
                                        {user.role}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleImpersonate(user)}
                                    className={styles.impersonateBtn}
                                >
                                    Impersonate
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className={styles.logSection}>
                <div className={styles.logHeader}>
                    <span className={styles.logTitle}>Recent Impersonations</span>
                    <button onClick={fetchLogs} className={styles.exitBtn} style={{ background: 'transparent', color: '#3b82f6', border: 'none', padding: 0 }}>
                        Refresh
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Admin</th>
                                <th className={styles.th}>Impersonated User</th>
                                <th className={styles.th}>Role</th>
                                <th className={styles.th}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingLogs ? (
                                <tr>
                                    <td colSpan={4} className={styles.empty}>Loading audit logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className={styles.empty}>No impersonation logs found.</td>
                                </tr>
                            ) : logs.map(log => (
                                <tr key={log.id}>
                                    <td className={styles.td}>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{log.metadata.admin_name || 'Admin'}</span>
                                            <span className={styles.userEmail}>{log.metadata.admin_email}</span>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{log.metadata.impersonated_name || 'User'}</span>
                                            <span className={styles.userEmail}>{log.metadata.impersonated_email}</span>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <span className={`${styles.roleBadge} ${styles[`role_${log.metadata.impersonated_role}`]}`}>
                                            {log.metadata.impersonated_role}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
