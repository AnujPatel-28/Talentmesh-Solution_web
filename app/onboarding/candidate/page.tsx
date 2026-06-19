"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import { ResumeUploader } from '@/components/resume/ResumeUploader';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge, invokeFunction } from '@/lib/insforge';
import { getCandidateAccessState } from '@/lib/auth/candidate-access';
import type { CandidateSettingsBundle } from '@/lib/candidate-profile';
import { getDefaultCandidateProfile, normalizeCandidateProfile } from '@/lib/candidate-profile';
import { CustomSelect } from '@/components/ui/CustomSelect';

import styles from '../onboarding.module.css';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: [string, string, string, string] = ['Basic Info', 'Professional', 'Preferences', 'Documents'];
const JOB_TYPES = ['Remote', 'Hybrid', 'Onsite'];

const getEducationString = (edu: any): string => {
    if (typeof edu === 'string') return edu;
    if (Array.isArray(edu) && edu.length > 0) {
        const first = edu[0];
        if (first && first.degree) {
            return first.institution ? `${first.degree} at ${first.institution}` : first.degree;
        }
    }
    return '';
};

const EMPTY_STATE: CandidateSettingsBundle = {
    profile: {
        id: '',
        email: '',
        name: '',
        phone: '',
        location: '',
        role: null,
        completed_onboarding: false,
    },
    candidateProfile: getDefaultCandidateProfile(),
};

function getFirstIncompleteStep(data: CandidateSettingsBundle): Step {
    if (!data.profile.name || !data.profile.phone || !data.profile.location) {
        return 1;
    }

    if (!data.candidateProfile.headline || data.candidateProfile.skills.length === 0 || !getEducationString(data.candidateProfile.education).trim()) {
        return 2;
    }

    return 3;
}

