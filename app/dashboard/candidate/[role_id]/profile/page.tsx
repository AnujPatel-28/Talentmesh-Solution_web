"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '../../../shared-dashboard.module.css';
import { useAuth } from '@/lib/auth/AuthContext';
import ProfileStrengthWidget from '@/components/candidate/ProfileStrengthWidget';
import { insforge, invokeFunction } from '@/lib/insforge';
import type { UserProfile, CandidateProfile, WorkExperience, EducationEntry } from '@/types/user';
import { validateCandidateProfile } from '@/lib/validation/candidate';
import { normalizeCandidateProfile } from '@/lib/candidate-profile';
import Toast from '@/components/ui/Toast';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';

import { useProfileDirtyState } from './hooks/useProfileDirtyState';
import { useProfileCompletion } from './hooks/useProfileCompletion';
import { useUnsavedChangesGuard } from './hooks/useUnsavedChangesGuard';

import ProfileSummaryCard from './components/ProfileSummaryCard';
import JobPreferencesSection from './components/JobPreferencesSection';
import SkillsSection from './components/SkillsSection';
import ExperienceTimeline from './components/ExperienceTimeline';
import EducationSection from './components/EducationSection';
import SocialLinksSection from './components/SocialLinksSection';
import ResumePreviewModal from './components/ResumePreviewModal';
import StickyActionBar from './components/StickyActionBar';
import CandidateInsightsCard from './components/CandidateInsightsCard';
import SectionStatus from './components/SectionStatus';

