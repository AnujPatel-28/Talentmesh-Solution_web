'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@insforge/sdk';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './team.module.css';
import { CustomSelect } from '@/components/ui/CustomSelect';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || ''
});

interface AdminMember {
    id: string;
    profile_id: string;
    email: string;
    full_name: string;
    role: 'super_admin' | 'admin' | 'moderator' | 'support';
    status: 'active' | 'inactive' | 'invited';
    invited_by: string;
    last_login_at: string | null;
    permissions: Record<string, boolean>;
    created_at: string;
}

const ROLES = [
    { id: 'super_admin', name: 'Super Admin', desc: 'Full access to all features including billing and team management', icon: '⚡' },
    { id: 'admin', name: 'Admin', desc: 'Access to candidates, recruiters, jobs, and reports', icon: '👤' },
    { id: 'moderator', name: 'Moderator', desc: 'Can approve/reject content and manage flagged items', icon: '🛡️' },
    { id: 'support', name: 'Support', desc: 'Read-only access to help resolve user issues', icon: '🎧' }
];

const PERMISSIONS = [
    { id: 'view_candidates', label: 'View candidates' },
    { id: 'edit_candidates', label: 'Edit candidates' },
    { id: 'view_recruiters', label: 'View recruiters' },
    { id: 'approve_recruiters', label: 'Approve/reject recruiters' },
    { id: 'manage_jobs', label: 'Manage jobs' },
    { id: 'publish_blog', label: 'Publish blog posts' },
    { id: 'view_reports', label: 'View reports' },
    { id: 'access_billing', label: 'Access billing' },
    { id: 'send_announcements', label: 'Send announcements' },
    { id: 'manage_team', label: 'Manage team members' }
];

