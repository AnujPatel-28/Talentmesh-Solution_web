"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { invokeFunction } from '@/lib/insforge';
import { uploadAvatar } from '@/lib/api/storage';
import { FormSkeleton } from '@/components/ui/DashboardSkeleton';
import Toast from '@/components/ui/Toast';
import styles from '../../../shared-dashboard.module.css';

/* ─── Icons ─── */
const IC = {
    camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
    building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="10" width="20" height="11" rx="2" /><path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>,
    user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
};

export default function RecruiterSettingsPage() {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        job_title: '',
        phone: '',
        avatar_url: '',
        company_id: '',
        company_name: '',
        industry: 'Technology',
        website: '',
        logo_url: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchSettings() {
            if (!user) return;
            try {
                const [profRes, compRes] = await Promise.all([
                    invokeFunction('recruiter-profile', { method: 'GET' }),
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
                        phone: p?.phone || '',
                        avatar_url: p?.avatar_url || ''
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadProgress(prev => ({ ...prev, [type]: 10 }));
        try {
            const url = await uploadAvatar(file, user.id); // Reusing uploadAvatar for logo too for simplicity
            setProfile(prev => ({ ...prev, [type === 'avatar' ? 'avatar_url' : 'logo_url']: url }));
            setUploadProgress(prev => ({ ...prev, [type]: 100 }));
            setTimeout(() => setUploadProgress(prev => ({ ...prev, [type]: 0 })), 2000);
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
            setUploadProgress(prev => ({ ...prev, [type]: 0 }));
        }
    };

    const handleSaveAll = async () => {
        if (!user) return;
        setIsSaving(true);
        setToast(null);

        try {
            // 1. Update Recruiter Profile
            const profPromise = invokeFunction('recruiter-profile', {
                method: 'PUT',
                body: {
                    profile: { 
                        name: profile.name, 
                        phone: profile.phone,
                        avatar_url: profile.avatar_url 
                    },
                    recruiterProfile: { 
                        job_title: profile.job_title 
                    }
                }
            });

            // 2. Update Company Profile
            const compPromise = invokeFunction('company-profile', {
                method: 'POST',
                body: {
                    name: profile.company_name,
                    industry: profile.industry,
                    website: profile.website,
                    logo_url: profile.logo_url
                }
            });

            const [pRes, cRes] = await Promise.all([profPromise, compPromise]);

            if (pRes.error) throw pRes.error;
            if (cRes.error) throw cRes.error;

            await refreshUser();
            setToast({ message: 'All settings updated successfully!', type: 'success' });
        } catch (err: any) {
            setToast({ message: err.message || 'Update failed.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <FormSkeleton />;

    return (
        <div className={styles.settingsWrapper}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Settings</h1>
                    <p className={styles.pageSubtitle}>Manage your professional identity and company profile</p>
                </div>
                <button 
                    onClick={handleSaveAll} 
                    disabled={isSaving}
                    className={styles.primaryBtn}
                >
                    {isSaving ? 'Saving Changes...' : 'Save All Settings'}
                </button>
            </div>

            <div className={styles.settingsGrid}>
                {/* Personal Profile Section */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>{IC.user}</div>
                        <h3 className={styles.cardTitle}>Recruiter Profile</h3>
                    </div>

                    <div className={styles.avatarSection}>
                        <div 
                            className={styles.avatarLarge}
                            onClick={() => avatarInputRef.current?.click()}
                        >
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} />
                            ) : (
                                profile.name?.charAt(0) || 'R'
                            )}
                            <div className={styles.avatarOverlay}>{IC.camera}</div>
                            <input 
                                type="file" 
                                ref={avatarInputRef} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'avatar')}
                            />
                        </div>
                        <div className={styles.avatarMeta}>
                            <span className={styles.avatarLabel}>Profile Photo</span>
                            <span className={styles.avatarHint}>Click to update. PNG or JPG, max 2MB.</span>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <div className={styles.field}>
                            <label>Full Name</label>
                            <input 
                                value={profile.name} 
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Job Title</label>
                            <div className={styles.inputWithIcon}>
                                <span className={styles.inputIcon}>{IC.briefcase}</span>
                                <input 
                                    value={profile.job_title} 
                                    onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                                    placeholder="e.g. Senior Technical Recruiter"
                                />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label>Contact Phone</label>
                            <input 
                                value={profile.phone} 
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Email Address</label>
                            <input value={profile.email} disabled className={styles.inputDisabled} />
                            <span className={styles.fieldHint}>Email cannot be changed here.</span>
                        </div>
                    </div>
                </div>

                {/* Company Information Section */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>{IC.building}</div>
                        <h3 className={styles.cardTitle}>Company Information</h3>
                    </div>

                    <div className={styles.logoSection}>
                        <div 
                            className={styles.logoBox}
                            onClick={() => logoInputRef.current?.click()}
                        >
                            {profile.logo_url ? (
                                <img src={profile.logo_url} alt={profile.company_name} />
                            ) : (
                                IC.building
                            )}
                            <div className={styles.logoOverlay}>{IC.camera}</div>
                            <input 
                                type="file" 
                                ref={logoInputRef} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'logo')}
                            />
                        </div>
                        <div className={styles.logoMeta}>
                            <span className={styles.avatarLabel}>Company Logo</span>
                            <span className={styles.avatarHint}>Visible on your job postings.</span>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <div className={styles.field}>
                            <label>Company Name</label>
                            <input 
                                value={profile.company_name} 
                                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Industry</label>
                            <select 
                                value={profile.industry} 
                                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                                className={styles.select}
                            >
                                <option>Technology</option>
                                <option>Finance</option>
                                <option>Healthcare</option>
                                <option>Education</option>
                                <option>Manufacturing</option>
                                <option>Retail</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Company Website</label>
                            <div className={styles.inputWithIcon}>
                                <span className={styles.inputIcon}>{IC.globe}</span>
                                <input 
                                    value={profile.website} 
                                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
