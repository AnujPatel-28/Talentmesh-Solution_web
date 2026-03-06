"use client";
import React from 'react';
import styles from '../candidate.module.css';

export default function CandidateSettingsPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Settings</h1>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Manage your account, preferences, and privacy</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                {/* Profile */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Profile Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                            <input defaultValue="Sarah Jenkins" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Email</label>
                            <input defaultValue="sarah.j@email.com" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Phone</label>
                            <input defaultValue="+1 (555) 123-4567" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Location</label>
                            <input defaultValue="San Francisco, CA" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                    </div>
                    <button style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, var(--primary-blue), #2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.25)' }}>Save Changes</button>
                </div>

                {/* Job Preferences */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Job Preferences</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Desired Role</label>
                            <input defaultValue="Senior Frontend Engineer" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Expected Salary</label>
                            <input defaultValue="$150k - $200k" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Work Type</label>
                            <select defaultValue="Remote" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}>
                                <option>Remote</option><option>On-site</option><option>Hybrid</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Open to Relocate</label>
                            <select defaultValue="Yes" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}>
                                <option>Yes</option><option>No</option><option>Maybe</option>
                            </select>
                        </div>
                    </div>
                    <button style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, var(--primary-blue), #2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.25)' }}>Update Preferences</button>
                </div>

                {/* Notifications */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {[
                            { label: 'Job Recommendations', desc: 'Get notified about jobs matching your profile', on: true },
                            { label: 'Application Updates', desc: 'Status changes on your applications', on: true },
                            { label: 'Messages', desc: 'New messages from recruiters', on: true },
                            { label: 'Weekly Digest', desc: 'Summary of new opportunities every week', on: false },
                            { label: 'Marketing Emails', desc: 'Product updates and tips', on: false },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{s.label}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.desc}</div>
                                </div>
                                <div style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: s.on ? 'var(--primary-blue)' : '#e2e8f0', position: 'relative', transition: 'all 0.2s' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: s.on ? 23 : 3, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Security</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Current Password</label>
                            <input type="password" placeholder="••••••••" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>New Password</label>
                            <input type="password" placeholder="••••••••" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Confirm Password</label>
                            <input type="password" placeholder="••••••••" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                    </div>
                    <button style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, var(--primary-blue), #2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.25)' }}>Update Password</button>
                </div>

                {/* Privacy */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Privacy</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {[
                            { label: 'Profile Visibility', desc: 'Make your profile visible to recruiters', on: true },
                            { label: 'Show Match Score', desc: 'Allow companies to see your AI match score', on: true },
                            { label: 'Resume Download', desc: 'Let recruiters download your resume', on: false },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{s.label}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.desc}</div>
                                </div>
                                <div style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: s.on ? 'var(--primary-blue)' : '#e2e8f0', position: 'relative', transition: 'all 0.2s' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: s.on ? 23 : 3, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
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
