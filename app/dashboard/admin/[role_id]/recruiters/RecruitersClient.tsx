"use client";

import React, { useState, useTransition } from 'react';
import styles from './recruiters.module.css';
import { createRecruiterAction, updatePermissionsAction, toggleRecruiterStatusAction, resetRecruiterPasswordAction } from './actions';
import { useAuth } from '@/lib/auth/AuthContext';

interface Recruiter {
    id: string;
    job_title: string;
    is_approved: boolean;
    permissions: any;
    profiles: any;
    company: any;
}

interface Company {
    id: string;
    company_name: string;
}

export default function RecruitersClient({ initialRecruiters, companies }: { initialRecruiters: any[], companies: Company[] }) {
    const { user, isLoading: authLoading } = useAuth();
    const [recruiters, setRecruiters] = useState(initialRecruiters);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null);
    const [isPending, startTransition] = useTransition();

    if (authLoading || !user) {
        return <div className={styles.loading}>Initializing Dashboard...</div>;
    }

    const permissionLabels: Record<string, string> = {
        post_jobs: "Post Jobs",
        search_candidates: "Search Base",
        view_analytics: "Analytics",
        send_messages: "Messages",
        schedule_interviews: "Interviews",
        view_billing: "Billing"
    };

    const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // Collate permissions
        const perms = {
            post_jobs: formData.get('post_jobs') === 'on',
            search_candidates: formData.get('search_candidates') === 'on',
            view_analytics: formData.get('view_analytics') === 'on',
            send_messages: formData.get('send_messages') === 'on',
            schedule_interviews: formData.get('schedule_interviews') === 'on',
            view_billing: formData.get('view_billing') === 'on'
        };
        formData.append('permissions', JSON.stringify(perms));

        startTransition(async () => {
            const res = await createRecruiterAction(formData, user!.id);
            if (res.success) {
                setIsAddOpen(false);
                window.location.reload(); // Refresh to show new entry
            } else {
                alert(res.error);
            }
        });
    };

    const handleUpdatePermissions = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingRecruiter) return;

        const formData = new FormData(e.currentTarget);
        const perms = {
            post_jobs: formData.get('post_jobs') === 'on',
            search_candidates: formData.get('search_candidates') === 'on',
            view_analytics: formData.get('view_analytics') === 'on',
            send_messages: formData.get('send_messages') === 'on',
            schedule_interviews: formData.get('schedule_interviews') === 'on',
            view_billing: formData.get('view_billing') === 'on'
        };

        startTransition(async () => {
            const res = await updatePermissionsAction(editingRecruiter.id, perms, user!.id);
            if (res.success) {
                setEditingRecruiter(null);
                window.location.reload();
            } else {
                alert(res.error);
            }
        });
    };

    const handleToggleStatus = async (id: string, current: string) => {
        if (!confirm(`Are you sure you want to ${current === 'active' ? 'suspend' : 'activate'} this user?`)) return;
        startTransition(async () => {
            await toggleRecruiterStatusAction(id, current, user!.id);
            window.location.reload();
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Recruiter Management</h1>
                <button className={styles.addBtn} onClick={() => setIsAddOpen(true)}>
                    <span>+</span> Add Recruiter
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Recruiter</th>
                            <th>Company</th>
                            <th>Permissions</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recruiters.map((rec) => {
                            const profiles = Array.isArray(rec.profiles) ? rec.profiles[0] : rec.profiles;
                            const status = profiles?.status || 'active';
                            
                            return (
                                <tr key={rec.id}>
                                    <td>
                                        <div className={styles.recruiterCell}>
                                            <div className={styles.avatar}>
                                                {(profiles?.name?.[0] || 'R').toUpperCase()}
                                            </div>
                                            <div>
                                                <strong>{profiles?.name || 'Recruiter'}</strong>
                                                <span className={styles.email}>{profiles?.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.company}>{rec.company?.company_name}</span>
                                        <span className={styles.email}>{rec.job_title}</span>
                                    </td>
                                    <td>
                                        <div className={styles.permissionPills} onClick={() => setEditingRecruiter(rec)}>
                                            {Object.entries(rec.permissions || {}).map(([k, v]) => (
                                                v ? <span key={k} className={styles.pill}>{permissionLabels[k] || k}</span> : null
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.statusIndicator}>
                                            <div className={`${styles.statusDot} ${status === 'suspended' ? styles.suspendedDot : styles.activeDot}`} />
                                            {status === 'suspended' ? 'Suspended' : 'Active'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => setEditingRecruiter(rec)} title="Edit Permissions">⚙️</button>
                                            <button className={styles.iconBtn} onClick={() => handleToggleStatus(rec.id, status)} title="Suspend/Activate">🚫</button>
                                            <button className={styles.iconBtn} onClick={() => resetRecruiterPasswordAction(profiles?.email)} title="Reset Password">🔑</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add Recruiter Drawer */}
            {isAddOpen && (
                <>
                    <div className={styles.overlay} onClick={() => setIsAddOpen(false)} />
                    <div className={styles.drawer}>
                        <div className={styles.drawerHead}>
                            <h2>Add New Recruiter</h2>
                            <button className={styles.closeBtn} onClick={() => setIsAddOpen(false)}>&times;</button>
                        </div>
                        <div className={styles.drawerBody}>
                            <form className={styles.form} onSubmit={handleInvite}>
                                <div className={styles.formGroup}>
                                    <label>Full Name</label>
                                    <input name="name" className={styles.input} required placeholder="e.g. Anuj Patel" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email Address</label>
                                    <input name="email" type="email" className={styles.input} required placeholder="recruiter@company.com" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Company</label>
                                    <select name="companyId" className={styles.select} required>
                                        <option value="">Select Company</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Job Title</label>
                                    <input name="jobTitle" className={styles.input} required placeholder="e.g. HR Manager" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Permissions</label>
                                    <div className={styles.permissionsList}>
                                        {Object.keys(permissionLabels).map(k => (
                                            <label key={k} className={styles.permissionItem}>
                                                <input type="checkbox" name={k} defaultChecked={k !== 'view_analytics' && k !== 'view_billing'} className={styles.checkbox} />
                                                <span>{permissionLabels[k]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.drawerFoot}>
                                    <button type="submit" disabled={isPending} className={styles.submitBtn}>
                                        {isPending ? 'Sending...' : 'Send Invite'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Permissions Editor Drawer */}
            {editingRecruiter && (
                <>
                    <div className={styles.overlay} onClick={() => setEditingRecruiter(null)} />
                    <div className={styles.drawer}>
                        <div className={styles.drawerHead}>
                            <div>
                                <h2>Edit Permissions</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{editingRecruiter.profiles?.name}</p>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setEditingRecruiter(null)}>&times;</button>
                        </div>
                        <div className={styles.drawerBody}>
                            <form className={styles.form} onSubmit={handleUpdatePermissions}>
                                <div className={styles.permissionsList}>
                                    {Object.keys(permissionLabels).map(k => (
                                        <label key={k} className={styles.permissionItem}>
                                            <input 
                                                type="checkbox" 
                                                name={k} 
                                                defaultChecked={editingRecruiter.permissions?.[k]} 
                                                className={styles.checkbox} 
                                            />
                                            <span>{permissionLabels[k]}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className={styles.drawerFoot}>
                                    <button type="submit" disabled={isPending} className={styles.submitBtn}>
                                        {isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button 
                                        type="button" 
                                        className={styles.suspendBtn}
                                        onClick={() => handleToggleStatus(editingRecruiter.id, editingRecruiter.profiles?.status)}
                                    >
                                        {editingRecruiter.profiles?.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
