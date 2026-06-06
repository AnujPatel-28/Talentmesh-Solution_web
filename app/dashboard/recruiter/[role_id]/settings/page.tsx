"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge, invokeFunction } from '@/lib/insforge';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';
import { FormSkeleton } from '@/components/ui/DashboardSkeleton';
import Toast from '@/components/ui/Toast';
import styles from '../../../shared-dashboard.module.css';
import { CustomSelect } from '@/components/ui/CustomSelect';

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
    const [provider, setProvider] = useState<string>('email');

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = window.sessionStorage.getItem('tm_token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                    const prov = payload.app_metadata?.provider || payload.app_metadata?.providers?.[0] || 'email';
                    setProvider(prov);
                } catch (err) {
                    console.warn('Failed to parse OAuth provider from JWT:', err);
                }
            }
        }
    }, []);

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
            const bucketName = type === 'avatar' ? 'avatars' : 'company-logos';
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uuid = typeof window !== 'undefined' && window.crypto?.randomUUID 
                ? window.crypto.randomUUID() 
                : Math.random().toString(36).substring(2, 15);
            
            const path = type === 'avatar' 
                ? `${user.id}/${uuid}_${safeName}`
                : `${uuid}_${safeName}`;

            // Clean up old file from storage if it exists to keep storage secure
            const oldUrl = type === 'avatar' ? profile.avatar_url : profile.logo_url;
            if (oldUrl) {
                try {
                    const marker = '/objects/';
                    const markerIndex = oldUrl.indexOf(marker);
                    if (markerIndex !== -1) {
                        let oldPath = oldUrl.substring(markerIndex + marker.length);
                        const qIndex = oldPath.indexOf('?');
                        if (qIndex !== -1) {
                            oldPath = oldPath.substring(0, qIndex);
                        }
                        const decodedPath = decodeURIComponent(oldPath);
                        await insforge.storage.from(bucketName).remove(decodedPath);
                    } else {
                        // It's already a relative path/key
                        await insforge.storage.from(bucketName).remove(oldUrl);
                    }
                } catch (delErr) {
                    console.warn(`Failed to delete old ${type} file from storage:`, delErr);
                }
            }

            const { data: uploadData, error: uploadError } = await insforge.storage
                .from(bucketName)
                .upload(path, file);

            if (uploadError) throw new Error(uploadError.message);
            
            // Log for runtime verification (Release 2)
            console.log(`[Upload] type=${type} bucket=${bucketName}`, uploadData);
            
            const url = uploadData?.key || '';

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
                                <img src={getPublicStorageUrl('avatars', profile.avatar_url)} alt={profile.name} />
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
                        <div className={styles.field}>
                            <label>Registration Platform</label>
                            <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center' }}>
                                {provider === 'google' && (
                                    <span style={{
                                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                        color: '#1e40af',
                                        border: '1px solid #bfdbfe',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                                        Google Identity
                                    </span>
                                )}
                                {provider === 'linkedin' && (
                                    <span style={{
                                        background: 'linear-gradient(135deg, #f0f7ff, #e0f2fe)',
                                        color: '#0369a1',
                                        border: '1px solid #bae6fd',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                        LinkedIn OAuth
                                    </span>
                                )}
                                {provider !== 'google' && provider !== 'linkedin' && (
                                    <span style={{
                                        background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
                                        color: '#6b21a8',
                                        border: '1px solid #e9d5ff',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                        Manual Email Login
                                    </span>
                                )}
                            </div>
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
                                <img src={getPublicStorageUrl('company-logos', profile.logo_url)} alt={profile.company_name} />
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
                            <CustomSelect 
                                value={profile.industry} 
                                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                                className={styles.select}
                                options={['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail']}
                            />
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