// Product analytics hook for profiling metrics
const trackProfileEvent = (event: string, properties?: Record<string, any>) => {
  console.log(`[Analytics] Tracked Event: "${event}"`, properties);
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({ avatar: 0, resume: 0 });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Computed state references (shallow references)
  const cp = useMemo((): CandidateProfile => {
    return profile?.candidate_profiles || {
      id: profile?.id || '',
      profile_strength: 0,
      skills: [],
      preferred_locations: [],
      experience_years: 0,
      work_history: [],
      education: [],
      job_types: [],
      salary_min: undefined,
      salary_max: undefined,
      currency: 'INR',
      open_to_remote: true,
      is_visible: true,
      resume_url: undefined,
      linkedin_url: undefined,
      github_url: undefined,
      portfolio_url: undefined,
      headline: ''
    };
  }, [profile]);

  // Profile strength completion hook parameters (only recalculate when keys change)
  const completionParams = useMemo(() => ({
    avatar_url: profile?.avatar_url,
    resume_url: cp.resume_url,
    bio: profile?.about,
    skills: cp.skills,
    experience: cp.work_history,
    education: cp.education,
    location: profile?.location,
    linkedin_url: cp.linkedin_url
  }), [
    profile?.avatar_url,
    cp.resume_url,
    profile?.about,
    cp.skills,
    cp.work_history,
    cp.education,
    profile?.location,
    cp.linkedin_url
  ]);

  const completion = useProfileCompletion(completionParams);

  // Detect unsaved changes (structural diff of local profile against original fetch payload)
  const isDirty = useProfileDirtyState(profile, originalProfile);
  useUnsavedChangesGuard(isDirty);

  const fetchProfile = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const { data, error } = await invokeFunction('candidate-profile', { method: 'GET' });
      if (error) throw new Error(error.message);

      const mappedProfile: UserProfile = {
        ...data.profile,
        about: data.profile?.bio,
        candidate_profiles: data.candidateProfile
      };

      setProfile(mappedProfile);
      setOriginalProfile(JSON.parse(JSON.stringify(mappedProfile)));
    } catch (err: any) {
      console.error('Failed to fetch candidate profile:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateCandidateProfile = useCallback(async (updates: Partial<CandidateProfile>) => {
    try {
      const { error } = await invokeFunction('candidate-profile', {
        method: 'PUT',
        body: { candidateProfile: updates }
      });
      if (error) throw new Error(error.message);
      return { success: true };
    } catch (error: any) {
      setToast({ message: 'Failed to update preferences: ' + error.message, type: 'error' });
      return { success: false, error };
    }
  }, []);

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
      setToast({ message: 'Please fix the errors in your profile details.', type: 'error' });
      return;
    }

    try {
      const normalized = normalizeCandidateProfile(profile.candidate_profiles || {});
      const finalCandidateProfile = {
        ...normalized,
        work_history: profile.candidate_profiles?.work_history || [],
        education: profile.candidate_profiles?.education || []
      };

      const { error: saveError } = await invokeFunction('candidate-profile', {
        method: 'PUT',
        body: {
          profile: {
            name: profile.name,
            phone: profile.phone,
            location: profile.location,
            bio: profile.about,
            avatar_url: profile.avatar_url ?? null,
          },
          candidateProfile: finalCandidateProfile
        }
      });

      if (saveError) throw new Error(saveError.message);

      // Re-fetch clean database records
      const { data, error: reloadError } = await invokeFunction('candidate-profile', { method: 'GET' });
      if (reloadError) throw new Error(reloadError.message);

      const savedProfile: UserProfile = {
        ...data.profile,
        about: data.profile?.bio,
        candidate_profiles: data.candidateProfile
      };

      setProfile(savedProfile);
      setOriginalProfile(JSON.parse(JSON.stringify(savedProfile)));
      setIsEditing(false);
      setToast({ message: 'Profile updated successfully!', type: 'success' });

      trackProfileEvent('Profile Saved', {
        completion: completion.score
      });
    } catch (err: any) {
      setToast({ message: 'Failed to save changes: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (originalProfile) {
      setProfile(JSON.parse(JSON.stringify(originalProfile)));
    }
    setIsEditing(false);
    setErrors({});
  }, [originalProfile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (type === 'avatar' && !isEditing) return;

    if (type === 'resume') {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (ext !== '.pdf') {
        setToast({ message: 'Only PDF resumes are supported.', type: 'error' });
        return;
      }
      if (file.type !== 'application/pdf') {
        setToast({ message: 'Only PDF resumes are supported.', type: 'error' });
        return;
      }
      const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      const isPdf =
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2D;
      if (!isPdf) {
        setToast({ message: 'Only PDF resumes are supported.', type: 'error' });
        return;
      }
    }

    setUploadProgress(prev => ({ ...prev, [type]: 10 }));

    try {
      let url = '';
      const bucketName = type === 'avatar' ? 'avatars' : 'resumes';
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uuid = typeof window !== 'undefined' && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
      const path = `${user.id}/${uuid}_${safeName}`;

      // Clean up old file from storage to stay secure
      const oldUrl = profile ? (type === 'avatar' ? profile.avatar_url : cp?.resume_url) : undefined;
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
            await insforge.storage.from(bucketName).remove(oldUrl);
          }
        } catch (delErr) {
          console.warn(`Failed to delete old ${type} file:`, delErr);
        }
      }

      const { data: uploadData, error: uploadError } = await (insforge.storage
        .from(bucketName) as any)
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw new Error(uploadError.message);
      url = (type === 'avatar' ? uploadData?.key : uploadData?.url) || '';

      if (type === 'avatar') {
        setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
        const { error: saveErr } = await invokeFunction('candidate-profile', {
          method: 'PUT',
          body: { profile: { avatar_url: url } }
        });
        if (saveErr) throw new Error('Uploaded photo but failed to save: ' + saveErr.message);
        await refreshUser();
        setToast({ message: 'Profile photo updated!', type: 'success' });
        trackProfileEvent('Profile Avatar Updated');
      } else if (type === 'resume') {
        setProfile(prev => prev ? {
          ...prev,
          candidate_profiles: {
            ...cp,
            resume_url: url
          }
        } : null);
        const { success: resumeSaved, error: resumeErr } = await updateCandidateProfile({ resume_url: url });
        if (!resumeSaved) throw new Error('Uploaded resume but failed to save: ' + (resumeErr?.message || 'Unknown'));
        setToast({ message: 'Resume uploaded successfully!', type: 'success' });
        trackProfileEvent('Resume Uploaded');
      }
      setUploadProgress(prev => ({ ...prev, [type]: 100 }));
      setTimeout(() => setUploadProgress(prev => ({ ...prev, [type]: 0 })), 2000);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    }
  };

  // Section specific slice state updates (propagated up from child elements)
  const handleUpdateJobPreferences = useCallback((fields: Partial<CandidateProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        candidate_profiles: {
          ...cp,
          ...fields
        } as CandidateProfile
      };
    });
  }, [cp]);

  const handleUpdateSkills = useCallback((skills: string[]) => {
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        candidate_profiles: {
          ...cp,
          skills
        } as CandidateProfile
      };
    });
  }, [cp]);

  const handleUpdateWorkHistory = useCallback((work_history: WorkExperience[]) => {
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        candidate_profiles: {
          ...cp,
          work_history
        } as CandidateProfile
      };
    });
    trackProfileEvent('Experience Updated', { count: work_history.length });
  }, [cp]);

  const handleUpdateEducation = useCallback((education: EducationEntry[]) => {
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        candidate_profiles: {
          ...cp,
          education
        } as CandidateProfile
      };
    });
    trackProfileEvent('Education Updated', { count: education.length });
  }, [cp]);

  const handleUpdateSocialUrls = useCallback((fields: Partial<CandidateProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        candidate_profiles: {
          ...cp,
          ...fields
        } as CandidateProfile
      };
    });
  }, [cp]);

  const handleToggleVisibility = useCallback(async () => {
    const newVal = cp.is_discoverable === undefined ? false : !cp.is_discoverable;
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        candidate_profiles: {
          ...cp,
          is_discoverable: newVal
        } as CandidateProfile
      };
    });
    const { success } = await updateCandidateProfile({ is_discoverable: newVal });
    if (success) {
      setToast({ message: newVal ? 'Profile is now discoverable!' : 'Profile hidden from recruiter searches.', type: 'info' });
      trackProfileEvent('Profile Visibility Toggled', { discoverable: newVal });
    }
  }, [cp, updateCandidateProfile]);

  const handlePreviewOpen = useCallback(() => {
    setIsPreviewOpen(true);
    trackProfileEvent('Resume Preview Opened');
  }, []);

  // Performance loader shimmer skeleton
  if (isLoading) {
    return (
      <div className={styles.profileContainer}>
        <div className={`${styles.skeletonCard} ${styles.skeletonShimmer}`} style={{ height: '140px' }} />
        <div className={`${styles.skeletonCard} ${styles.skeletonShimmer}`} style={{ height: '180px' }} />
        <div className={styles.skeletonGrid}>
          <div className={`${styles.skeletonCard} ${styles.skeletonShimmer}`} style={{ height: '320px' }} />
          <div className={styles.skeletonCol}>
            <div className={`${styles.skeletonCard} ${styles.skeletonShimmer}`} style={{ height: '220px' }} />
            <div className={`${styles.skeletonCard} ${styles.skeletonShimmer}`} style={{ height: '300px' }} />
          </div>
        </div>
      </div>
    );
  }

  // Section failure state retry visual
  if (hasError || !profile) {
    return (
      <div className={`${styles.profileContainer} ${styles.errorState}`}>
        <span className={styles.errorStateEmoji}>⚠️</span>
        <h2 className={styles.errorStateTitle}>Unable to Load Profile</h2>
        <p className={styles.errorStateText}>
          We encountered an issue fetching your candidate profile. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={fetchProfile}
          className={styles.emptyStateBtn}
        >
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.profileContainer} ${isEditing ? styles.hasStickyBar : ''}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sticky Action controls */}
      <StickyActionBar
        isEditing={isEditing}
        candidateName={profile.name}
        completionScore={completion.score}
        isSaving={isSaving}
        isDirty={isDirty}
        onSave={handleSave}
        onCancel={handleCancel}
        onEditToggle={() => isEditing ? handleCancel() : setIsEditing(true)}
      />

      {/* Hero Summary Card */}
      <ProfileSummaryCard
        name={profile.name}
        headline={cp.headline || ''}
        avatarUrl={profile.avatar_url}
        location={profile.location}
        experienceYears={cp.experience_years}
        salaryMin={cp.salary_min ?? undefined}
        salaryMax={cp.salary_max ?? undefined}
        currency={cp.currency}
        isVisible={cp.is_discoverable ?? true}
        resumeUrl={cp.resume_url}
        isEditing={isEditing}
        uploadProgressAvatar={uploadProgress.avatar}
        email={profile.email}
        phone={profile.phone}
        completionScore={completion.score}
        updatedAt={cp.updated_at}
        onAvatarClick={() => isEditing && avatarInputRef.current?.click()}
        onResumePreview={handlePreviewOpen}
        onResumeUploadClick={() => resumeInputRef.current?.click()}
        onEditToggle={() => isEditing ? handleCancel() : setIsEditing(true)}
      />

      {/* Hidden system files inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        style={{ display: 'none', width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none', zIndex: -999 }}
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'avatar')}
      />
      <input
        type="file"
        ref={resumeInputRef}
        style={{ display: 'none', width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none', zIndex: -999 }}
        accept=".pdf"
        onChange={(e) => handleFileUpload(e, 'resume')}
      />

      {/* Main Grid detail details */}
      <div className={styles.profilePage} style={{ marginTop: '0.5rem' }}>

        {/* Left Side elements: Discoverability and Insights */}
        <div className={styles.profileSidebar}>

          <div className={styles.openToggleCard}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span className={styles.openLabel}>Recruiter Visibility</span>
                <span className={styles.openHint}>Control search discoverability</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={cp.is_discoverable ?? true}
                  onChange={handleToggleVisibility}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                  Visible in recruiter searches
                </span>
              </label>
            </div>
          </div>

          <CandidateInsightsCard
            onEnterEdit={() => setIsEditing(true)}
            candidate={{
              avatar_url: profile.avatar_url,
              resume_url: cp.resume_url,
              bio: profile.about,
              skills: cp.skills,
              experience: cp.work_history,
              education: cp.education,
              location: profile.location,
              linkedin_url: cp.linkedin_url
            }}
          />
        </div>

        {/* Right Main Columns: Preferences, Skills, Work History, Education, Socials */}
        <div className={styles.profileMain}>

          {/* Editable Display Summary bio */}
          {isEditing && (
            <div className={styles.profileSection}>
              <h2 className={styles.sectionTitle}>Display Details</h2>
              <div className={styles.editGrid}>
                <div className={styles.field}>
                  <label className={styles.formLabel}>Display Name</label>
                  <input
                    className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`}
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.formLabel}>Headline</label>
                  <input
                    className={styles.formInput}
                    value={cp.headline || ''}
                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp, headline: e.target.value } as CandidateProfile })}
                    placeholder="e.g. Lead Frontend Engineer"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.formLabel}>Location</label>
                  <input
                    className={styles.formInput}
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="e.g. Bangalore, IN"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.formLabel}>Years of Experience</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={cp.experience_years || 0}
                    onChange={(e) => setProfile({ ...profile, candidate_profiles: { ...cp, experience_years: parseInt(e.target.value) || 0 } as CandidateProfile })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label className={styles.formLabel}>Professional Summary / Bio</label>
                  <textarea
                    className={styles.formTextarea}
                    value={profile.about || ''}
                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                    placeholder="Briefly describe your core experience, domain knowledge, and career objectives..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {!isEditing && (
            <div className={styles.profileSection}>
              <SectionStatus
                title="Professional Summary"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
                isComplete={!!profile.about}
                required={true}
              />
              {profile.about ? (
                <p className={styles.summaryText}>
                  {profile.about}
                </p>
              ) : (
                <p className={styles.emptySectionText}>
                  No professional summary added yet. Click <strong>Edit Profile</strong> to write one.
                </p>
              )}
            </div>
          )}

          {/* Job preferences block */}
          <JobPreferencesSection
            preferredLocations={cp.preferred_locations}
            jobTypes={cp.job_types}
            salaryMin={cp.salary_min}
            salaryMax={cp.salary_max}
            currency={cp.currency}
            openToRemote={cp.open_to_remote}
            isEditing={isEditing}
            onUpdate={handleUpdateJobPreferences}
          />

          {/* Skills section */}
          <SkillsSection
            skills={cp.skills}
            isEditing={isEditing}
            onUpdate={handleUpdateSkills}
          />

          {/* Work experience timeline */}
          <ExperienceTimeline
            experience={cp.work_history}
            isEditing={isEditing}
            onUpdate={handleUpdateWorkHistory}
          />



          {/* Education list */}
          <EducationSection
            education={Array.isArray(cp.education) ? cp.education : []}
            isEditing={isEditing}
            onUpdate={handleUpdateEducation}
          />

          {/* Social connections presence */}
          <SocialLinksSection
            linkedinUrl={cp.linkedin_url}
            githubUrl={cp.github_url}
            portfolioUrl={cp.portfolio_url}
            isEditing={isEditing}
            onUpdate={handleUpdateSocialUrls}
            onEnterEdit={() => setIsEditing(true)}
          />
        </div>
      </div>

      {/* Resume modal viewer loaded on-demand */}
      {cp.resume_url && (
        <ResumePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          resumeUrl={getPublicStorageUrl('resumes', cp.resume_url)}
        />
      )}
    </div>
  );
}
