"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import { useAuth } from '@/lib/auth/AuthContext';
import type { CandidateSettingsBundle } from '@/lib/candidate-profile';

import styles from '../onboarding.module.css';

type Step = 1 | 2 | 3;

const STEP_LABELS: [string, string, string] = ['Basic Info', 'Professional', 'Preferences'];
const JOB_TYPES = ['Remote', 'Hybrid', 'Onsite'];

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

function getFirstIncompleteStep(data: CandidateSettingsBundle): Step {
    if (!data.profile.name || !data.profile.phone || !data.profile.location) {
        return 1;
    }

    if (!data.candidateProfile.headline || data.candidateProfile.skills.length === 0 || !data.candidateProfile.education) {
        return 2;
    }

    return 3;
}

export default function CandidateOnboardingPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<CandidateSettingsBundle>(EMPTY_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [locationInput, setLocationInput] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('/api/candidate-profile', { cache: 'no-store' });
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || 'Failed to load onboarding data');
                }

                setForm(payload);
                setStep(getFirstIncompleteStep(payload));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load onboarding data';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const canContinue = useMemo(() => {
        if (step === 1) {
            return Boolean(form.profile.name.trim() && form.profile.phone.trim() && form.profile.location.trim());
        }

        if (step === 2) {
            return Boolean(
                form.candidateProfile.headline.trim() &&
                form.candidateProfile.skills.length > 0 &&
                form.candidateProfile.education.trim()
            );
        }

        return Boolean(
            form.candidateProfile.salary_min !== null &&
            form.candidateProfile.salary_max !== null &&
            form.candidateProfile.preferred_locations.length > 0 &&
            form.candidateProfile.job_type
        );
    }, [form, step]);

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

    const handleContinue = async () => {
        if (!user?.id) {
            setError('You must be logged in before finishing setup.');
            return;
        }

        if (step < 3) {
            setStep((prev) => (prev + 1) as Step);
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const response = await fetch('/api/candidate-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Failed to save onboarding');
            }

            const roleId = payload.profile?.role_id || form.profile.role_id || user?.role_id || 'candidate';
            router.push(`/dashboard/candidate/${roleId}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save onboarding';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
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
                        <input type="number" className={styles.optionalInput} value={form.candidateProfile.experience_years ?? ''} onChange={(event) => updateCandidate('experience_years', event.target.value === '' ? null : Number(event.target.value))} placeholder="3" />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Education</label>
                        <textarea className={styles.optionalInput} value={form.candidateProfile.education} onChange={(event) => updateCandidate('education', event.target.value)} placeholder="B.Tech in Computer Science" rows={4} style={{ resize: 'vertical' }} />
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
                            <input type="number" className={styles.optionalInput} value={form.candidateProfile.salary_min ?? ''} onChange={(event) => updateCandidate('salary_min', event.target.value === '' ? null : Number(event.target.value))} placeholder="50000" />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Salary Max</label>
                            <input type="number" className={styles.optionalInput} value={form.candidateProfile.salary_max ?? ''} onChange={(event) => updateCandidate('salary_max', event.target.value === '' ? null : Number(event.target.value))} placeholder="90000" />
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
                        <select className={styles.optionalInput} value={form.candidateProfile.job_type} onChange={(event) => updateCandidate('job_type', event.target.value)}>
                            <option value="">Select job type</option>
                            {JOB_TYPES.map((jobType) => (
                                <option key={jobType} value={jobType}>{jobType}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => setStep((prev) => (prev - 1) as Step)} disabled={step === 1 || isSaving} type="button">
                    Back
                </button>
                <button className={styles.nextBtn} onClick={handleContinue} disabled={!canContinue || isSaving} type="button">
                    {step === 3 ? (isSaving ? 'Saving...' : 'Finish Setup') : 'Continue'}
                </button>
            </div>
        </div>
    );
}
