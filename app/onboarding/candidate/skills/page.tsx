"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import styles from '../../onboarding.module.css';

const SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
    'Java', 'C++', 'Go', 'Rust', 'SQL', 'MongoDB',
    'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST APIs', 'Git',
    'Figma', 'Adobe XD', 'UI/UX', 'HTML/CSS', 'Tailwind',
    'Machine Learning', 'Data Analysis', 'Excel', 'Tableau', 'Power BI',
    'SEO', 'Content Writing', 'Social Media', 'Google Ads', 'Salesforce',
    'Agile', 'Communication', 'Leadership',
];

export default function CandidateSkills() {
    const { user } = useAuth();
    const [selected, setSelected] = useState<string[]>([]);
    const [customSkill, setCustomSkill] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            const { data, error } = await insforge.database
                .from('candidate_profiles')
                .select('skills')
                .eq('id', user.id)
                .single();

            if (data?.skills) {
                setSelected(data.skills);
            }
        };
        fetchInitialData();
    }, [user]);

    const toggle = (skill: string) => {
        setSelected(prev =>
            prev.includes(skill) ? prev.filter(x => x !== skill) : [...prev, skill]
        );
    };

    const addCustomSkill = (e: React.FormEvent) => {
        e.preventDefault();
        if (customSkill.trim() && !selected.includes(customSkill.trim())) {
            setSelected(prev => [...prev, customSkill.trim()]);
            setCustomSkill('');
        }
    };

    const handleContinue = async () => {
        if (!user) return;
        if (selected.length < 3) return;

        setIsLoading(true);
        try {
            const { error } = await insforge.database
                .from('candidate_profiles')
                .upsert({
                    id: user.id,
                    skills: selected,
                });

            if (error) throw error;
            router.push('/onboarding/candidate/interests');
        } catch (err) {
            console.error('Error saving skills:', err);
            alert('Failed to save skills. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <OnboardingStepper currentStep={1} />

            <div className={styles.header}>
                <h1 className={styles.title}>Your skills</h1>
                <p className={styles.subtitle}>Select at least 3 skills that match your expertise</p>
            </div>

            <div className={styles.tagWrap}>
                {SKILLS.map(skill => (
                    <button
                        key={skill}
                        type="button"
                        className={`${styles.tag} ${selected.includes(skill) ? styles.tagSelected : ''}`}
                        onClick={() => toggle(skill)}
                    >
                        {skill}
                    </button>
                ))}
                {/* Dynamically added custom skills */}
                {selected.filter(s => !SKILLS.includes(s)).map(skill => (
                    <button
                        key={skill}
                        type="button"
                        className={`${styles.tag} ${styles.tagSelected}`}
                        onClick={() => toggle(skill)}
                    >
                        {skill} (custom)
                    </button>
                ))}
            </div>

            <form onSubmit={addCustomSkill} className={styles.customField}>
                <input
                    type="text"
                    className={styles.optionalInput}
                    placeholder="Add a custom skill..."
                    value={customSkill}
                    onChange={e => setCustomSkill(e.target.value)}
                />
                <button type="submit" className={styles.addBtn} disabled={!customSkill.trim()}>Add</button>
            </form>

            <p className={styles.counter}>{selected.length} skills selected (min. 3)</p>

            <div className={styles.actions}>
                <button className={styles.backBtn} onClick={() => router.push('/signup')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Back
                </button>
                <button 
                    className={styles.nextBtn} 
                    onClick={handleContinue} 
                    disabled={selected.length < 3 || isLoading}
                >
                    {isLoading ? 'Saving...' : 'Continue'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
            </div>
        </div>
    );
}
