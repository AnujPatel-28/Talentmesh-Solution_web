"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import { FormSkeleton } from '@/components/ui/DashboardSkeleton';
import styles from '../../../shared-dashboard.module.css';

export default function RecruiterSettingsPage() {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        job_title: '',
        phone: '',
        company_name: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'success' });

    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;
            try {
                const { data: prof, error: profErr } = await insforge.database
                    .from('profiles')
                    .select('*, recruiter_profiles(*, companies(name))')
                    .eq('id', user.id)
                    .single();

                if (profErr) throw profErr;

                setProfile({
                    name: prof.name || '',
                    email: prof.email || '',
                    job_title: prof.recruiter_profiles?.[0]?.job_title || '',
                    phone: prof.phone || '',
                    company_name: prof.recruiter_profiles?.[0]?.companies?.name || ''
                });
            } catch (err) {
                console.error('Error fetching recruiter profile:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        setMessage({ text: '', type: 'success' });
        try {
            // Update base profile (name, phone)
            const { error: profErr } = await insforge.database
                .from('profiles')
                .update({ name: profile.name, phone: profile.phone })
                .eq('id', user.id);

            if (profErr) throw profErr;

            // Update recruiter profile (job_title)
            const { error: recErr } = await insforge.database
                .from('recruiter_profiles')
                .update({ job_title: profile.job_title })
                .eq('id', user.id);

            if (recErr) throw recErr;

            // 🔥 Refresh global state to sync Navbar/Sidebar name
            await refreshUser();

            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (err) {
            console.error('Error saving profile:', err);
            setMessage({ text: 'Failed to update profile.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <FormSkeleton />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Settings</h1>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Manage your recruiter profile, company info, and preferences</p>
            </div>

            {message.text && (
                <div style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: 10, 
                    fontSize: '0.85rem', 
                    fontWeight: 500,
                    backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: message.type === 'success' ? '#16a34a' : '#dc2626',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>

                {/* Profile */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recruiter Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                            <input 
                                value={profile.name} 
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Email</label>
                            <input value={profile.email} disabled style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', background: '#f8fafc', color: '#94a3b8' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Job Title</label>
                            <input 
                                value={profile.job_title}
                                onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Phone</label>
                            <input 
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} 
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        style={{ 
                            alignSelf: 'flex-start', 
                            padding: '0.5rem 1.2rem', 
                            background: isSaving ? '#94a3b8' : 'linear-gradient(135deg, var(--primary-blue), #2563eb)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 10, 
                            fontSize: '0.82rem', 
                            fontWeight: 700, 
                            cursor: isSaving ? 'not-allowed' : 'pointer', 
                            fontFamily: 'inherit', 
                            boxShadow: '0 3px 10px rgba(37,99,235,0.25)' 
                        }}
                    >
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>

                {/* Company Info */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Company Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Company Name</label>
                            <input value={profile.company_name} disabled style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', background: '#f8fafc', color: '#94a3b8' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Industry</label>
                            <select defaultValue="Technology" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}>
                                <option>Technology</option><option>Finance</option><option>Healthcare</option><option>Education</option><option>E-commerce</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Company Size</label>
                            <select defaultValue="201-500" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}>
                                <option>1-50</option><option>51-200</option><option>201-500</option><option>501-1000</option><option>1000+</option>
                            </select>
                        </div>
                    </div>
                    <button style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, var(--primary-blue), #2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.25)' }}>Update Company</button>
                </div>

                {/* Hiring Preferences */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Hiring Preferences</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {[
                            { label: 'AI Candidate Matching', desc: 'Use AI to rank candidates by match score', on: true },
                            { label: 'Auto-Screen Resumes', desc: 'Automatically filter unqualified applicants', on: true },
                            { label: 'Interview Scheduling', desc: 'Let candidates self-schedule interviews', on: false },
                            { label: 'Application Deadline Alerts', desc: 'Get notified before job posting deadlines', on: true },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
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

                {/* Notifications */}
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {[
                            { label: 'New Applications', desc: 'When candidates apply to your jobs', on: true },
                            { label: 'Candidate Messages', desc: 'New messages from candidates', on: true },
                            { label: 'Interview Reminders', desc: 'Upcoming interview notifications', on: true },
                            { label: 'Weekly Hiring Report', desc: 'Summary of hiring activity each week', on: false },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
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
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Confirm New Password</label>
                            <input type="password" placeholder="••••••••" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                    </div>
                    <button style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, var(--primary-blue), #2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.25)' }}>Update Password</button>
                </div>

                {/* Danger Zone */}
                <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626', margin: 0 }}>Danger Zone</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Pause All Job Postings</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Temporarily hide all your active job listings</div>
                            </div>
                            <button style={{ padding: '0.4rem 0.8rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>Pause All</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Delete Recruiter Account</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Permanently remove your account and all data</div>
                            </div>
                            <button style={{ padding: '0.4rem 0.8rem', background: '#dc2626', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