export default function TeamManagement() {
    const [members, setMembers] = useState<AdminMember[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', fullName: '', role: 'admin' });
    const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
    const [isInviting, setIsInviting] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        const init = async () => {
            if (user) {
                setCurrentUser(user);
            }
            await fetchMembers();
            setLoading(false);
        };
        init();
    }, []);

    const fetchMembers = async () => {
        const { data, error } = await insforge.database
            .from('admin_members')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setMembers(data);
            // Update selected member if they exist
            if (selectedMember) {
                const updated = data.find((m: AdminMember) => m.id === selectedMember.id);
                if (updated) setSelectedMember(updated);
            }
        }
    };

    const handleRoleChange = async (memberId: string, newRole: string) => {
        const { error } = await insforge.database
            .from('admin_members')
            .update({ role: newRole })
            .eq('id', memberId);
        
        if (!error) {
            fetchMembers();
        }
    };

    const handleStatusChange = async (memberId: string, newStatus: string) => {
        const { error } = await insforge.database
            .from('admin_members')
            .update({ status: newStatus })
            .eq('id', memberId);
        
        if (!error) {
            fetchMembers();
        }
    };

    const handleRemoveMember = async (member: AdminMember) => {
        if (member.profile_id === currentUser?.id) return;
        
        const isLastSuperAdmin = member.role === 'super_admin' && 
            members.filter(m => m.role === 'super_admin').length <= 1;
        
        if (isLastSuperAdmin) {
            alert('Cannot remove the last Super Admin.');
            return;
        }

        if (confirm(`Are you sure you want to remove ${member.full_name}?`)) {
            const { error } = await insforge.database
                .from('admin_members')
                .delete()
                .eq('id', member.id);
            
            if (!error) {
                if (selectedMember?.id === member.id) setSelectedMember(null);
                fetchMembers();
            }
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        
        const { error } = await insforge.database
            .from('admin_members')
            .insert([{
                email: inviteData.email,
                full_name: inviteData.fullName,
                role: inviteData.role,
                status: 'invited',
                invited_by: currentUser?.id,
                permissions: {}
            }]);

        if (!error) {
            // Future: INSERT to notifications table
            await insforge.database.from('notifications').insert([{
                employee_id: currentUser?.id, // Temporary fallback or logic
                title: 'New Admin Invited',
                body: `${inviteData.fullName} has been invited to the team as ${inviteData.role}.`,
                type: 'team_invite'
            }]);

            setShowInviteModal(false);
            setInviteData({ email: '', fullName: '', role: 'admin' });
            fetchMembers();
            alert(`Invite sent to ${inviteData.email}`);
        } else {
            alert(error.message);
        }
        setIsInviting(false);
    };

    const handleUpdatePermissions = async () => {
        if (!selectedMember) return;
        
        const { error } = await insforge.database
            .from('admin_members')
            .update({ permissions: selectedMember.permissions })
            .eq('id', selectedMember.id);
        
        if (!error) {
            alert('Permissions updated successfully');
            fetchMembers();
        }
    };

    const togglePermission = (permId: string) => {
        if (!selectedMember) return;
        const newPerms = { ...selectedMember.permissions };
        newPerms[permId] = !newPerms[permId];
        setSelectedMember({ ...selectedMember, permissions: newPerms });
    };

    const formatRelativeTime = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <div className={styles.spinner} style={{ borderColor: '#6366f1', borderTopColor: 'transparent', margin: '0 auto 1rem' }}></div>
                    Loading Team Data...
                </div>
            </div>
        );
    }

    const currentAdminInfo = members.find(m => m.profile_id === currentUser?.id);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Team Management</h1>
                <button 
                    className={styles.inviteBtn}
                    onClick={() => setShowInviteModal(true)}
                >
                    <span>+</span> Invite Member
                </button>
            </header>

            <section className={styles.roleGrid}>
                {ROLES.map(role => (
                    <div key={role.id} className={styles.roleCard}>
                        <div className={`${styles.roleIcon} ${styles[`${role.id.replace('_', 'A')}Icon`] || styles.adminIcon}`}>
                            {role.icon}
                        </div>
                        <span className={styles.roleName}>{role.name}</span>
                        <p className={styles.roleDesc}>{role.desc}</p>
                    </div>
                ))}
            </section>

            {currentAdminInfo && (
                <div className={styles.currentUserCard}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                            {currentAdminInfo.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <span className={styles.userName}>
                                {currentAdminInfo.full_name} 
                                <span className={styles.youBadge}>You</span>
                            </span>
                            <span className={styles.userEmail}>{currentAdminInfo.email}</span>
                        </div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                        {currentAdminInfo.role.replace('_', ' ')}
                    </span>
                </div>
            )}

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Member</th>
                            <th className={styles.th}>Role</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Last Active</th>
                            <th className={styles.th}>Joined</th>
                            <th className={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => (
                            <tr 
                                key={member.id} 
                                className={`${styles.tr} ${selectedMember?.id === member.id ? styles.trSelected : ''}`}
                                onClick={() => setSelectedMember(member)}
                            >
                                <td className={styles.td}>
                                    <div className={styles.userInfo}>
                                        <div className={styles.avatar} style={{ width: 36, height: 36, fontSize: '0.875rem' }}>
                                            {member.full_name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 600, display: 'block' }}>{member.full_name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{member.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <CustomSelect
                                            value={member.role}
                                            disabled={member.profile_id === currentUser?.id}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                            options={[
                                                { label: 'Super Admin', value: 'super_admin' },
                                                { label: 'Admin', value: 'admin' },
                                                { label: 'Moderator', value: 'moderator' },
                                                { label: 'Support', value: 'support' }
                                            ]}
                                            className={styles.roleSelect}
                                        />
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusBadge} ${styles[`status${member.status.charAt(0).toUpperCase() + member.status.slice(1)}`]}`}>
                                        {member.status === 'invited' ? 'Invite Pending' : member.status}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    {formatRelativeTime(member.last_login_at)}
                                </td>
                                <td className={styles.td}>
                                    {new Date(member.created_at).toLocaleDateString()}
                                </td>
                                <td className={styles.td}>
                                    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                                        {member.status === 'active' && member.profile_id !== currentUser?.id && (
                                            <button 
                                                className={`${styles.actionBtn} ${styles.btnSecondary}`}
                                                onClick={() => handleStatusChange(member.id, 'inactive')}
                                            >
                                                Deactivate
                                            </button>
                                        )}
                                        {member.status === 'inactive' && (
                                            <button 
                                                className={`${styles.actionBtn} ${styles.btnSecondary}`}
                                                onClick={() => handleStatusChange(member.id, 'active')}
                                            >
                                                Reactivate
                                            </button>
                                        )}
                                        {member.status === 'invited' && (
                                            <button 
                                                className={`${styles.actionBtn} ${styles.btnSecondary}`}
                                                onClick={() => alert('Invite resent to ' + member.email)}
                                            >
                                                Resend
                                            </button>
                                        )}
                                        {member.profile_id !== currentUser?.id && (
                                            <button 
                                                className={`${styles.actionBtn} ${styles.btnDanger}`}
                                                onClick={() => handleRemoveMember(member)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedMember && (
                <section className={styles.permissionsCard}>
                    <div className={styles.permissionsTitle}>
                        <div>
                            Permissions for <span style={{ color: '#4f46e5' }}>{selectedMember.full_name}</span>
                            <div style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6b7280', marginTop: 4 }}>
                                Granular access controls for admin features
                            </div>
                        </div>
                        <button 
                            className={styles.updatePermsBtn}
                            onClick={handleUpdatePermissions}
                        >
                            Update Permissions
                        </button>
                    </div>
                    <div className={styles.permissionsGrid}>
                        {PERMISSIONS.map(perm => (
                            <label key={perm.id} className={styles.permItem}>
                                <input 
                                    type="checkbox" 
                                    className={styles.checkbox}
                                    checked={!!selectedMember.permissions?.[perm.id]}
                                    onChange={() => togglePermission(perm.id)}
                                />
                                <span className={styles.permLabel}>{perm.label}</span>
                            </label>
                        ))}
                    </div>
                </section>
            )}

            {showInviteModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Invite Team Member</h2>
                            <p className={styles.modalDesc}>Send an invitation to join the admin panel.</p>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Full Name</label>
                                <input 
                                    type="text" 
                                    className={styles.input}
                                    required
                                    placeholder="e.g. John Doe"
                                    value={inviteData.fullName}
                                    onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input 
                                    type="email" 
                                    className={styles.input}
                                    required
                                    placeholder="john@talentmesh.ai"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Role</label>
                                <CustomSelect
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                    options={[
                                        { label: 'Admin', value: 'admin' },
                                        { label: 'Moderator', value: 'moderator' },
                                        { label: 'Support', value: 'support' }
                                    ]}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button 
                                    type="button" 
                                    className={styles.btnCancel}
                                    onClick={() => setShowInviteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className={styles.btnInvite}
                                    disabled={isInviting}
                                >
                                    {isInviting ? <div className={styles.spinner}></div> : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
