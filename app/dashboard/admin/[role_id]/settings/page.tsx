"use client";
import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { insforge } from '@/lib/insforge';
import { sendAdminInvite, revokeInvite } from './actions';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const fetchData = async () => {
        setIsLoading(true);
        // 1. Fetch active admins from profiles
        const { data: adminProfiles } = await insforge.database
            .from('profiles')
            .select('*')
            .in('role', ['admin', 'super_admin']);
        setAdmins(adminProfiles || []);

        // 2. Fetch pending invites
        const { data: pendingInvites } = await insforge.database
            .from('admin_invites')
            .select('*');
        setInvites(pendingInvites || []);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setIsInviting(true);
        setMsg({ text: '', type: '' });

        const formData = new FormData();
        formData.append('email', inviteEmail);
        formData.append('adminId', user?.id || '');

        const res = await sendAdminInvite(formData);
        if (res.success) {
            setMsg({ text: `Invitation sent to ${inviteEmail}.`, type: 'success' });
            setInviteEmail('');
            fetchData();
        } else {
            setMsg({ text: res.error || 'Failed to send invite', type: 'error' });
        }
        setIsInviting(false);
    };

    const handleRevoke = async (email: string) => {
        const res = await revokeInvite(email, user?.id || '');
        if (res.success) {
            fetchData();
        }
    };

    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Admin Settings</h1>
                    <p className={styles.pageSub}>Configure platform settings and admin preferences</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '1.5rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Admin Team Management */}
                    <div className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 className={styles.cardTitle}>Admin Team</h3>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: 10, color: '#475569' }}>
                                {admins.length} ACTIVE
                            </span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                        <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: 600 }}>Name</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: 600 }}>Email</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: 600 }}>Joined</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map((adm) => (
                                        <tr key={adm.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{adm.name || 'Admin'}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{adm.email}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>
                                                {adm.created_at ? new Date(adm.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <span style={{ 
                                                    padding: '0.2rem 0.5rem', 
                                                    borderRadius: 4, 
                                                    fontSize: '0.7rem', 
                                                    fontWeight: 700,
                                                    background: adm.role === 'super_admin' ? '#f5f3ff' : '#eff6ff',
                                                    color: adm.role === 'super_admin' ? '#7c3aed' : '#2563eb'
                                                }}>
                                                    {adm.role.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pending Invites */}
                    {invites.length > 0 && (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Pending Invitations</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                {invites.map((inv) => (
                                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{inv.email}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                Expires: {new Date(inv.expires_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRevoke(inv.email)}
                                            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Invite New Admin Form */}
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Invite New Admin</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                            They will receive an email to set their own password.
                        </p>
                        
                        <form onSubmit={handleInvite} style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="admin@talentmesh.ai"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    required
                                    style={{ padding: '0.65rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.85rem', outline: 'none' }} 
                                />
                            </div>

                            {msg.text && (
                                <div style={{ 
                                    padding: '0.6rem 0.8rem', 
                                    borderRadius: 10, 
                                    fontSize: '0.78rem', 
                                    background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                    color: msg.type === 'success' ? '#166534' : '#b91c1c',
                                    border: `1px solid ${msg.type === 'success' ? '#dcfce7' : '#fee2e2'}`
                                }}>
                                    {msg.text}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isInviting}
                                className={styles.primaryBtn} 
                                style={{ width: '100%', padding: '0.7rem' }}
                            >
                                {isInviting ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </form>
                    </div>

                    {/* Security Info */}
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Security & Access</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div style={{ fontSize: '1.2rem' }}>🛡️</div>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Whitelist Mandatory</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Admins must also be whitelisted in the environment variables to access the dashboard.</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div style={{ fontSize: '1.2rem' }}>🕒</div>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Limited Validity</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Invitation links expire after 48 hours for security reasons.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