export default function CandidateOnboardingPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, refreshUser } = useAuth();

    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<CandidateSettingsBundle>(EMPTY_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [locationInput, setLocationInput] = useState('');

    useEffect(() => {
        if (authLoading || !user) return;

        // 🔥 IMPORTANT: Only fetch if candidate to avoid 401s for admins/recruiters
        if (user.role !== 'candidate') return;

        const fetchProfile = async () => {
            try {
                // ── DB-authoritative gate: redirect immediately if already onboarded ──
                const accessState = await getCandidateAccessState(user.id);
                if (accessState.completedOnboarding) {
                    window.location.replace(`/dashboard/candidate/${user.id}`);
                    return;
                }

                // Fetch directly via client SDK to avoid 10-second Edge Function cold start!
                const { data: profileData, error: profileError } = await insforge.database
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    throw new Error(profileError.message);
                }

                const { data: candidateData, error: candidateError } = await insforge.database
                    .from('candidate_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                // If RLS prevents direct access, candidateError.code will be 42501
                if (candidateError && candidateError.code !== 'PGRST116') {
                    console.warn('Direct candidate query failed, falling back to edge function...', candidateError);
                    
                    const { data: fallbackData, error: fbError } = await invokeFunction('candidate-profile', { method: 'GET' });
                    if (fbError) throw new Error(fbError.message);
                    
                    const normalizedFallback: CandidateSettingsBundle = {
                        profile: {
                            id: (fallbackData as any)?.profile?.id || '',
                            email: (fallbackData as any)?.profile?.email || '',
                            name: (fallbackData as any)?.profile?.name || '',
                            phone: (fallbackData as any)?.profile?.phone || '',
                            location: (fallbackData as any)?.profile?.location || '',
                            role: (fallbackData as any)?.profile?.role || null,
                            completed_onboarding: (fallbackData as any)?.profile?.completed_onboarding || false,
                        },
                        candidateProfile: normalizeCandidateProfile((fallbackData as any)?.candidateProfile || EMPTY_STATE.candidateProfile),
                    };
                    setForm(normalizedFallback);
                    setStep(getFirstIncompleteStep(normalizedFallback));
                    return;
                }

                const combinedProfile: CandidateSettingsBundle = {
                    profile: {
                        id: profileData?.id || '',
                        email: profileData?.email || '',
                        name: profileData?.name || '',
                        phone: profileData?.phone || '',
                        location: profileData?.location || '',
                        role: profileData?.role || null,
                        completed_onboarding: profileData?.completed_onboarding || false,
                    },
                    candidateProfile: normalizeCandidateProfile(candidateData || EMPTY_STATE.candidateProfile),
                };

                setForm(combinedProfile);
                setStep(getFirstIncompleteStep(combinedProfile));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load onboarding data';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user, authLoading, router]);

    const canContinue = useMemo(() => {
        if (step === 1) {
            return Boolean(form.profile.name?.trim() && form.profile.phone?.trim() && form.profile.location?.trim());
        }

        if (step === 2) {
            return Boolean(
                (form.candidateProfile.headline?.trim() || '') &&
                (form.candidateProfile.skills?.length || 0) > 0 &&
                getEducationString(form.candidateProfile.education).trim()
            );
        }

        return Boolean(
            form.candidateProfile.salary_min !== null &&
            form.candidateProfile.salary_max !== null &&
            form.candidateProfile.preferred_locations.length > 0 &&
            form.candidateProfile.job_types && form.candidateProfile.job_types.length > 0
        );
    }, [form, step]);

    // Step 4 (Documents) is always completable — resume is optional
    const isLastStepReady = step === 4 || canContinue;

    const updateProfile = (field: 'name' | 'phone' | 'location', value: string) => {
        setForm((prev) => ({
            ...prev,
            profile: {
                ...prev.profile,
                [field]: value,
            },
        }));
    };

    const updateCandidate = (field: keyof CandidateSettingsBundle['candidateProfile'], value: unknown) => {
        setForm((prev) => ({
            ...prev,
            candidateProfile: {
                ...prev.candidateProfile,
                [field]: value,
            },
        }));
    };

    const addSkill = (event: React.FormEvent) => {
        event.preventDefault();
        const nextSkill = skillInput.trim();
        if (!nextSkill || form.candidateProfile.skills.includes(nextSkill)) {
            return;
        }

        updateCandidate('skills', [...form.candidateProfile.skills, nextSkill]);
        setSkillInput('');
    };

    const removeSkill = (skill: string) => {
        updateCandidate('skills', form.candidateProfile.skills.filter((item) => item !== skill));
    };

    const addLocation = (event: React.FormEvent) => {
        event.preventDefault();
        const nextLocation = locationInput.trim();
        if (!nextLocation || form.candidateProfile.preferred_locations.includes(nextLocation)) {
            return;
        }

        updateCandidate('preferred_locations', [...form.candidateProfile.preferred_locations, nextLocation]);
        setLocationInput('');
    };

    const removeLocation = (location: string) => {
        updateCandidate(
            'preferred_locations',
            form.candidateProfile.preferred_locations.filter((item) => item !== location),
        );
    };

    const [resume, setResume] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleContinue = async () => {
        if (!user) {
            setError('Your session has expired. Please log in again.');
            return;
        }

        if (step < 4) {
            setStep((prev) => (prev + 1) as Step);
            return;
        }

        setIsSaving(true);
        setError('');
        setUploadProgress(0);

        try {
            let finalResumeUrl = form.candidateProfile.resume_url;

            // 1. Upload resume if selected
            if (resume) {
                setUploadProgress(20);
                const path = `${user.id}/${Date.now()}_${resume.name}`;
                const { data: uploadData, error: uploadError } = await (insforge.storage
                    .from('resumes') as any)
                    .upload(path, resume, { contentType: resume.type || 'application/pdf' });

                if (uploadError) throw new Error('Resume upload failed: ' + uploadError.message);
                finalResumeUrl = uploadData?.url || null;
                setUploadProgress(40);

                if (finalResumeUrl) {
                    // Mark any existing resumes as non-default
                    await insforge.database
                        .from('candidate_resumes')
                        .update({ is_default: false })
                        .eq('candidate_id', user.id);

                    const baseName = resume.name.substring(0, resume.name.lastIndexOf('.')) || resume.name;
                    await insforge.database
                        .from('candidate_resumes')
                        .insert([{
                            candidate_id: user.id,
                            label: baseName,
                            file_url: finalResumeUrl,
                            file_name: resume.name,
                            file_size_bytes: resume.size,
                            is_default: true
                        }]);
                }
                setUploadProgress(60);
            }

            // 2. Prepare payload
            const normalizedCP = normalizeCandidateProfile({
                ...form.candidateProfile,
                resume_url: finalResumeUrl,
            });

            const payload = {
                profile: {
                    name: form.profile.name,
                    phone: form.profile.phone,
                    location: form.profile.location,
                    bio: form.profile.bio,
                },
                candidateProfile: normalizedCP
            };

            // 3. Save to API via Edge Function
            const { error: saveError } = await invokeFunction('candidate-profile', {
                method: 'PUT',
                body: payload
            });

            if (saveError) throw new Error(saveError.message);

            setUploadProgress(100);

            // Navigate immediately — don't await refreshUser() here because
            // it sets isLoading=true which re-renders this page to its loading
            // guard and can cancel the window.location.replace call.
            window.location.replace(`/dashboard/candidate/${user.id}`);

            // Refresh user state in the background so the dashboard is up-to-date
            refreshUser().catch(console.error);
        } catch (err: any) {
            setError(err.message || 'An error occurred during save');
            setUploadProgress(0);
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return <div className={styles.card}>Loading onboarding...</div>;
    }

    return (
        <div className={styles.card}>
            <OnboardingStepper currentStep={step} steps={STEP_LABELS} />

            <div className={styles.header}>
                <h1 className={styles.title}>Complete your candidate profile</h1>
                <p className={styles.subtitle}>We&apos;ll save this to your TalentMesh profile so settings and onboarding stay in sync.</p>
            </div>

            {error && (
                <div style={{ color: '#b91c1c', fontSize: '0.8rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 0.85rem' }}>
                    {error}
                </div>
            )}

            {step === 1 && (
                <div className={styles.section}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Name</label>
                        <input className={styles.optionalInput} value={form.profile.name} onChange={(event) => updateProfile('name', event.target.value)} placeholder="Your full name" />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Phone</label>
                        <input className={styles.optionalInput} value={form.profile.phone} onChange={(event) => updateProfile('phone', event.target.value)} placeholder="+1 555 123 4567" />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Location</label>
                        <input className={styles.optionalInput} value={form.profile.location} onChange={(event) => updateProfile('location', event.target.value)} placeholder="City, Country" />
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className={styles.section}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Headline</label>
                        <input className={styles.optionalInput} value={form.candidateProfile.headline} onChange={(event) => updateCandidate('headline', event.target.value)} placeholder="Frontend Developer" />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Skills</label>
                        <div className={styles.tagWrap}>
                            {form.candidateProfile.skills.map((skill) => (
                                <span key={skill} className={`${styles.tag} ${styles.tagSelected}`}>
                                    {skill}
                                    <button type="button" className={styles.removeTag} onClick={() => removeSkill(skill)}>x</button>
                                </span>
                            ))}
                        </div>
                        <form onSubmit={addSkill} className={styles.customField}>
                            <input className={styles.optionalInput} value={skillInput} onChange={(event) => setSkillInput(event.target.value)} placeholder="Add a skill" />
                            <button type="submit" className={styles.addBtn} disabled={!skillInput.trim()}>Add</button>
                        </form>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Experience (years)</label>
                        <input type="number" min="0" className={styles.optionalInput} value={form.candidateProfile.experience_years ?? ''} onChange={(event) => updateCandidate('experience_years', event.target.value === '' ? null : Number(event.target.value))} placeholder="3" />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Education</label>
                        <textarea className={styles.optionalInput} value={getEducationString(form.candidateProfile.education)} onChange={(event) => updateCandidate('education', event.target.value)} placeholder="B.Tech in Computer Science" rows={4} style={{ resize: 'vertical' }} />
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className={styles.section}>
                    {form.candidateProfile.resume_url && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '0.75rem 0.85rem', fontSize: '0.78rem', color: '#1d4ed8' }}>
                            Resume detected on your profile. If headline or skills were empty, we auto-filled lightweight suggestions from it.
                        </div>
                    )}
                    <div className={styles.salaryGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Salary Min</label>
                            <input type="number" min="0" className={styles.optionalInput} value={form.candidateProfile.salary_min ?? ''} onChange={(event) => updateCandidate('salary_min', event.target.value === '' ? null : Number(event.target.value))} placeholder="50000" />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Salary Max</label>
                            <input type="number" min="0" className={styles.optionalInput} value={form.candidateProfile.salary_max ?? ''} onChange={(event) => updateCandidate('salary_max', event.target.value === '' ? null : Number(event.target.value))} placeholder="90000" />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Preferred Locations</label>
                        <div className={styles.tagWrap}>
                            {form.candidateProfile.preferred_locations.map((location) => (
                                <span key={location} className={`${styles.tag} ${styles.tagSelected}`}>
                                    {location}
                                    <button type="button" className={styles.removeTag} onClick={() => removeLocation(location)}>x</button>
                                </span>
                            ))}
                        </div>
                        <form onSubmit={addLocation} className={styles.customField}>
                            <input className={styles.optionalInput} value={locationInput} onChange={(event) => setLocationInput(event.target.value)} placeholder="Add a preferred location" />
                            <button type="submit" className={styles.addBtn} disabled={!locationInput.trim()}>Add</button>
                        </form>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Job Type</label>
                        <CustomSelect 
                            className={styles.optionalInput} 
                            value={form.candidateProfile.job_types?.[0] || ''} 
                            onChange={(event) => updateCandidate('job_types', [event.target.value])}
                            options={JOB_TYPES}
                            placeholder="Select job type"
                        />
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className={styles.section}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Resume (PDF only)</label>
                        <ResumeUploader
                            onUpload={(f) => setResume(f)}
                            onClear={() => {
                                setResume(null);
                                updateCandidate('resume_url', '');
                            }}
                            existingUrl={form.candidateProfile.resume_url ?? undefined}
                        />
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Online Presence</h3>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>LinkedIn URL</label>
                            <input
                                type="url"
                                className={styles.optionalInput}
                                placeholder="https://linkedin.com/in/username"
                                value={form.candidateProfile.linkedin_url || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    candidateProfile: { ...form.candidateProfile, linkedin_url: e.target.value }
                                })}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>GitHub URL</label>
                            <input
                                type="url"
                                className={styles.optionalInput}
                                placeholder="https://github.com/username"
                                value={form.candidateProfile.github_url || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    candidateProfile: { ...form.candidateProfile, github_url: e.target.value }
                                })}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Portfolio URL</label>
                            <input
                                type="url"
                                className={styles.optionalInput}
                                placeholder="https://yourportfolio.com"
                                value={form.candidateProfile.portfolio_url || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    candidateProfile: { ...form.candidateProfile, portfolio_url: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => setStep((prev) => (prev - 1) as Step)} disabled={step === 1 || isSaving} type="button">
                    Back
                </button>
                <button className={styles.nextBtn} onClick={handleContinue} disabled={!isLastStepReady || isSaving} type="button">
                    {step === 4 ? (isSaving ? 'Saving...' : 'Finish Setup') : 'Continue'}
                </button>
            </div>
        </div>
    );
}
