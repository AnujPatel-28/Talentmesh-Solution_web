"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../shared-dashboard.module.css';
import { useAuth } from '@/lib/auth/AuthContext';
import ProfileStrengthWidget from '@/components/candidate/ProfileStrengthWidget';
// ResumeManager separated to its own page
import { insforge, invokeFunction } from '@/lib/insforge';
import type { UserProfile, CandidateProfile } from '@/types/user';
import { validateCandidateProfile } from '@/lib/validation/candidate';
import Toast from '@/components/ui/Toast';

/* ─── Icons ─── */
const IC = {
    mapPin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    graduationCap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    extLink: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
    file: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    monitor: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
    link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
    trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
};

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const updateCandidateProfile = async (updates: Partial<CandidateProfile>) => {
        try {
            const { error } = await invokeFunction('candidate-profile', {
                method: 'PUT',
                body: { candidateProfile: updates }
            });
            if (error) throw new Error(error.message);
            return { success: true };
        } catch (error: any) {
            setToast({ message: 'Failed to update profile: ' + error.message, type: 'error' });
            return { success: false, error };
        }
    };

    const fetchProfile = async () => {
        try {
            const { data, error } = await invokeFunction('candidate-profile', { method: 'GET' });
            if (error) throw new Error(error.message);
            
            const mappedProfile: UserProfile = {
                ...data.profile,
                candidate_profiles: data.candidateProfile
            };
            
            setProfile(prev => {
                if (!prev || !isEditing) return mappedProfile;
                return {
                    ...mappedProfile,
                    name: prev.name,
                    phone: prev.phone,
                    location: prev.location,
                    about: prev.about,
                    candidate_profiles: mappedProfile.candidate_profiles ? {
                        ...mappedProfile.candidate_profiles,
                        headline: prev.candidate_profiles?.headline || mappedProfile.candidate_profiles.headline,
                        skills: prev.candidate_profiles?.skills || mappedProfile.candidate_profiles.skills,
                        experience_years: prev.candidate_profiles?.experience_years ?? mappedProfile.candidate_profiles.experience_years,
                    } : undefined
                };
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        setErrors({});

        const validationData = {
            name: profile.name,
            phone: profile.phone,
            location: profile.location,
            about: profile.about,
            ...profile.candidate_profiles
        };

        const result = validateCandidateProfile(validationData);
        if (!result.success) {
            setErrors(result.errors || {});
            setIsSaving(false);
            return;
        }

        try {
            const { error: saveError } = await invokeFunction('candidate-profile', {
                method: 'PUT',
                body: {
                    profile: {
                        name: profile.name,
                        phone: profile.phone,
                        location: profile.location,
                    },
                    candidateProfile: profile.candidate_profiles
                }
            });

            if (saveError) throw new Error(saveError.message);

            await fetchProfile();
            setIsEditing(false);
            setToast({ message: 'Profile updated successfully!', type: 'success' });
        } catch (error: any) {
            setToast({ message: 'Failed to save profile: ' + error.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'resume') => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadProgress(prev => ({ ...prev, [type]: 10 }));

        try {
            let url = '';
            const bucketName = type === 'avatar' ? 'avatars' : 'resumes';
            
            const { data: uploadData, error: uploadError } = await insforge.storage
                .from(bucketName)
                .uploadAuto(file);
                
            if (uploadError) throw new Error(uploadError.message);
            url = uploadData?.url || '';

            if (type === 'avatar') {
                setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                // Profile update via edge function
                await invokeFunction('candidate-profile', {
                    method: 'PUT',
                    body: { profile: { avatar_url: url } }
                });
            }
            setUploadProgress(prev => ({ ...prev, [type]: 100 }));
            await fetchProfile();
            setTimeout(() => setUploadProgress(prev => ({ ...prev, [type]: 0 })), 2000);
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
            setUploadProgress(prev => ({ ...prev, [type]: 0 }));
        }
    };

    if (isLoading) return <div className={styles.loading}>Loading profile...</div>;
    if (!profile) return <div className={styles.error}>Profile not found.</div>;

    const cp = profile.candidate_profiles;
    const strength = cp?.profile_strength || 0;

    return (
        <div className={styles.profilePage}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className={styles.profileSidebar}>
                <div className={styles.profileCard}>
                    <div
                        className={styles.profileAvatar}
                        style={{ cursor: 'pointer' }}
                        onClick={() => avatarInputRef.current?.click()}
                    >
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.name} className={styles.avatarImg} />
                        ) : (
                            (profile.name || 'User').split(' ').filter(Boolean).map(n => n[0]).join('')
                        )}
                        <div className={styles.avatarOverlay}>{IC.camera}</div>
                        <span className={styles.onlineDot} />
                        <input
                            type="file"
                            ref={avatarInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'avatar')}
                        />
                    </div>
                    {uploadProgress.avatar > 0 && uploadProgress.avatar < 100 && (
                        <div className={styles.uploadProgressSmall}>
                            <div className={styles.progressFill} style={{ width: `${uploadProgress.avatar}%` }} />
                        </div>
                    )}
                    <span className={styles.profileName}>{profile.name}</span>
                    <span className={styles.profileRole}>{cp?.headline || 'Add a headline'}</span>
                    <span className={styles.profileLoc}>{IC.mapPin} {profile.location || 'Location not set'}</span>

                    <div className={styles.profileTags}>
                        {cp?.skills?.slice(0, 5).map(skill => (
                            <span key={skill} className={styles.tag}>{skill}</span>
                        ))}
                    </div>

                    <button
                        className={styles.editProfileBtn}
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? 'Cancel Edit' : <>{IC.edit} Edit Profile</>}
                    </button>
                    {isEditing && (
                        <button
                            className={styles.saveBtnFull}
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <ProfileStrengthWidget 
                        variant="full"
                        candidate={{
                            avatar_url: profile.avatar_url,
                            resume_url: cp?.resume_url,
                            bio: profile.about,
                            skills: cp?.skills,
                            experience: cp?.work_history,
                            education: cp?.education,
                            location: profile.location
                        }}
                    />
                </div>

                <div className={styles.openToggleCard}>
                    <div className={styles.openToggle}>
                        <div>
                            <span className={styles.openLabel}>Open to Work</span>
                            <span className={styles.openHint}>Visible to recruiters</span>
                        </div>
                        <button
                            className={`${styles.toggleSwitch} ${cp?.is_visible ? styles.toggleOn : ''}`}
                            onClick={async () => {
                                const newVal = !cp?.is_visible;
                                await updateCandidateProfile({ is_visible: newVal });
                                fetchProfile();
                            }}
                        >
                            <span className={styles.toggleDot} />
                        </button>
                    </div>
                </div>

                <div className={styles.contactCard}>
                    <span className={styles.contactTitle}>Contact Information</span>
                    <div className={styles.contactItem}>
                        <span className={styles.contactIcon}>{IC.mail}</span>
                        <div className={styles.contactMeta}>
                            <span className={styles.contactLabel}>Email</span>
                            <span className={styles.contactValue}>{profile.email}</span>
                        </div>
                    </div>
                    <div className={styles.contactItem}>
                        <span className={styles.contactIcon}>{IC.phone}</span>
                        <div className={styles.contactMeta}>
                            <span className={styles.contactLabel}>Phone</span>
                            {isEditing ? (
                                <input
                                    className={styles.in}
                                    value={profile.phone || ''}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                />
                            ) : (
                                <span className={styles.contactValue}>{profile.phone || 'Not set'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.profileMain}>

                {isEditing && (
                    <div className={styles.profileSection}>
                        <h2 className={styles.sectionTitle}>Personal Details</h2>
                        <div className={styles.editGrid}>
                            <div className={styles.field}>
                                <label>Display Name</label>
                                <input
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className={errors.name ? styles.inputError : ''}
                                />
                                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                            </div>
                            <div className={styles.field}>
                                <label>Headline</label>
                                <input
                                    value={cp?.headline || ''}
                                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp!, headline: e.target.value } })}
                                    placeholder="e.g. Senior Product Designer"
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Location</label>
                                <input
                                    value={profile.location || ''}
                                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                    placeholder="e.g. London, UK"
                                />
                            </div>
                             <div className={styles.fieldFull}>
                                <label>Bio</label>
                                <textarea
                                    value={profile.about || ''}
                                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                                    placeholder="Tell recruiters about yourself..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{IC.briefcase} Professional Info</h2>
                    </div>
                    {isEditing ? (
                        <div className={styles.editGrid}>
                            <div className={styles.field}>
                                <label>Years of Experience</label>
                                <input
                                    type="number"
                                    value={cp?.experience_years || 0}
                                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp!, experience_years: parseInt(e.target.value) } })}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.readRow}>
                            <div className={styles.readItem}>
                                <strong>{cp?.experience_years || 0}</strong>
                                <span>Years Experience</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{IC.target} Skills</h2>
                    </div>
                    <div className={styles.skillsTagEditor}>
                        {cp?.skills?.map(skill => (
                            <span key={skill} className={styles.skillChip}>
                                {skill}
                                {isEditing && (
                                    <button onClick={() => {
                                        const newSkills = cp.skills?.filter(s => s !== skill);
                                        setProfile({ ...profile, candidate_profiles: { ...cp, skills: newSkills } });
                                    }}>×</button>
                                )}
                            </span>
                        ))}
                        {isEditing && (
                            <input
                                placeholder="Add a skill + press Enter"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const input = e.target as HTMLInputElement;
                                        const val = input.value.trim();
                                        if (val && !cp?.skills?.includes(val)) {
                                            const newSkills = [...(cp?.skills || []), val];
                                            setProfile({ ...profile, candidate_profiles: { ...cp!, skills: newSkills } });
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className={styles.profileSection}>
                    <h2 className={styles.sectionTitle}>Job Preferences</h2>
                    <div className={styles.editGrid}>
                        <div className={styles.fieldFull}>
                            <label>Preferred Locations</label>
                            <div className={styles.tagInput}>
                                {cp?.preferred_locations?.map(loc => (
                                    <span key={loc} className={styles.skillChip}>
                                        {loc}
                                        {isEditing && <button onClick={() => {
                                            const newLocs = cp.preferred_locations?.filter(l => l !== loc);
                                            setProfile({ ...profile, candidate_profiles: { ...cp, preferred_locations: newLocs } });
                                        }}>×</button>}
                                    </span>
                                ))}
                                {isEditing && <input onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const i = e.target as HTMLInputElement;
                                        const v = i.value.trim();
                                        if (v) {
                                            const n = [...(cp?.preferred_locations || []), v];
                                            setProfile({ ...profile, candidate_profiles: { ...cp!, preferred_locations: n } });
                                            i.value = '';
                                        }
                                    }
                                }} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
