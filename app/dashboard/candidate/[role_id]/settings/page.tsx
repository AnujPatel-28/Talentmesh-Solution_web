"use client";

import React, { useEffect, useMemo, useState } from 'react';

import type { CandidateSettingsBundle } from '@/lib/candidate-profile';

import styles from '../candidate.module.css';

type ToggleItem = {
    label: string;
    desc: string;
    on: boolean;
};

const EMPTY_STATE: CandidateSettingsBundle = {
    profile: {
        id: '',
        email: '',
        name: '',
        phone: '',
        location: '',
        role_id: null,
    },
    candidateProfile: {
        headline: '',
        skills: [],
        experience_years: null,
        education: '',
        resume_url: '',
        salary_min: null,
        salary_max: null,
        preferred_locations: [],
        job_type: '',
        profile_strength: 0,
    },
};

const INITIAL_NOTIFICATIONS: ToggleItem[] = [
    { label: 'Job Recommendations', desc: 'Get notified about jobs matching your profile', on: true },
    { label: 'Application Updates', desc: 'Status changes on your applications', on: true },
    { label: 'Messages', desc: 'New messages from recruiters', on: true },
    { label: 'Weekly Digest', desc: 'Summary of new opportunities every week', on: false },
    { label: 'Marketing Emails', desc: 'Product updates and tips', on: false },
];

const INITIAL_PRIVACY: ToggleItem[] = [
    { label: 'Profile Visibility', desc: 'Make your profile visible to recruiters', on: true },
    { label: 'Show Match Score', desc: 'Allow companies to see your AI match score', on: true },
    { label: 'Resume Download', desc: 'Let recruiters download your resume', on: false },
];

function formatSalaryRange(min: number | null, max: number | null): string {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });

    if (min && max) {
        return `${formatter.format(min)} - ${formatter.format(max)}`;
    }

    if (min) {
        return formatter.format(min);
    }

    if (max) {
        return formatter.format(max);
    }

    return '';
}

function parseSalaryRange(value: string): { salary_min: number | null; salary_max: number | null } {
    const matches = value.match(/\d[\d,]*/g) ?? [];
    const numbers = matches.map((item) => Number(item.replace(/,/g, ''))).filter((item) => Number.isFinite(item));

    return {
        salary_min: numbers[0] ?? null,
        salary_max: numbers[1] ?? null,
    };
}

