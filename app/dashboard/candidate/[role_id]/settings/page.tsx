"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import type { CandidateSettingsBundle } from '@/lib/candidate-profile';
import { invokeFunction } from '@/lib/insforge';
import styles from '../../../shared-dashboard.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';

/* ─── Premium SVG Icons ─── */
const IC = {
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    briefcase: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    lock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    trash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
};

type ToggleItem = { label: string; desc: string; on: boolean };

const EMPTY_STATE: CandidateSettingsBundle = {
    profile: { id: '', email: '', name: '', phone: '', location: '', role: null, completed_onboarding: false },
    candidateProfile: {
        headline: '', skills: [], experience_years: null, education: '', resume_url: '',
        linkedin_url: '', github_url: '', portfolio_url: '', salary_min: null, salary_max: null,
        currency: 'USD', open_to_remote: true, is_visible: true, preferred_locations: [],
        job_type: '', profile_strength: 0,
    },
};

const INITIAL_NOTIFICATIONS: ToggleItem[] = [
    { label: 'Job Recommendations', desc: 'Get notified about jobs matching your profile', on: true },
    { label: 'Application Updates', desc: 'Status changes on your applications', on: true },
    { label: 'Weekly Digest', desc: 'Summary of new opportunities every week', on: false },
];

const INITIAL_PRIVACY: ToggleItem[] = [
    { label: 'Profile Visibility', desc: 'Make your profile visible to recruiters', on: true },
    { label: 'Show Match Score', desc: 'Allow companies to see your AI match score', on: true },
];

