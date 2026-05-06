"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { invokeFunction } from '@/lib/insforge';
import { FormSkeleton } from '@/components/ui/DashboardSkeleton';
import styles from '../../../shared-dashboard.module.css';

export default function RecruiterSettingsPage() {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        job_title: '',
        phone: '',
        company_name: '',
        industry: 'Technology',
        company_size: '201-500',
        website: '',
        logo_url: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'success' });

    useEffect(() => {
        async function fetchSettings() {
            if (!user) return;
            try {
                const [profRes, compRes] = await Promise.all([
                    invokeFunction('recruiter-dashboard'), // Reusing to get profile
                    invokeFunction('company-profile', { method: 'GET' })
                ]);

                if (profRes.data) {
                    const p = profRes.data.profile;
                    const rp = profRes.data.recruiterProfile;
                    setProfile(prev => ({
                        ...prev,
                        name: p?.name || '',
                        email: p?.email || '',
                        job_title: rp?.job_title || '',
                        phone: p?.phone || ''
                    }));
                }

                if (compRes.data?.company) {
                    const c = compRes.data.company;
                    setProfile(prev => ({
                        ...prev,
                        company_name: c.name || '',
                        industry: c.industry || 'Technology',
                        website: c.website || '',
                        logo_url: c.logo_url || ''
                    }));
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        setMessage({ text: '', type: 'success' });
        try {
            // We need a generic update-profile function or use existing ones
            // For now, let's assume update-application or similar pattern
            const { error } = await invokeFunction('candidate-profile', { // This function also updates profiles table
                method: 'PUT',
                body: {
                    profile: { name: profile.name, phone: profile.phone }
                }
            });

            if (error) throw error;
            await refreshUser();
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateCompany = async () => {
        setIsSaving(true);
        setMessage({ text: '', type: 'success' });
        try {
            const { error } = await invokeFunction('company-profile', {
                method: 'POST',
                body: {
                    name: profile.company_name,
                    industry: profile.industry,
                    website: profile.website,
                    logo_url: profile.logo_url
                }
            });
            if (error) throw error;
            setMessage({ text: 'Company info updated!', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.message || 'Update failed.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <FormSkeleton />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Settings</h1>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Manage your recruiter profile and company info</p>
            </div>

            {message.text && (
                <div style={{ 
                    padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 500,
                    backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: message.type === 'success' ? '#16a34a' : '#dc2626',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recruiter Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Job Title</label>
                            <input value={profile.job_title} onChange={(e) => setProfile({ ...profile, job_title: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                        </div>
                    </div>
                    <button onClick={handleSaveProfile} disabled={isSaving} style={{ padding: '0.5rem 1rem', background: 'var(--primary-blue)', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>

                <div style={{ background: '#fff', border: '1px solid #eef0f2', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Company Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Company Name</label>
                            <input value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Industry</label>
                            <input value={profile.industry} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Website</label>
                            <input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                        </div>
                    </div>
                    <button onClick={handleUpdateCompany} disabled={isSaving} style={{ padding: '0.5rem 1rem', background: 'var(--primary-blue)', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                        Update Company
                    </button>
                </div>
            </div>
        </div>
    );
}