function splitCommaList(value: string): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export default function CandidateSettingsPage() {
    const [form, setForm] = useState<CandidateSettingsBundle>(EMPTY_STATE);
    const [expectedSalary, setExpectedSalary] = useState('');
    const [preferredLocationsInput, setPreferredLocationsInput] = useState('');
    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
    const [privacy, setPrivacy] = useState(INITIAL_PRIVACY);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/candidate-profile', { cache: 'no-store' });
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || 'Failed to load settings');
                }

                setForm(payload);
                setExpectedSalary(formatSalaryRange(payload.candidateProfile.salary_min, payload.candidateProfile.salary_max));
                setPreferredLocationsInput(payload.candidateProfile.preferred_locations.join(', '));
            } catch (err) {
                const messageText = err instanceof Error ? err.message : 'Failed to load settings';
                setError(messageText);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const save = async (nextForm: CandidateSettingsBundle, mode: 'profile' | 'preferences') => {
        setError('');
        setMessage('');

        if (mode === 'profile') {
            setIsSavingProfile(true);
        } else {
            setIsSavingPreferences(true);
        }

        try {
            const response = await fetch('/api/candidate-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nextForm),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Failed to save settings');
            }

            setForm(payload);
            setExpectedSalary(formatSalaryRange(payload.candidateProfile.salary_min, payload.candidateProfile.salary_max));
            setPreferredLocationsInput(payload.candidateProfile.preferred_locations.join(', '));
            setMessage(mode === 'profile' ? 'Profile information updated.' : 'Job preferences updated.');
        } catch (err) {
            const messageText = err instanceof Error ? err.message : 'Failed to save settings';
            setError(messageText);
        } finally {
            if (mode === 'profile') {
                setIsSavingProfile(false);
            } else {
                setIsSavingPreferences(false);
            }
        }
    };

    const profileCompletion = useMemo(() => `${form.candidateProfile.profile_strength}% complete`, [form.candidateProfile.profile_strength]);

    if (isLoading) {
        return <div className={styles.loading}>Loading settings...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Settings</h1>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                    Manage your account, preferences, and privacy. Profile strength: {profileCompletion}
                </p>
            </div>

            {(message || error) && (
                <div
                    style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: 12,
                        border: `1px solid ${error ? '#fecaca' : '#bfdbfe'}`,
                        background: error ? '#fef2f2' : '#eff6ff',
                        color: error ? '#b91c1c' : '#1d4ed8',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                    }}
                >
                    {error || message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Profile Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                            <input value={form.profile.name} onChange={(event) => setForm((prev) => ({ ...prev, profile: { ...prev.profile, name: event.target.value } }))} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Email</label>
                            <input value={form.profile.email} readOnly style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', background: '#f8fafc', color: '#64748b' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Phone</label>
                            <input value={form.profile.phone} onChange={(event) => setForm((prev) => ({ ...prev, profile: { ...prev.profile, phone: event.target.value } }))} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Location</label>
                            <input value={form.profile.location} onChange={(event) => setForm((prev) => ({ ...prev, profile: { ...prev.profile, location: event.target.value } }))} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                    </div>
                    <button onClick={() => save(form, 'profile')} disabled={isSavingProfile} style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, var(--primary-blue), #2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.25)', opacity: isSavingProfile ? 0.7 : 1 }}>
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Job Preferences</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Desired Role</label>
                            <input value={form.candidateProfile.headline} onChange={(event) => setForm((prev) => ({ ...prev, candidateProfile: { ...prev.candidateProfile, headline: event.target.value } }))} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Expected Salary</label>
                            <input
                                value={expectedSalary}
                                onChange={(event) => {
                                    setExpectedSalary(event.target.value);
                                    const parsed = parseSalaryRange(event.target.value);
                                    setForm((prev) => ({
                                        ...prev,
                                        candidateProfile: {
                                            ...prev.candidateProfile,
                                            salary_min: parsed.salary_min,
                                            salary_max: parsed.salary_max,
                                        },
                                    }));
                                }}
                                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Work Type</label>
                            <select value={form.candidateProfile.job_type} onChange={(event) => setForm((prev) => ({ ...prev, candidateProfile: { ...prev.candidateProfile, job_type: event.target.value } }))} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}>
                                <option value="">Select</option>
                                <option value="Remote">Remote</option>
                                <option value="Onsite">Onsite</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Preferred Locations</label>
                            <input
                                value={preferredLocationsInput}
                                onChange={(event) => {
                                    setPreferredLocationsInput(event.target.value);
                                    setForm((prev) => ({
                                        ...prev,
                                        candidateProfile: {
                                            ...prev.candidateProfile,
                                            preferred_locations: splitCommaList(event.target.value),
                                        },
                                    }));
                                }}
                                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}
                            />
                        </div>
                    </div>
                    <button onClick={() => save(form, 'preferences')} disabled={isSavingPreferences} style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, var(--primary-blue), #2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.25)', opacity: isSavingPreferences ? 0.7 : 1 }}>
                        {isSavingPreferences ? 'Saving...' : 'Update Preferences'}
                    </button>
                </div>

                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {notifications.map((item, index) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: index < notifications.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.desc}</div>
                                </div>
                                <button type="button" onClick={() => setNotifications((prev) => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, on: !entry.on } : entry))} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: item.on ? 'var(--primary-blue)' : '#e2e8f0', position: 'relative', transition: 'all 0.2s', border: 'none' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: item.on ? 23 : 3, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Security</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Current Password</label>
                            <input type="password" value={security.currentPassword} onChange={(event) => setSecurity((prev) => ({ ...prev, currentPassword: event.target.value }))} placeholder="••••••••" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>New Password</label>
                            <input type="password" value={security.newPassword} onChange={(event) => setSecurity((prev) => ({ ...prev, newPassword: event.target.value }))} placeholder="••••••••" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Confirm Password</label>
                            <input type="password" value={security.confirmPassword} onChange={(event) => setSecurity((prev) => ({ ...prev, confirmPassword: event.target.value }))} placeholder="••••••••" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                    </div>
                    <button type="button" onClick={() => setMessage('Password update UI is ready, but auth password syncing is not wired in this change set.')} style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, var(--primary-blue), #2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.25)' }}>
                        Update Password
                    </button>
                </div>

                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Privacy</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {privacy.map((item, index) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: index < privacy.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.desc}</div>
                                </div>
                                <button type="button" onClick={() => setPrivacy((prev) => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, on: !entry.on } : entry))} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: item.on ? 'var(--primary-blue)' : '#e2e8f0', position: 'relative', transition: 'all 0.2s', border: 'none' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: item.on ? 23 : 3, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626', margin: 0 }}>Danger Zone</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Deactivate Account</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Temporarily hide your profile from recruiters</div>
                            </div>
                            <button style={{ padding: '0.4rem 0.8rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>Deactivate</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Delete Account</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Permanently delete your account and all data</div>
                            </div>
                            <button style={{ padding: '0.4rem 0.8rem', background: '#dc2626', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
