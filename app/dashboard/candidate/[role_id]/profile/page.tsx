"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../shared-dashboard.module.css';
import { useAuth } from '@/lib/auth/AuthContext';
import ProfileStrengthWidget from '@/components/candidate/ProfileStrengthWidget';
// ResumeManager separated to its own page
import { insforge, invokeFunction } from '@/lib/insforge';
import type { UserProfile, CandidateProfile, WorkExperience, EducationEntry } from '@/types/user';
import { validateCandidateProfile } from '@/lib/validation/candidate';
import { normalizeCandidateProfile } from '@/lib/candidate-profile';
import Toast from '@/components/ui/Toast';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';

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
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // Work experience form state
    const EMPTY_EXP: WorkExperience = { id: '', title: '', company: '', location: '', start_date: '', end_date: '', is_current: false, description: '' };
    const [showExpForm, setShowExpForm] = useState(false);
    const [editingExpId, setEditingExpId] = useState<string | null>(null);
    const [expForm, setExpForm] = useState<WorkExperience>(EMPTY_EXP);
    const [expFormErrors, setExpFormErrors] = useState<{ title?: string; company?: string }>({});

    // Education form state
    const EMPTY_EDU: EducationEntry = { id: '', institution: '', degree: '', field_of_study: '', start_year: undefined, end_year: undefined, is_current: false, grade: '', description: '' };
    const [showEduForm, setShowEduForm] = useState(false);
    const [editingEduId, setEditingEduId] = useState<string | null>(null);
    const [eduForm, setEduForm] = useState<EducationEntry>(EMPTY_EDU);
    const [eduFormErrors, setEduFormErrors] = useState<{ institution?: string; degree?: string }>({});

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

            // ── Diagnostic: log exactly what the edge function returns ──
            console.log('[profile] GET response avatar_url:', data?.profile?.avatar_url);
            console.log('[profile] GET resolved img URL:', getPublicStorageUrl('avatars', data?.profile?.avatar_url));
            
            const mappedProfile: UserProfile = {
                ...data.profile,
                about: data.profile?.bio,
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
                        headline: prev.candidate_profiles?.headline !== undefined ? prev.candidate_profiles.headline : mappedProfile.candidate_profiles.headline,
                        skills: prev.candidate_profiles?.skills !== undefined ? prev.candidate_profiles.skills : mappedProfile.candidate_profiles.skills,
                        experience_years: prev.candidate_profiles?.experience_years !== undefined ? prev.candidate_profiles.experience_years : mappedProfile.candidate_profiles.experience_years,
                        education: prev.candidate_profiles?.education !== undefined ? prev.candidate_profiles.education : mappedProfile.candidate_profiles.education,
                        linkedin_url: prev.candidate_profiles?.linkedin_url !== undefined ? prev.candidate_profiles.linkedin_url : mappedProfile.candidate_profiles.linkedin_url,
                        github_url: prev.candidate_profiles?.github_url !== undefined ? prev.candidate_profiles.github_url : mappedProfile.candidate_profiles.github_url,
                        portfolio_url: prev.candidate_profiles?.portfolio_url !== undefined ? prev.candidate_profiles.portfolio_url : mappedProfile.candidate_profiles.portfolio_url,
                        job_types: prev.candidate_profiles?.job_types !== undefined ? prev.candidate_profiles.job_types : mappedProfile.candidate_profiles.job_types,
                        salary_min: prev.candidate_profiles?.salary_min !== undefined ? prev.candidate_profiles.salary_min : mappedProfile.candidate_profiles.salary_min,
                        salary_max: prev.candidate_profiles?.salary_max !== undefined ? prev.candidate_profiles.salary_max : mappedProfile.candidate_profiles.salary_max,
                        currency: prev.candidate_profiles?.currency !== undefined ? prev.candidate_profiles.currency : mappedProfile.candidate_profiles.currency,
                        open_to_remote: prev.candidate_profiles?.open_to_remote !== undefined ? prev.candidate_profiles.open_to_remote : mappedProfile.candidate_profiles.open_to_remote,
                        preferred_locations: prev.candidate_profiles?.preferred_locations !== undefined ? prev.candidate_profiles.preferred_locations : mappedProfile.candidate_profiles.preferred_locations,
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
            bio: profile.about,
            ...profile.candidate_profiles
        };

        const result = validateCandidateProfile(validationData);
        if (!result.success) {
            setErrors(result.errors || {});
            setIsSaving(false);
            return;
        }

        try {
            const normalized = normalizeCandidateProfile(profile.candidate_profiles || {});
            const finalCandidateProfile = {
                ...normalized,
                work_history: profile.candidate_profiles?.work_history || []
            };

            const { error: saveError } = await invokeFunction('candidate-profile', {
                method: 'PUT',
                body: {
                    profile: {
                        name: profile.name,
                        phone: profile.phone,
                        location: profile.location,
                        bio: profile.about,
                        avatar_url: profile.avatar_url ?? null,  // Always preserve existing avatar
                    },
                    candidateProfile: finalCandidateProfile
                }
            });

            if (saveError) {
                if ((saveError as any).details) {
                    console.error('[handleSave] Server validation details:', JSON.stringify((saveError as any).details, null, 2));
                }
                throw new Error(saveError.message);
            }

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
        if (type === 'avatar' && !isEditing) return;

        setUploadProgress(prev => ({ ...prev, [type]: 10 }));

        try {
            let url = '';
            const bucketName = type === 'avatar' ? 'avatars' : 'resumes';
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uuid = typeof window !== 'undefined' && window.crypto?.randomUUID 
                ? window.crypto.randomUUID() 
                : Math.random().toString(36).substring(2, 15);
            const path = `${user.id}/${uuid}_${safeName}`;

            // Clean up old file from storage if it exists to keep storage secure
            const oldUrl = profile ? (type === 'avatar' ? profile.avatar_url : profile.candidate_profiles?.resume_url) : undefined;
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
            
            url = (type === 'avatar' ? uploadData?.key : uploadData?.url) || '';

            if (type === 'avatar') {
                setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                // Persist avatar_url to the database via edge function
                const { error: saveErr } = await invokeFunction('candidate-profile', {
                    method: 'PUT',
                    body: { profile: { avatar_url: url } }
                });
                if (saveErr) {
                    console.error('[Avatar upload] Failed to persist avatar_url:', saveErr);
                    throw new Error('Photo uploaded but failed to save: ' + saveErr.message);
                }
                await refreshUser();
                setToast({ message: 'Profile photo updated!', type: 'success' });
            } else if (type === 'resume') {
                setProfile(prev => prev ? {
                    ...prev,
                    candidate_profiles: {
                        ...(prev.candidate_profiles || { id: prev.id, profile_strength: 0 }),
                        resume_url: url
                    }
                } : null);
                const { success: resumeSaved, error: resumeErr } = await updateCandidateProfile({ resume_url: url });
                if (!resumeSaved) {
                    throw new Error('Resume uploaded but failed to save: ' + (resumeErr?.message || 'unknown error'));
                }
                setToast({ message: 'Resume uploaded successfully!', type: 'success' });
            }
            setUploadProgress(prev => ({ ...prev, [type]: 100 }));
            setTimeout(() => setUploadProgress(prev => ({ ...prev, [type]: 0 })), 2000);
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
            setUploadProgress(prev => ({ ...prev, [type]: 0 }));
        }
    };

    if (isLoading) return <div className={styles.loading}>Loading profile...</div>;
    if (!profile) return <div className={styles.error}>Profile not found.</div>;

    const cp = profile.candidate_profiles || {
        id: profile.id,
        profile_strength: 0,
        skills: [],
        preferred_locations: [],
        experience_years: 0
    };
    const strength = cp.profile_strength || 0;

    return (
        <div className={styles.profilePage}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className={styles.profileSidebar}>
                <div className={styles.profileCard}>
                    <div
                        className={styles.profileAvatar}
                        style={{ cursor: isEditing ? 'pointer' : 'default' }}
                        onClick={() => isEditing && avatarInputRef.current?.click()}
                    >
                        {profile.avatar_url ? (
                            <img src={getPublicStorageUrl('avatars', profile.avatar_url)} alt={profile.name} className={styles.avatarImg} />
                        ) : (
                            (profile.name || 'User').split(' ').filter(Boolean).map(n => n[0]).join('')
                        )}
                        {isEditing && <div className={styles.avatarOverlay}>{IC.camera}</div>}
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

                {/* ── Personal Details ── */}
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
                                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp, headline: e.target.value } })}
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
                                <label>Bio / Professional Summary</label>
                                <textarea
                                    value={profile.about || ''}
                                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                                    placeholder="Tell recruiters about yourself..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Professional Summary (view mode) ── */}
                {!isEditing && (
                    <div className={styles.profileSection}>
                        <div className={styles.sectionHead}>
                            <h2 className={styles.sectionTitle}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                Professional Summary
                            </h2>
                        </div>
                        {profile.about ? (
                            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.75', margin: 0, padding: '0.25rem 0' }}>
                                {profile.about}
                            </p>
                        ) : (
                            <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', margin: 0, padding: '0.5rem 0' }}>
                                No summary added yet. Click <strong>Edit Profile</strong> to add one.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Professional Info ── */}
                <div className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{IC.briefcase} Professional Info</h2>
                    </div>
                    {isEditing ? (
                        <div className={styles.editGrid}>
                            <div className={styles.fieldFull}>
                                <label>Years of Experience</label>
                                <input
                                    type="number"
                                    value={cp?.experience_years || 0}
                                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp, experience_years: parseInt(e.target.value) || 0 } })}
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

                {/* ── Work Experience ── */}
                <div id="experience" className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{IC.briefcase} Work Experience</h2>
                        {isEditing && !showExpForm && (
                            <button
                                onClick={() => { setExpForm({ ...EMPTY_EXP, id: crypto.randomUUID() }); setEditingExpId(null); setShowExpForm(true); setExpFormErrors({}); }}
                                style={{ display:'flex', alignItems:'center', gap:'0.35rem', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'0.35rem 0.85rem', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Add Experience
                            </button>
                        )}
                    </div>

                    {/* Existing entries */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: cp?.work_history?.length ? '0.5rem' : 0 }}>
                        {(cp?.work_history || []).map((exp) => (
                            editingExpId === exp.id && showExpForm ? (
                                // Inline edit form for this entry
                                <div key={exp.id} style={{ border:'1.5px solid #bfdbfe', borderRadius:'12px', padding:'1.25rem', background:'#f8fbff', display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                                    <p style={{ fontWeight:700, fontSize:'0.8rem', color:'#2563eb', margin:0 }}>Edit Experience</p>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Job Title *</label>
                                            <input value={expForm.title} onChange={e => setExpForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Frontend Developer" style={{ padding:'0.5rem', border:`1px solid ${expFormErrors.title ? '#ef4444' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                            {expFormErrors.title && <span style={{ fontSize:'0.68rem', color:'#ef4444' }}>{expFormErrors.title}</span>}
                                        </div>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Company *</label>
                                            <input value={expForm.company} onChange={e => setExpForm(p => ({...p, company: e.target.value}))} placeholder="e.g. Google" style={{ padding:'0.5rem', border:`1px solid ${expFormErrors.company ? '#ef4444' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                            {expFormErrors.company && <span style={{ fontSize:'0.68rem', color:'#ef4444' }}>{expFormErrors.company}</span>}
                                        </div>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Location</label>
                                            <input value={expForm.location || ''} onChange={e => setExpForm(p => ({...p, location: e.target.value}))} placeholder="e.g. Bangalore, IN" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                        </div>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Start Date</label>
                                            <input type="month" value={expForm.start_date || ''} onChange={e => setExpForm(p => ({...p, start_date: e.target.value}))} style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                        </div>
                                        {!expForm.is_current && (
                                            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                                <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>End Date</label>
                                                <input type="month" value={expForm.end_date || ''} onChange={e => setExpForm(p => ({...p, end_date: e.target.value}))} style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                            </div>
                                        )}
                                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', paddingTop:'1.2rem' }}>
                                            <input type="checkbox" id={`curr-edit-${exp.id}`} checked={!!expForm.is_current} onChange={e => setExpForm(p => ({...p, is_current: e.target.checked, end_date: e.target.checked ? '' : p.end_date}))} style={{ width:'15px', height:'15px', cursor:'pointer' }} />
                                            <label htmlFor={`curr-edit-${exp.id}`} style={{ fontSize:'0.8rem', color:'#475569', cursor:'pointer' }}>Currently working here</label>
                                        </div>
                                    </div>
                                    <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                        <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Description / Responsibilities</label>
                                        <textarea value={expForm.description || ''} onChange={e => setExpForm(p => ({...p, description: e.target.value}))} placeholder="Describe your role, key achievements, technologies used..." rows={3} style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', resize:'vertical', outline:'none', fontFamily:'inherit' }} />
                                    </div>
                                    <div style={{ display:'flex', gap:'0.5rem' }}>
                                        <button onClick={() => {
                                            const errs: any = {};
                                            if (!expForm.title.trim()) errs.title = 'Title is required';
                                            if (!expForm.company.trim()) errs.company = 'Company is required';
                                            if (Object.keys(errs).length) { setExpFormErrors(errs); return; }
                                            const updated = (cp?.work_history || []).map(e => e.id === exp.id ? expForm : e);
                                            setProfile(prev => prev ? { ...prev, candidate_profiles: { ...cp, work_history: updated } } : null);
                                            setShowExpForm(false); setEditingExpId(null);
                                        }} style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>Save</button>
                                        <button onClick={() => { setShowExpForm(false); setEditingExpId(null); }} style={{ background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:'8px', padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                // View card
                                <div key={exp.id} style={{ padding:'1rem 1.1rem', borderRadius:'10px', border:'1px solid #f1f5f9', background:'#fafbff', position:'relative' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                                        <div>
                                            <p style={{ fontWeight:700, fontSize:'0.9rem', color:'#0f172a', margin:0 }}>{exp.title}</p>
                                            <p style={{ fontSize:'0.82rem', color:'#3b82f6', fontWeight:600, margin:'0.1rem 0 0' }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
                                            {(exp.start_date || exp.end_date) && (
                                                <span style={{ fontSize:'0.72rem', color:'#64748b', whiteSpace:'nowrap' }}>
                                                    {exp.start_date} {exp.is_current ? '→ Present' : exp.end_date ? `→ ${exp.end_date}` : ''}
                                                </span>
                                            )}
                                            {isEditing && (
                                                <>
                                                    <button onClick={() => { setExpForm({...exp}); setEditingExpId(exp.id); setShowExpForm(true); setExpFormErrors({}); }} title="Edit" style={{ background:'#eff6ff', border:'none', borderRadius:'6px', padding:'4px 8px', cursor:'pointer', color:'#2563eb', display:'flex', alignItems:'center' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </button>
                                                    <button onClick={() => {
                                                        const updated = (cp?.work_history || []).filter(e => e.id !== exp.id);
                                                        setProfile(prev => prev ? { ...prev, candidate_profiles: { ...cp, work_history: updated } } : null);
                                                    }} title="Delete" style={{ background:'#fff1f2', border:'none', borderRadius:'6px', padding:'4px 8px', cursor:'pointer', color:'#ef4444', display:'flex', alignItems:'center' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {exp.description && <p style={{ fontSize:'0.8rem', color:'#475569', margin:'0.5rem 0 0', lineHeight:'1.65' }}>{exp.description}</p>}
                                </div>
                            )
                        ))}
                    </div>

                    {/* Add new entry form */}
                    {isEditing && showExpForm && !editingExpId && (
                        <div style={{ border:'1.5px solid #bfdbfe', borderRadius:'12px', padding:'1.25rem', background:'#f8fbff', display:'flex', flexDirection:'column', gap:'0.85rem', marginTop:'0.75rem' }}>
                            <p style={{ fontWeight:700, fontSize:'0.8rem', color:'#2563eb', margin:0 }}>New Experience</p>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Job Title *</label>
                                    <input value={expForm.title} onChange={e => setExpForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Frontend Developer" style={{ padding:'0.5rem', border:`1px solid ${expFormErrors.title ? '#ef4444' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                    {expFormErrors.title && <span style={{ fontSize:'0.68rem', color:'#ef4444' }}>{expFormErrors.title}</span>}
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Company *</label>
                                    <input value={expForm.company} onChange={e => setExpForm(p => ({...p, company: e.target.value}))} placeholder="e.g. Google" style={{ padding:'0.5rem', border:`1px solid ${expFormErrors.company ? '#ef4444' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                    {expFormErrors.company && <span style={{ fontSize:'0.68rem', color:'#ef4444' }}>{expFormErrors.company}</span>}
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Location</label>
                                    <input value={expForm.location || ''} onChange={e => setExpForm(p => ({...p, location: e.target.value}))} placeholder="e.g. Bangalore, IN" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Start Date</label>
                                    <input type="month" value={expForm.start_date || ''} onChange={e => setExpForm(p => ({...p, start_date: e.target.value}))} style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                </div>
                                {!expForm.is_current && (
                                    <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                        <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>End Date</label>
                                        <input type="month" value={expForm.end_date || ''} onChange={e => setExpForm(p => ({...p, end_date: e.target.value}))} style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                    </div>
                                )}
                                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', paddingTop:'1.2rem' }}>
                                    <input type="checkbox" id="exp-current" checked={!!expForm.is_current} onChange={e => setExpForm(p => ({...p, is_current: e.target.checked, end_date: e.target.checked ? '' : p.end_date}))} style={{ width:'15px', height:'15px', cursor:'pointer' }} />
                                    <label htmlFor="exp-current" style={{ fontSize:'0.8rem', color:'#475569', cursor:'pointer' }}>Currently working here</label>
                                </div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Description / Responsibilities</label>
                                <textarea value={expForm.description || ''} onChange={e => setExpForm(p => ({...p, description: e.target.value}))} placeholder="Describe your role, key achievements, technologies used..." rows={3} style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', resize:'vertical', outline:'none', fontFamily:'inherit' }} />
                            </div>
                            <div style={{ display:'flex', gap:'0.5rem' }}>
                                <button onClick={() => {
                                    const errs: any = {};
                                    if (!expForm.title.trim()) errs.title = 'Title is required';
                                    if (!expForm.company.trim()) errs.company = 'Company is required';
                                    if (Object.keys(errs).length) { setExpFormErrors(errs); return; }
                                    const updated = [...(cp?.work_history || []), expForm];
                                    setProfile(prev => prev ? { ...prev, candidate_profiles: { ...cp, work_history: updated } } : null);
                                    setShowExpForm(false); setExpForm({ ...EMPTY_EXP, id: crypto.randomUUID() });
                                }} style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>Add</button>
                                <button onClick={() => { setShowExpForm(false); setExpFormErrors({}); }} style={{ background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:'8px', padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {!isEditing && (!cp?.work_history || cp.work_history.length === 0) && (
                        <p style={{ fontSize:'0.82rem', color:'#94a3b8', fontStyle:'italic', margin:0, padding:'0.5rem 0' }}>
                            No work experience added yet. Click <strong>Edit Profile</strong> to add your experience.
                        </p>
                    )}
                </div>

                {/* ── Education Section ── */}
                <div id="education" className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                            Education
                        </h2>
                        {isEditing && !showEduForm && (
                            <button
                                onClick={() => { setEduForm({ ...EMPTY_EDU, id: crypto.randomUUID() }); setEditingEduId(null); setShowEduForm(true); setEduFormErrors({}); }}
                                style={{ display:'flex', alignItems:'center', gap:'0.35rem', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'0.35rem 0.85rem', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Add Education
                            </button>
                        )}
                    </div>

                    {/* Existing entries */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: cp?.education?.length ? '0.5rem' : 0 }}>
                        {Array.isArray(cp?.education) && cp.education.map((edu) => (
                            editingEduId === edu.id && showEduForm ? (
                                // Inline edit form for this entry
                                <div key={edu.id} style={{ border:'1.5px solid #bfdbfe', borderRadius:'12px', padding:'1.25rem', background:'#f8fbff', display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                                    <p style={{ fontWeight:700, fontSize:'0.8rem', color:'#2563eb', margin:0 }}>Edit Education</p>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Degree *</label>
                                            <input value={eduForm.degree} onChange={e => setEduForm(p => ({...p, degree: e.target.value}))} placeholder="e.g. B.Tech, MBA" style={{ padding:'0.5rem', border:`1px solid ${eduFormErrors.degree ? '#ef4444' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                            {eduFormErrors.degree && <span style={{ fontSize:'0.68rem', color:'#ef4444' }}>{eduFormErrors.degree}</span>}
                                        </div>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Institution *</label>
                                            <input value={eduForm.institution} onChange={e => setEduForm(p => ({...p, institution: e.target.value}))} placeholder="e.g. Nirma University" style={{ padding:'0.5rem', border:`1px solid ${eduFormErrors.institution ? '#ef4444' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                            {eduFormErrors.institution && <span style={{ fontSize:'0.68rem', color:'#ef4444' }}>{eduFormErrors.institution}</span>}
                                        </div>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Field of Study</label>
                                            <input value={eduForm.field_of_study || ''} onChange={e => setEduForm(p => ({...p, field_of_study: e.target.value}))} placeholder="e.g. Computer Science" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                        </div>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Start Year</label>
                                            <input type="number" value={eduForm.start_year || ''} onChange={e => setEduForm(p => ({...p, start_year: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined}))} placeholder="e.g. 2021" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                        </div>
                                        {!eduForm.is_current && (
                                            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                                <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>End Year</label>
                                                <input type="number" value={eduForm.end_year || ''} onChange={e => setEduForm(p => ({...p, end_year: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined}))} placeholder="e.g. 2025" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                            </div>
                                        )}
                                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', paddingTop:'1.2rem' }}>
                                            <input type="checkbox" id={`edu-curr-edit-${edu.id}`} checked={!!eduForm.is_current} onChange={e => setEduForm(p => ({...p, is_current: e.target.checked, end_year: e.target.checked ? undefined : p.end_year}))} style={{ width:'15px', height:'15px', cursor:'pointer' }} />
                                            <label htmlFor={`edu-curr-edit-${edu.id}`} style={{ fontSize:'0.8rem', color:'#475569', cursor:'pointer' }}>Currently studying here</label>
                                        </div>
                                    </div>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'0.75rem' }}>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Grade / CGPA</label>
                                            <input value={eduForm.grade || ''} onChange={e => setEduForm(p => ({...p, grade: e.target.value}))} placeholder="e.g. 8.4 CGPA or 85%" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                        </div>
                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                            <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Description / Activities</label>
                                            <textarea value={eduForm.description || ''} onChange={e => setEduForm(p => ({...p, description: e.target.value}))} placeholder="Describe coursework, honors, or extracurricular activities..." rows={3} style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', resize:'vertical', outline:'none', fontFamily:'inherit' }} />
                                        </div>
                                    </div>
                                    <div style={{ display:'flex', gap:'0.5rem' }}>
                                        <button onClick={() => {
                                            const errs: any = {};
                                            if (!eduForm.degree.trim()) errs.degree = 'Degree is required';
                                            if (!eduForm.institution.trim()) errs.institution = 'Institution is required';
                                            if (Object.keys(errs).length) { setEduFormErrors(errs); return; }
                                            const currentEdu = Array.isArray(cp?.education) ? (cp.education as EducationEntry[]) : [];
                                            const updated: EducationEntry[] = currentEdu.map((e: EducationEntry) => e.id === edu.id ? eduForm : e);
                                            setProfile(prev => prev ? { ...prev, candidate_profiles: { ...cp, education: updated } } : null);
                                            setShowEduForm(false); setEditingEduId(null);
                                        }} style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>Save</button>
                                        <button onClick={() => { setShowEduForm(false); setEditingEduId(null); }} style={{ background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:'8px', padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                // View card
                                <div key={edu.id} style={{ padding:'1rem 1.1rem', borderRadius:'10px', border:'1px solid #f1f5f9', background:'#fafbff', position:'relative' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                                        <div>
                                            <p style={{ fontWeight:700, fontSize:'0.9rem', color:'#0f172a', margin:0 }}>
                                                {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                                            </p>
                                            <p style={{ fontSize:'0.82rem', color:'#3b82f6', fontWeight:600, margin:'0.1rem 0 0' }}>
                                                {edu.institution || 'Unknown Institution'}{edu.grade ? ` · Grade: ${edu.grade}` : ''}
                                            </p>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
                                            {(edu.start_year || edu.end_year || edu.is_current) && (
                                                <span style={{ fontSize:'0.72rem', color:'#64748b', whiteSpace:'nowrap' }}>
                                                    {edu.start_year || ''} {edu.is_current ? '→ Present' : edu.end_year ? `→ ${edu.end_year}` : ''}
                                                </span>
                                            )}
                                            {isEditing && (
                                                <>
                                                    <button onClick={() => { setEduForm({...edu}); setEditingEduId(edu.id); setShowEduForm(true); setEduFormErrors({}); }} title="Edit" style={{ background:'#eff6ff', border:'none', borderRadius:'6px', padding:'4px 8px', cursor:'pointer', color:'#2563eb', display:'flex', alignItems:'center' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </button>
                                                    <button onClick={() => {
                                                        const currentEdu = Array.isArray(cp?.education) ? (cp.education as EducationEntry[]) : [];
                                                        const updated: EducationEntry[] = currentEdu.filter((e: EducationEntry) => e.id !== edu.id);
                                                        setProfile(prev => prev ? { ...prev, candidate_profiles: { ...cp, education: updated } } : null);
                                                    }} title="Delete" style={{ background:'#fff1f2', border:'none', borderRadius:'6px', padding:'4px 8px', cursor:'pointer', color:'#ef4444', display:'flex', alignItems:'center' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {edu.description && <p style={{ fontSize:'0.8rem', color:'#475569', margin:'0.5rem 0 0', lineHeight:'1.65' }}>{edu.description}</p>}
                                </div>
                            )
                        ))}
                    </div>

                    {/* Add new entry form */}
                    {isEditing && showEduForm && !editingEduId && (
                        <div style={{ border:'1.5px solid #bfdbfe', borderRadius:'12px', padding:'1.25rem', background:'#f8fbff', display:'flex', flexDirection:'column', gap:'0.85rem', marginTop:'0.75rem' }}>
                            <p style={{ fontWeight:700, fontSize:'0.8rem', color:'#2563eb', margin:0 }}>New Education</p>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Degree *</label>
                                    <input value={eduForm.degree} onChange={e => setEduForm(p => ({...p, degree: e.target.value}))} placeholder="e.g. B.Tech, MBA" style={{ padding:'0.5rem', border:`1px solid ${eduFormErrors.degree ? '#ef4444' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                    {eduFormErrors.degree && <span style={{ fontSize:'0.68rem', color:'#ef4444' }}>{eduFormErrors.degree}</span>}
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Institution *</label>
                                    <input value={eduForm.institution} onChange={e => setEduForm(p => ({...p, institution: e.target.value}))} placeholder="e.g. Nirma University" style={{ padding:'0.5rem', border:`1px solid ${eduFormErrors.institution ? '#ef4444' : '#e2e8f0'}`, borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                    {eduFormErrors.institution && <span style={{ fontSize:'0.68rem', color:'#ef4444' }}>{eduFormErrors.institution}</span>}
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Field of Study</label>
                                    <input value={eduForm.field_of_study || ''} onChange={e => setEduForm(p => ({...p, field_of_study: e.target.value}))} placeholder="e.g. Computer Science" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Start Year</label>
                                    <input type="number" value={eduForm.start_year || ''} onChange={e => setEduForm(p => ({...p, start_year: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined}))} placeholder="e.g. 2021" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                </div>
                                {!eduForm.is_current && (
                                    <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                        <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>End Year</label>
                                        <input type="number" value={eduForm.end_year || ''} onChange={e => setEduForm(p => ({...p, end_year: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined}))} placeholder="e.g. 2025" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                    </div>
                                )}
                                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', paddingTop:'1.2rem' }}>
                                    <input type="checkbox" id="edu-current" checked={!!eduForm.is_current} onChange={e => setEduForm(p => ({...p, is_current: e.target.checked, end_year: e.target.checked ? undefined : p.end_year}))} style={{ width:'15px', height:'15px', cursor:'pointer' }} />
                                    <label htmlFor="edu-current" style={{ fontSize:'0.8rem', color:'#475569', cursor:'pointer' }}>Currently studying here</label>
                                </div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'0.75rem' }}>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Grade / CGPA</label>
                                    <input value={eduForm.grade || ''} onChange={e => setEduForm(p => ({...p, grade: e.target.value}))} placeholder="e.g. 8.4 CGPA or 85%" style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', outline:'none' }} />
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                    <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>Description / Activities</label>
                                    <textarea value={eduForm.description || ''} onChange={e => setEduForm(p => ({...p, description: e.target.value}))} placeholder="Describe coursework, honors, or extracurricular activities..." rows={3} style={{ padding:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.82rem', resize:'vertical', outline:'none', fontFamily:'inherit' }} />
                                </div>
                            </div>
                            <div style={{ display:'flex', gap:'0.5rem' }}>
                                <button onClick={() => {
                                    const errs: any = {};
                                    if (!eduForm.degree.trim()) errs.degree = 'Degree is required';
                                    if (!eduForm.institution.trim()) errs.institution = 'Institution is required';
                                    if (Object.keys(errs).length) { setEduFormErrors(errs); return; }
                                    const currentEdu = Array.isArray(cp?.education) ? (cp.education as EducationEntry[]) : [];
                                    const updated: EducationEntry[] = [...currentEdu, eduForm];
                                    setProfile(prev => prev ? { ...prev, candidate_profiles: { ...cp, education: updated } } : null);
                                    setShowEduForm(false); setEduForm({ ...EMPTY_EDU, id: crypto.randomUUID() });
                                }} style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>Add</button>
                                <button onClick={() => { setShowEduForm(false); setEduFormErrors({}); }} style={{ background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:'8px', padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {!isEditing && (!cp?.education || cp.education.length === 0) && (
                        <p style={{ fontSize:'0.82rem', color:'#94a3b8', fontStyle:'italic', margin:0, padding:'0.5rem 0' }}>
                            No education added yet. Click <strong>Edit Profile</strong> to add your education.
                        </p>
                    )}
                </div>

                {/* ── Skills ── */}
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
                                            setProfile({ ...profile, candidate_profiles: { ...cp, skills: newSkills } });
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* ── Online Presence ── */}
                <div className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}><circle cx="12" cy="12" r="10"/><path d="M8 5.6a4 4 0 0 1 8 0v12.8a4 4 0 0 1-8 0z"/></svg>
                            Online Presence
                        </h2>
                    </div>
                    {isEditing ? (
                        <div className={styles.editGrid}>
                            <div className={styles.field}>
                                <label>LinkedIn Profile URL</label>
                                <input
                                    type="text"
                                    placeholder="e.g. linkedin.com/in/username"
                                    value={cp?.linkedin_url || ''}
                                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp, linkedin_url: e.target.value } })}
                                />
                                {cp?.linkedin_url && !/^https?:\/\//i.test(cp.linkedin_url) && (
                                    <span style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.2rem' }}>
                                        ⚠️ Omitted 'https://'. It will be added automatically.
                                    </span>
                                )}
                            </div>
                            <div className={styles.field}>
                                <label>GitHub Profile URL</label>
                                <input
                                    type="text"
                                    placeholder="e.g. github.com/username"
                                    value={cp?.github_url || ''}
                                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp, github_url: e.target.value } })}
                                />
                                {cp?.github_url && !/^https?:\/\//i.test(cp.github_url) && (
                                    <span style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.2rem' }}>
                                        ⚠️ Omitted 'https://'. It will be added automatically.
                                    </span>
                                )}
                            </div>
                            <div className={styles.fieldFull}>
                                <label>Portfolio or Personal Website URL</label>
                                <input
                                    type="text"
                                    placeholder="e.g. portfolio.com/username"
                                    value={cp?.portfolio_url || ''}
                                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp, portfolio_url: e.target.value } })}
                                />
                                {cp?.portfolio_url && !/^https?:\/\//i.test(cp.portfolio_url) && (
                                    <span style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.2rem' }}>
                                        ⚠️ Omitted 'https://'. It will be added automatically.
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {cp?.linkedin_url ? (
                                <a href={cp.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#e0f2fe', color: '#0369a1', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', border: '1px solid #bae6fd', transition: 'all 0.2s' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                    LinkedIn
                                </a>
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.82rem', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                                    No LinkedIn URL
                                </span>
                            )}
                            {cp?.github_url ? (
                                <a href={cp.github_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', color: '#1e293b', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', border: '1px solid #cbd5e1', transition: 'all 0.2s' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                    GitHub
                                </a>
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.82rem', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                                    No GitHub URL
                                </span>
                            )}
                            {cp?.portfolio_url ? (
                                <a href={cp.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#e6f4ea', color: '#137333', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', border: '1px solid #ceead6', transition: 'all 0.2s' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                    Portfolio
                                </a>
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.82rem', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                                    No Portfolio URL
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Job Preferences ── */}
                <div className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            Job Preferences
                        </h2>
                    </div>

                    {isEditing ? (
                        <div className={styles.editGrid}>
                            {/* Preferred Locations */}
                            <div className={styles.fieldFull}>
                                <label>Preferred Locations (Press Enter to add)</label>
                                <div className={styles.tagInput} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.4rem', border: '1px solid #eef0f2', borderRadius: '8px', minHeight: '38px', background: '#fff' }}>
                                    {cp?.preferred_locations?.map(loc => (
                                        <span key={loc} className={styles.skillChip} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem' }}>
                                            {loc}
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const newLocs = cp.preferred_locations?.filter(l => l !== loc);
                                                    setProfile({ ...profile, candidate_profiles: { ...cp, preferred_locations: newLocs } });
                                                }}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
                                            >×</button>
                                        </span>
                                    ))}
                                    <input 
                                        placeholder={cp?.preferred_locations?.length ? "" : "e.g. Bangalore"}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const i = e.target as HTMLInputElement;
                                                const v = i.value.trim();
                                                if (v && !cp?.preferred_locations?.includes(v)) {
                                                    const n = [...(cp?.preferred_locations || []), v];
                                                    setProfile({ ...profile, candidate_profiles: { ...cp, preferred_locations: n } });
                                                    i.value = '';
                                                }
                                            }
                                        }} 
                                        style={{ border: 'none', outline: 'none', flex: 1, minWidth: '120px', padding: '2px', fontSize: '0.82rem' }}
                                    />
                                </div>
                            </div>

                            {/* Job Types Checkboxes */}
                            <div className={styles.fieldFull}>
                                <label style={{ marginBottom: '0.2rem' }}>Job Types (Select all that apply)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.2rem' }}>
                                    {['Full-time', 'Contract', 'Freelance', 'Internship', 'Remote', 'Hybrid', 'Onsite'].map(type => {
                                        const isChecked = cp?.job_types?.includes(type);
                                        return (
                                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                                                <input 
                                                    type="checkbox"
                                                    checked={!!isChecked}
                                                    onChange={(e) => {
                                                        let newJobTypes = cp.job_types ? [...cp.job_types] : [];
                                                        if (e.target.checked) {
                                                            newJobTypes.push(type);
                                                        } else {
                                                            newJobTypes = newJobTypes.filter(t => t !== type);
                                                        }
                                                        setProfile({ ...profile, candidate_profiles: { ...cp, job_types: newJobTypes } });
                                                    }}
                                                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                                                />
                                                {type}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Expected Salary Min/Max */}
                            <div className={styles.field}>
                                <label>Min Expected Salary (Monthly)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 50000"
                                    value={cp?.salary_min ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
                                        setProfile({ ...profile, candidate_profiles: { ...cp, salary_min: val } });
                                    }}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Max Expected Salary (Monthly)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 90000"
                                    value={cp?.salary_max ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
                                        setProfile({ ...profile, candidate_profiles: { ...cp, salary_max: val } });
                                    }}
                                />
                            </div>

                            {/* Open to Remote Toggle */}
                            <div className={styles.fieldFull} style={{ marginTop: '0.4rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontSize: '0.82rem', color: '#334155' }}>
                                    <input 
                                        type="checkbox"
                                        checked={cp?.open_to_remote ?? true}
                                        onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp, open_to_remote: e.target.checked } })}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <span>Open to Remote Preference (recruiters will see you are open to remote roles)</span>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Preferred Locations</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {cp?.preferred_locations && cp.preferred_locations.length > 0 ? (
                                        cp.preferred_locations.map(loc => (
                                            <span key={loc} className={styles.tag} style={{ margin: 0 }}>{loc}</span>
                                        ))
                                    ) : (
                                        <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>Not specified</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Job Types</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {cp?.job_types && cp.job_types.length > 0 ? (
                                        cp.job_types.map(type => (
                                            <span key={type} className={styles.tag} style={{ margin: 0, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>{type}</span>
                                        ))
                                    ) : (
                                        <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>Not specified</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Expected Salary</span>
                                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                                    {(() => {
                                        const min = cp?.salary_min;
                                        const max = cp?.salary_max;
                                        const curr = cp?.currency || 'INR';
                                        if (!min && !max) return 'Not specified';
                                        const symbol = curr === 'INR' ? '₹' : (curr === 'USD' ? '$' : curr + ' ');
                                        const formattedMin = min ? min.toLocaleString('en-IN') : null;
                                        const formattedMax = max ? max.toLocaleString('en-IN') : null;
                                        if (formattedMin && formattedMax) return `${symbol}${formattedMin} – ${symbol}${formattedMax}`;
                                        if (formattedMin) return `${symbol}${formattedMin}+`;
                                        return `${symbol}${formattedMax} max`;
                                    })()}
                                </strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Open to Remote</span>
                                <span style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    background: cp?.open_to_remote ? '#ecfdf5' : '#f8fafc',
                                    color: cp?.open_to_remote ? '#047857' : '#64748b',
                                    border: `1px solid ${cp?.open_to_remote ? '#a7f3d0' : '#cbd5e1'}`,
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                }}>
                                    {cp?.open_to_remote ? '✓ Yes, Open' : 'No'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