export default function CandidateSettingsPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [form, setForm] = useState<CandidateSettingsBundle>(EMPTY_STATE);
    const [expectedSalary, setExpectedSalary] = useState('');
    const [preferredLocationsInput, setPreferredLocationsInput] = useState('');
    const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
    const [privacy, setPrivacy] = useState(INITIAL_PRIVACY);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'success' });

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await invokeFunction('candidate-profile', { method: 'GET' });
                const profile = res.data;
                if (!profile) throw new Error('Profile not found');

                const bundle: CandidateSettingsBundle = {
                    profile: {
                        id: profile.id,
                        email: profile.email,
                        name: profile.name || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        role: profile.role,
                        completed_onboarding: profile.completed_onboarding || false,
                    },
                    candidateProfile: profile.candidate_profiles ? {
                        headline: profile.candidate_profiles.headline || '',
                        skills: profile.candidate_profiles.skills || [],
                        experience_years: profile.candidate_profiles.experience_years ?? null,
                        education: (profile.candidate_profiles.education as any) || '',
                        resume_url: profile.candidate_profiles.resume_url || '',
                        linkedin_url: profile.candidate_profiles.linkedin_url || '',
                        github_url: profile.candidate_profiles.github_url || '',
                        portfolio_url: profile.candidate_profiles.portfolio_url || '',
                        salary_min: profile.candidate_profiles.salary_min ?? null,
                        salary_max: profile.candidate_profiles.salary_max ?? null,
                        currency: profile.candidate_profiles.currency || 'USD',
                        open_to_remote: profile.candidate_profiles.open_to_remote ?? true,
                        is_visible: profile.candidate_profiles.is_visible ?? true,
                        preferred_locations: profile.candidate_profiles.preferred_locations || [],
                        job_type: profile.candidate_profiles.job_types?.[0] || '',
                        profile_strength: profile.candidate_profiles.profile_strength || 0,
                    } : {
                        headline: '', skills: [], experience_years: null, education: '', resume_url: '',
                        linkedin_url: '', github_url: '', portfolio_url: '', salary_min: null, salary_max: null,
                        currency: 'USD', open_to_remote: true, is_visible: true, preferred_locations: [],
                        job_type: '', profile_strength: 0,
                    }
                };

                setForm(bundle);
                if (bundle.candidateProfile.salary_min) setExpectedSalary(`${bundle.candidateProfile.salary_min} - ${bundle.candidateProfile.salary_max || ''}`);
                setPreferredLocationsInput(bundle.candidateProfile.preferred_locations.join(', '));
            } catch (err) {
                setMessage({ text: err instanceof Error ? err.message : 'Error loading profile', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const saveSettings = async (mode: 'profile' | 'preferences') => {
        setSaving(true);
        setMessage({ text: '', type: 'success' });
        try {
            await invokeFunction('candidate-profile', {
                method: 'POST',
                body: {
                    profile: {
                        ...form.profile,
                        role: form.profile.role === null ? undefined : form.profile.role,
                    },
                    candidateProfile: form.candidateProfile
                }
            });
            
            // Re-fetch to ensure sync
            const res = await invokeFunction('candidate-profile', { method: 'GET' });
            const updatedProfile = res.data;
            if (!updatedProfile) throw new Error('Updated profile not found');

            const updatedBundle: CandidateSettingsBundle = {
                profile: {
                    id: updatedProfile.id,
                    email: updatedProfile.email,
                    name: updatedProfile.name || '',
                    phone: updatedProfile.phone || '',
                    location: updatedProfile.location || '',
                    role: updatedProfile.role,
                    completed_onboarding: updatedProfile.completed_onboarding || false,
                },
                candidateProfile: updatedProfile.candidate_profiles ? {
                    headline: updatedProfile.candidate_profiles.headline || '',
                    skills: updatedProfile.candidate_profiles.skills || [],
                    experience_years: updatedProfile.candidate_profiles.experience_years ?? null,
                    education: (updatedProfile.candidate_profiles.education as any) || '',
                    resume_url: updatedProfile.candidate_profiles.resume_url || '',
                    linkedin_url: updatedProfile.candidate_profiles.linkedin_url || '',
                    github_url: updatedProfile.candidate_profiles.github_url || '',
                    portfolio_url: updatedProfile.candidate_profiles.portfolio_url || '',
                    salary_min: updatedProfile.candidate_profiles.salary_min ?? null,
                    salary_max: updatedProfile.candidate_profiles.salary_max ?? null,
                    currency: updatedProfile.candidate_profiles.currency || 'USD',
                    open_to_remote: updatedProfile.candidate_profiles.open_to_remote ?? true,
                    is_visible: updatedProfile.candidate_profiles.is_visible ?? true,
                    preferred_locations: updatedProfile.candidate_profiles.preferred_locations || [],
                    job_type: updatedProfile.candidate_profiles.job_types?.[0] || '',
                    profile_strength: updatedProfile.candidate_profiles.profile_strength || 0,
                } : form.candidateProfile
            };
            setForm(updatedBundle);
            
            // 🔥 Refresh the global user state to update Navbar/Sidebar names
            await refreshUser();
            
            setMessage({ text: mode === 'profile' ? 'Profile updated successfully!' : 'Preferences saved!', type: 'success' });
        } catch (err) {
            setMessage({ text: err instanceof Error ? err.message : 'Update failed', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) return <div className={styles.loadingState}><div className={styles.spinner}></div><p>Preparing your workspace...</p></div>;

    return (
        <div className={styles.dash}>
            {/* Header Section */}
            <div className={styles.settingsHeader}>
                <div className={styles.titleArea}>
                    <h1 className={styles.greetTitle}>Account Settings</h1>
                    <p className={styles.greetSub}>Manage your professional identity and search preferences.</p>
                </div>
                <div className={styles.profileMeter}>
                    <div className={styles.meterInfo}>
                        <span className={styles.meterLabel}>Profile Strength</span>
                        <span className={styles.meterVal}>{form.candidateProfile.profile_strength}%</span>
                    </div>
                    <div className={styles.meterBar}><div className={styles.meterFill} style={{ width: `${form.candidateProfile.profile_strength}%` }}></div></div>
                </div>
            </div>

            {message.text && (
                <div className={`${styles.toast} ${styles[`toast_${message.type}`]}`}>
                    {message.type === 'success' ? IC.check : '!'} {message.text}
                </div>
            )}

            <div className={styles.settingsGrid}>
                {/* Profile Section */}
                <AnimateOnScroll animation="fadeUp" delay={100}>
                    <div className={styles.settingsCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIconBox} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IC.user}</div>
                            <h2 className={styles.cardTitle}>Personal Information</h2>
                        </div>
                        <div className={styles.formStack}>
                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>Full Name</label>
                                <div className={styles.inputIconWrap}>
                                    <span className={styles.inputIcon}>{IC.user}</span>
                                    <input value={form.profile.name} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, name: e.target.value } }))} className={styles.premiumInput} placeholder="John Doe" />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>Email Address</label>
                                <div className={styles.inputIconWrap}>
                                    <span className={styles.inputIcon}>{IC.mail}</span>
                                    <input value={form.profile.email} readOnly className={`${styles.premiumInput} ${styles.inputReadOnly}`} />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.fieldLabel}>Phone</label>
                                    <div className={styles.inputIconWrap}>
                                        <span className={styles.inputIcon}>{IC.phone}</span>
                                        <input value={form.profile.phone} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, phone: e.target.value } }))} className={styles.premiumInput} placeholder="+1 234 567 890" />
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.fieldLabel}>Location</label>
                                    <div className={styles.inputIconWrap}>
                                        <span className={styles.inputIcon}>{IC.globe}</span>
                                        <input value={form.profile.location} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, location: e.target.value } }))} className={styles.premiumInput} placeholder="New York, NY" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.cardFooter}>
                            <button onClick={() => saveSettings('profile')} disabled={saving} className={styles.premiumBtn}>
                                {saving ? <div className={styles.spinnerSmall}></div> : 'Save Profile Changes'}
                            </button>
                        </div>
                    </div>
                </AnimateOnScroll>

                {/* Job Preferences Section */}
                <AnimateOnScroll animation="fadeUp" delay={200}>
                    <div className={styles.settingsCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIconBox} style={{ background: '#f0fdf4', color: '#10b981' }}>{IC.briefcase}</div>
                            <h2 className={styles.cardTitle}>Job search preferences</h2>
                        </div>
                        <div className={styles.formStack}>
                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>Desired Headline</label>
                                <input value={form.candidateProfile.headline} onChange={e => setForm(p => ({ ...p, candidateProfile: { ...p.candidateProfile, headline: e.target.value } }))} className={styles.premiumInput} placeholder="Senior Product Designer" />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.fieldLabel}>Employment Type</label>
                                    <select value={form.candidateProfile.job_type} onChange={e => setForm(p => ({ ...p, candidateProfile: { ...p.candidateProfile, job_type: e.target.value } }))} className={styles.premiumSelect}>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Freelance">Freelance</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.fieldLabel}>Expected Salary (Monthly)</label>
                                    <input value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)} className={styles.premiumInput} placeholder="e.g. 5000 - 8000" />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>Preferred Locations (Comma separated)</label>
                                <input value={preferredLocationsInput} onChange={e => {
                                    setPreferredLocationsInput(e.target.value);
                                    setForm(p => ({ ...p, candidateProfile: { ...p.candidateProfile, preferred_locations: e.target.value.split(',').map(s => s.trim()) } }));
                                }} className={styles.premiumInput} placeholder="Remote, San Francisco, London" />
                            </div>
                        </div>
                        <div className={styles.cardFooter}>
                            <button onClick={() => saveSettings('preferences')} disabled={saving} className={styles.premiumBtn} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                {saving ? <div className={styles.spinnerSmall}></div> : 'Update Preferences'}
                            </button>
                        </div>
                    </div>
                </AnimateOnScroll>

                {/* Notifications Section */}
                <AnimateOnScroll animation="fadeUp" delay={300}>
                    <div className={styles.settingsCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIconBox} style={{ background: '#fef3c7', color: '#f59e0b' }}>{IC.bell}</div>
                            <h2 className={styles.cardTitle}>Notifications</h2>
                        </div>
                        <div className={styles.toggleStack}>
                            {notifications.map((item, i) => (
                                <div key={i} className={styles.toggleItem}>
                                    <div className={styles.toggleText}>
                                        <span className={styles.toggleLabel}>{item.label}</span>
                                        <span className={styles.toggleDesc}>{item.desc}</span>
                                    </div>
                                    <button className={`${styles.switch} ${item.on ? styles.switchOn : ''}`} onClick={() => setNotifications(p => p.map((it, idx) => idx === i ? { ...it, on: !it.on } : it))}>
                                        <div className={styles.switchHandle}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimateOnScroll>

                {/* Privacy Section */}
                <AnimateOnScroll animation="fadeUp" delay={400}>
                    <div className={styles.settingsCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIconBox} style={{ background: '#f5f3ff', color: '#8b5cf6' }}>{IC.shield}</div>
                            <h2 className={styles.cardTitle}>Privacy & Visibility</h2>
                        </div>
                        <div className={styles.toggleStack}>
                            {privacy.map((item, i) => (
                                <div key={i} className={styles.toggleItem}>
                                    <div className={styles.toggleText}>
                                        <span className={styles.toggleLabel}>{item.label}</span>
                                        <span className={styles.toggleDesc}>{item.desc}</span>
                                    </div>
                                    <button className={`${styles.switch} ${item.on ? styles.switchOn : ''}`} onClick={() => setPrivacy(p => p.map((it, idx) => idx === i ? { ...it, on: !it.on } : it))}>
                                        <div className={styles.switchHandle}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimateOnScroll>

                {/* Security Section */}
                <AnimateOnScroll animation="fadeUp" delay={500}>
                    <div className={styles.settingsCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIconBox} style={{ background: '#ecfdf5', color: '#059669' }}>{IC.lock}</div>
                            <h2 className={styles.cardTitle}>Security</h2>
                        </div>
                        <div className={styles.formStack}>
                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>Current Password</label>
                                <input type="password" placeholder="••••••••" value={security.currentPassword} onChange={e => setSecurity(p => ({ ...p, currentPassword: e.target.value }))} className={styles.premiumInput} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>New Password</label>
                                <input type="password" placeholder="••••••••" value={security.newPassword} onChange={e => setSecurity(p => ({ ...p, newPassword: e.target.value }))} className={styles.premiumInput} />
                            </div>
                        </div>
                        <div className={styles.cardFooter}>
                            <button className={styles.secondaryBtn} onClick={() => setMessage({ text: 'Password update feature coming soon.', type: 'info' })}>
                                Update Securely
                            </button>
                        </div>
                    </div>
                </AnimateOnScroll>

                {/* Danger Zone Section */}
                <AnimateOnScroll animation="fadeUp" delay={600}>
                    <div className={styles.settingsCard} style={{ border: '1px solid #fee2e2', background: '#fffafb' }}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIconBox} style={{ background: '#fef2f2', color: '#ef4444' }}>{IC.trash}</div>
                            <h2 className={styles.cardTitle} style={{ color: '#ef4444' }}>Danger Zone</h2>
                        </div>
                        <p className={styles.toggleDesc} style={{ marginBottom: '1rem' }}>Permanently remove your account and all associated data from TalentMesh. This action cannot be undone.</p>
                        <button className={styles.dangerBtn}>
                            {IC.trash} Delete My Account
                        </button>
                    </div>
                </AnimateOnScroll>
            </div>
        </div>
    );
}
