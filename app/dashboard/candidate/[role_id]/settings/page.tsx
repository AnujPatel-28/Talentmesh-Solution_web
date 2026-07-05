"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import type { CandidateSettingsBundle } from '@/lib/candidate-profile';
import { normalizeCandidateProfile } from '@/lib/candidate-profile';
import { invokeFunction, insforge } from '@/lib/insforge';
import Toast from '@/components/ui/Toast';
import { FormSkeleton } from '@/components/ui/LoadingSkeletons';
import styles from './settings.module.css';

/* ─── Icons ─── */
const IC = {
    profile: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    preferences: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    security: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    notifications: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    privacy: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    trash: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    )
};

const EMPTY_STATE: CandidateSettingsBundle = {
    profile: { id: '', email: '', name: '', phone: '', location: '', role: null, completed_onboarding: false },
    candidateProfile: {
        headline: '', skills: [], experience_years: null, education: [], resume_url: '',
        linkedin_url: '', github_url: '', portfolio_url: '', salary_min: null, salary_max: null,
        currency: 'INR', open_to_remote: true, is_visible: true, preferred_locations: [],
        job_types: [], profile_strength: 0,
    },
};

export default function SettingsPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = params.role_id as string;
    const { refreshUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'notifications' | 'privacy'>('profile');
    const { user } = useAuth();
    const [form, setForm] = useState<CandidateSettingsBundle>(EMPTY_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);

    // Edit states for individual fields
    const [editValue, setEditValue] = useState('');
    const [editValue2, setEditValue2] = useState(''); // Secondary value for ranges

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await invokeFunction('candidate-profile', { method: 'GET' });
                const data = res.data;
                if (!data || !data.profile) throw new Error('Profile not found');

                const bundle: CandidateSettingsBundle = {
                    profile: {
                        id: data.profile.id,
                        email: data.profile.email,
                        name: data.profile.name || '',
                        phone: data.profile.phone || '',
                        location: data.profile.location || '',
                        role: data.profile.role,
                        completed_onboarding: data.profile.completed_onboarding || false,
                    },
                    candidateProfile: normalizeCandidateProfile(data.candidateProfile || {})
                };
                setForm(bundle);
            } catch (err) {
                console.error("Error loading settings:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleSaveField = async (fieldName: string) => {
        try {
            let updatedProfile = { ...form.profile };
            let updatedCand = { ...form.candidateProfile };

            if (fieldName === 'name') updatedProfile.name = editValue;
            if (fieldName === 'phone') updatedProfile.phone = editValue;
            if (fieldName === 'location') updatedProfile.location = editValue;
            if (fieldName === 'headline') updatedCand.headline = editValue;
            if (fieldName === 'job_type') updatedCand.job_types = [editValue];
            if (fieldName === 'expected_salary') {
                updatedCand.salary_min = Number(editValue) || null;
                updatedCand.salary_max = Number(editValue2) || null;
            }

            await invokeFunction('candidate-profile', {
                method: 'PUT',
                body: {
                    profile: {
                        ...updatedProfile,
                        role: updatedProfile.role === null ? undefined : updatedProfile.role,
                    },
                    candidateProfile: updatedCand
                }
            });

            setForm({ profile: updatedProfile, candidateProfile: updatedCand });
            setEditingField(null);
            setToast({ message: 'Settings saved successfully!', type: 'success' });
            await refreshUser();
        } catch (err: any) {
            setToast({ message: err.message || 'Save failed', type: 'error' });
        }
    };

    const handlePasswordUpdate = async () => {
        if (!editValue || editValue.length < 8) {
            setToast({ message: 'Password must be at least 8 characters long.', type: 'error' });
            return;
        }
        try {
            const token = window.sessionStorage.getItem('tm_token');
            if (!token) throw new Error('No active session. Please log in again.');

            const response = await fetch(`${process.env.NEXT_PUBLIC_INSFORGE_URL}/auth/v1/user`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: editValue })
            });

            if (!response.ok) throw new Error('Failed to update password');
            setEditingField(null);
            setToast({ message: 'Password updated successfully!', type: 'success' });
        } catch (err: any) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleToggleNotification = (key: string, val: boolean) => {
        setToast({ message: 'Notification settings updated.', type: 'success' });
    };

    const handleTogglePrivacy = async () => {
        const nextVal = !form.candidateProfile.is_visible;
        try {
            await insforge.database
                .from('candidate_profiles')
                .update({ is_visible: nextVal })
                .eq('id', form.profile.id);

            setForm(prev => ({
                ...prev,
                candidateProfile: { ...prev.candidateProfile, is_visible: nextVal }
            }));
            setToast({ message: nextVal ? 'Profile visible to recruiters' : 'Profile hidden', type: 'info' });
        } catch (e) {
            console.error(e);
        }
    };

    const chevronRight = (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
    );

    if (isLoading) {
        return <FormSkeleton fields={5} />;
    }

    return (
        <div style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 64px)', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ─── Left Sidebar ─── */}
            <div style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '24px 16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#12263A', margin: '0 0 24px 8px', letterSpacing: '-0.02em' }}>
                    Settings
                </h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {([
                        { id: 'profile', label: 'Account settings', desc: 'Your contact information', icon: IC.profile },
                        { id: 'security', label: 'Security settings', desc: 'Password and protection', icon: IC.security, isNew: true },
                        { id: 'notifications', label: 'Communications', desc: 'Alerts and preferences', icon: IC.notifications },
                        { id: 'preferences', label: 'Device & Job preferences', desc: 'Salary, titles and options', icon: IC.preferences },
                        { id: 'privacy', label: 'Privacy settings', desc: 'Your visibility preferences', icon: IC.privacy },
                    ] as const).map(tab => {
                        const isActive = activeTab === (tab.id as any);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as any); setEditingField(null); }}
                                className={styles.settingsTabBtn}
                                style={{
                                    backgroundColor: isActive ? '#f0f7ff' : 'transparent',
                                }}
                            >
                                <span style={{ color: isActive ? '#007BFF' : '#64748b', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                    {tab.icon}
                                </span>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: isActive ? '#0056b3' : '#1e293b' }}>{tab.label}</span>
                                        {(tab as any).isNew && (
                                            <span className={styles.pillBadge}>New</span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3 }}>{tab.desc}</span>
                                </div>
                                <span style={{ color: '#cbd5e1', flexShrink: 0 }}>{chevronRight}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── Right Panel ─── */}
            <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>

                    {activeTab === 'profile' && (
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Account settings</h2>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Manage your primary account details and communication address.</p>
                            </div>
                            
                            <div className={styles.settingsCard}>
                                {([
                                    { field: 'account_type', label: 'Account type', value: 'Jobseeker', action: 'Change account type', editable: false },
                                    { field: 'email', label: 'Email', value: form.profile.email, action: 'Change email', editable: false },
                                    { field: 'phone', label: 'Phone number', value: form.profile.phone || 'Not added', action: 'Change phone number', editable: true },
                                    { field: 'name', label: 'Full name', value: form.profile.name, action: 'Change name', editable: true },
                                ] as const).map(row => (
                                    <div key={row.field} className={styles.settingsRow}>
                                        {editingField === row.field ? (
                                            <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    className={styles.settingsInput}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleSaveField(row.field as any)} className={styles.actionBtnPrimary}>Save</button>
                                                <button onClick={() => setEditingField(null)} className={styles.actionBtnSecondary}>Cancel</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{row.label}</span>
                                                    <span style={{ fontSize: '15px', fontWeight: 500, color: '#1e293b' }}>{row.value}</span>
                                                </div>
                                                {row.editable && (
                                                    <button
                                                        onClick={() => { setEditingField(row.field as any); setEditValue((form.profile as any)[row.field] || ''); }}
                                                        style={{ background: 'none', border: 'none', color: '#007BFF', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '6px', transition: 'background 0.2s' }}
                                                        onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f0f7ff')}
                                                        onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                    >
                                                        {row.action}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}

                                {/* Passkey row */}
                                <div className={styles.settingsRow}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Passkey</span>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, background: '#e2e8f0', color: '#475569', borderRadius: '50%', fontSize: '11px', fontWeight: 700, cursor: 'help' }} title="Passkeys let you sign in without a password">i</span>
                                        </div>
                                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>No passkey registered</span>
                                    </div>
                                    <button 
                                        style={{ background: 'none', border: 'none', color: '#007BFF', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}
                                        onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f0f7ff')}
                                        onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        Create passkey
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Job preferences</h2>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Configure how matches and search queries are tailored to your profile.</p>
                            </div>
                            
                            <div className={styles.settingsCard}>
                                {/* Row 1: Headline */}
                                <div className={styles.settingsRow}>
                                    {editingField === 'headline' ? (
                                        <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                value={editValue} 
                                                onChange={(e) => setEditValue(e.target.value)} 
                                                className={styles.settingsInput}
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveField('headline')} className={styles.actionBtnPrimary}>Save</button>
                                            <button onClick={() => setEditingField(null)} className={styles.actionBtnSecondary}>Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Job Title / Headline</span>
                                                <span style={{ fontSize: '15px', fontWeight: 500, color: '#1e293b' }}>{form.candidateProfile.headline || 'Not set'}</span>
                                            </div>
                                            <button onClick={() => { setEditingField('headline'); setEditValue(form.candidateProfile.headline || ''); }} className={styles.actionBtnSecondary}>Edit</button>
                                        </>
                                    )}
                                </div>

                                {/* Row 2: Job Type */}
                                <div className={styles.settingsRow}>
                                    {editingField === 'job_type' ? (
                                        <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                            <select 
                                                value={editValue} 
                                                onChange={(e) => setEditValue(e.target.value)} 
                                                className={styles.settingsInput}
                                                style={{ padding: '10px' }}
                                            >
                                                <option value="Full-time">Full-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Freelance">Freelance</option>
                                                <option value="Internship">Internship</option>
                                            </select>
                                            <button onClick={() => handleSaveField('job_type')} className={styles.actionBtnPrimary}>Save</button>
                                            <button onClick={() => setEditingField(null)} className={styles.actionBtnSecondary}>Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Job Type</span>
                                                <span style={{ fontSize: '15px', fontWeight: 500, color: '#1e293b' }}>{form.candidateProfile.job_types?.[0] || 'Full-time'}</span>
                                            </div>
                                            <button onClick={() => { setEditingField('job_type'); setEditValue(form.candidateProfile.job_types?.[0] || 'Full-time'); }} className={styles.actionBtnSecondary}>Edit</button>
                                        </>
                                    )}
                                </div>

                                {/* Row 3: Expected Salary */}
                                <div className={styles.settingsRow}>
                                    {editingField === 'expected_salary' ? (
                                        <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                            <input 
                                                type="number" 
                                                placeholder="Min Salary" 
                                                value={editValue} 
                                                onChange={(e) => setEditValue(e.target.value)} 
                                                className={styles.settingsInput}
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Max Salary" 
                                                value={editValue2} 
                                                onChange={(e) => setEditValue2(e.target.value)} 
                                                className={styles.settingsInput}
                                            />
                                            <button onClick={() => handleSaveField('expected_salary')} className={styles.actionBtnPrimary}>Save</button>
                                            <button onClick={() => setEditingField(null)} className={styles.actionBtnSecondary}>Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Expected Salary</span>
                                                <span style={{ fontSize: '15px', fontWeight: 500, color: '#1e293b' }}>
                                                    {form.candidateProfile.salary_min ? `${form.candidateProfile.currency} ${form.candidateProfile.salary_min.toLocaleString()} - ${form.candidateProfile.salary_max ? form.candidateProfile.salary_max.toLocaleString() : 'No max'}` : 'Not set'}
                                                </span>
                                            </div>
                                            <button onClick={() => { setEditingField('expected_salary'); setEditValue(String(form.candidateProfile.salary_min || '')); setEditValue2(String(form.candidateProfile.salary_max || '')); }} className={styles.actionBtnSecondary}>Edit</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Security settings</h2>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Manage your account protection and authentication credentials.</p>
                            </div>
                            
                            <div className={styles.settingsCard}>
                                <div className={styles.settingsRow}>
                                    {editingField === 'password' ? (
                                        <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                            <input 
                                                type="password" 
                                                placeholder="Enter new password (min 8 chars)" 
                                                value={editValue} 
                                                onChange={(e) => setEditValue(e.target.value)} 
                                                className={styles.settingsInput}
                                                autoFocus
                                            />
                                            <button onClick={handlePasswordUpdate} className={styles.actionBtnPrimary}>Update</button>
                                            <button onClick={() => setEditingField(null)} className={styles.actionBtnSecondary}>Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Security Credentials</span>
                                                <span style={{ fontSize: '15px', color: '#64748b', letterSpacing: '2px' }}>••••••••••••</span>
                                            </div>
                                            <button onClick={() => { setEditingField('password'); setEditValue(''); }} className={styles.actionBtnSecondary}>Update Password</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Communications</h2>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Control the frequency and channels of alerts you receive.</p>
                            </div>
                            
                            <div className={styles.settingsCard}>
                                {[
                                    { key: 'recommendations', label: 'Job Recommendations', desc: 'Receive AI-matched roles directly in your inbox' },
                                    { key: 'updates', label: 'Application Updates', desc: 'Status updates on your active submissions' }
                                ].map(item => (
                                    <div key={item.key} className={styles.settingsRow}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{item.label}</span>
                                            <span style={{ fontSize: '13px', color: '#64748b' }}>{item.desc}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleToggleNotification(item.key, true)} 
                                            className={styles.actionBtnSecondary}
                                            style={{ backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', fontWeight: 600 }}
                                        >
                                            Enabled
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Privacy settings</h2>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Manage your visibility and discoverability in search databases.</p>
                            </div>
                            
                            <div className={styles.settingsCard}>
                                <div className={styles.settingsRow}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Recruiter Discoverability</span>
                                        <span style={{ fontSize: '13px', color: '#64748b', maxWidth: '80%' }}>Allow verified companies to find your profile and download your resume.</span>
                                    </div>
                                    
                                    {/* Custom Switch Toggle representation */}
                                    <div 
                                        onClick={handleTogglePrivacy}
                                        style={{
                                            width: '52px',
                                            height: '28px',
                                            borderRadius: '99px',
                                            backgroundColor: form.candidateProfile.is_visible ? '#007BFF' : '#cbd5e1',
                                            padding: '2px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: form.candidateProfile.is_visible ? 'flex-end' : 'flex-start',
                                            transition: 'all 0.2s ease',
                                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ffffff',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            transition: 'all 0.2s ease'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
