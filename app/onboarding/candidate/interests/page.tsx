"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import styles from '../../onboarding.module.css';

const JOB_TYPES = [
    'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Hybrid'
];

export default function CandidateInterests() {
    const { user } = useAuth();
    const [jobTypes, setJobTypes] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [newLocation, setNewLocation] = useState('');
    const [experienceYears, setExperienceYears] = useState<number>(0);
    const [salaryMin, setSalaryMin] = useState<number>(0);
    const [salaryMax, setSalaryMax] = useState<number>(0);
    const [openToRemote, setOpenToRemote] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            const { data, error } = await insforge.database
                .from('candidate_profiles')
                .select('job_types, preferred_locations, salary_min, salary_max, open_to_remote, experience_years')
                .eq('id', user.id)
                .single();

            if (data) {
                setJobTypes(data.job_types || []);
                setLocations(data.preferred_locations || []);
                setExperienceYears(data.experience_years || 0);
                setSalaryMin(Number(data.salary_min) || 0);
                setSalaryMax(Number(data.salary_max) || 0);
                setOpenToRemote(data.open_to_remote ?? true);
            }
        };
        fetchInitialData();
    }, [user]);

    const toggleJobType = (type: string) => {
        setJobTypes(prev =>
            prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
        );
    };

    const addLocation = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLocation.trim() && !locations.includes(newLocation.trim())) {
            setLocations(prev => [...prev, newLocation.trim()]);
            setNewLocation('');
        }
    };

    const removeLocation = (loc: string) => {
        setLocations(prev => prev.filter(x => x !== loc));
    };

    const handleContinue = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { error } = await insforge.database
                .from('candidate_profiles')
                .upsert({
                    id: user.id,
                    job_types: jobTypes,
                    preferred_locations: locations,
                    experience_years: experienceYears,
                    salary_min: salaryMin,
                    salary_max: salaryMax,
                    open_to_remote: openToRemote,
                });

            if (error) throw error;
            router.push('/onboarding/candidate/documents');
        } catch (err) {
            console.error('Error saving interests:', err);
            alert('Failed to save interests. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <OnboardingStepper currentStep={2} />

            <div className={styles.header}>
                <h1 className={styles.title}>Your preferences</h1>
                <p className={styles.subtitle}>Tell us about your ideal job</p>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Job types</h3>
                <div className={styles.tagWrap}>
                    {JOB_TYPES.map(type => (
                        <button
                            key={type}
                            type="button"
                            className={`${styles.tag} ${jobTypes.includes(type) ? styles.tagSelected : ''}`}
                            onClick={() => toggleJobType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Preferred locations</h3>
                <div className={styles.tagWrap}>
                    {locations.map(loc => (
                        <span key={loc} className={`${styles.tag} ${styles.tagSelected}`}>
                            {loc}
                            <button className={styles.removeTag} onClick={() => removeLocation(loc)}>×</button>
                        </span>
                    ))}
                </div>
                <form onSubmit={addLocation} className={styles.customField}>
                    <input
                        type="text"
                        className={styles.optionalInput}
                        placeholder="Add city or country..."
                        value={newLocation}
                        onChange={e => setNewLocation(e.target.value)}
                    />
                    <button type="submit" className={styles.addBtn} disabled={!newLocation.trim()}>Add</button>
                </form>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Professional details</h3>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Years of Experience</label>
                    <input
                        type="number"
                        className={styles.optionalInput}
                        value={experienceYears}
                        onChange={e => setExperienceYears(Number(e.target.value))}
                        placeholder="e.g. 5"
                    />
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Salary expectations (Annual)</h3>
                <div className={styles.salaryGrid}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Minimum</label>
                        <input
                            type="number"
                            className={styles.optionalInput}
                            value={salaryMin}
                            onChange={e => setSalaryMin(Number(e.target.value))}
                            placeholder="e.g. 50000"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Maximum</label>
                        <input
                            type="number"
                            className={styles.optionalInput}
                            value={salaryMax}
                            onChange={e => setSalaryMax(Number(e.target.value))}
                            placeholder="e.g. 100000"
                        />
                    </div>
                </div>
            </div>

            <div className={styles.remoteToggle}>
                <label className={styles.toggleLabel}>
                    <input
                        type="checkbox"
                        checked={openToRemote}
                        onChange={e => setOpenToRemote(e.target.checked)}
                    />
                    <span>Open to remote work</span>
                </label>
            </div>

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => router.push('/onboarding/candidate/skills')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Back
                </button>
                <button 
                    className={styles.nextBtn} 
                    onClick={handleContinue} 
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : 'Continue'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
            </div>
        </div>
    );
}
