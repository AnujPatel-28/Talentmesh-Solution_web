'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import CenteredLoader from '@/components/ui/CenteredLoader';
import styles from './onboarding.module.css';

function CandidateOnboardingContent() {
  const { user, refreshUser, isInitialized, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return');

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (isInitialized && user) {
      setName(user.name || '');
      setLocation(user.location || '');
      setPhone(user.phone || '');
    }
  }, [user, isInitialized]);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !skills.includes(newSkill)) {
        setSkills([...skills, newSkill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const nextStep = async () => {
    setError('');
    if (step === 1) {
      if (!name || !location) {
        setError('Please provide your name and location.');
        return;
      }
    } else if (step === 2) {
      if (skills.length < 1) {
        setError('Please add at least 1 skill.');
        return;
      }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');

    try {
      // 1. Update general profile
      const { error: profileError } = await insforge.database
        .from('profiles')
        .update({
          name,
          location,
          phone,
          completed_onboarding: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Upsert candidate profile
      const { error: candidateError } = await insforge.database
        .from('candidate_profiles')
        .upsert({
          id: user.id,
          skills,
        }, { onConflict: 'id' });
        
      if (candidateError) {
        // If upsert fails, try a direct update
        await insforge.database.from('candidate_profiles').update({ skills }).eq('id', user.id);
      }

      await refreshUser();
      router.push(returnUrl || '/dashboard/candidate/home');
      
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete onboarding');
      setSubmitting(false);
    }
  };

  if (!isInitialized || isLoading) {
    return <CenteredLoader label="Loading..." />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome to TalentMesh</h1>
        <p className={styles.subtitle}>Let's set up your profile to find the best matches.</p>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>
        <span className={styles.progressText}>Step {step} of 3</span>
      </div>

      <div className={styles.stepContainer}>
        {step === 1 && (
          <div>
            <h2 className={styles.stepTitle}>Tell us about yourself</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name *</label>
              <input 
                type="text" 
                className={styles.input} 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="John Doe" 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Location *</label>
              <input 
                type="text" 
                className={styles.input} 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                placeholder="City, Country" 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input 
                type="tel" 
                className={styles.input} 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="+1 (555) 000-0000" 
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className={styles.stepTitle}>What are your skills?</h2>
            <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>Add at least 1 skill (press Enter to add)</p>
            
            <div className={styles.formGroup}>
              <input 
                type="text" 
                className={styles.input} 
                value={skillInput} 
                onChange={e => setSkillInput(e.target.value)} 
                onKeyDown={handleAddSkill}
                placeholder="e.g. React, Python, Project Management" 
              />
              
              <div className={styles.skillsContainer}>
                {skills.map(skill => (
                  <span key={skill} className={styles.skillBadge}>
                    {skill}
                    <button type="button" className={styles.removeSkill} onClick={() => removeSkill(skill)}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className={styles.stepTitle}>Upload your resume</h2>
            <p className={styles.subtitle} style={{ marginBottom: '1.5rem' }}>We'll parse this to fill out the rest of your profile.</p>
            
            <div className={styles.fileUpload}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div>Click to upload or drag and drop</div>
              <div className={styles.fileText}>PDF, DOCX up to 5MB</div>
            </div>
          </div>
        )}

        {error && <div className={styles.errorText}>{error}</div>}

        <div className={styles.actions}>
          {step > 1 ? (
            <button className={styles.btnSecondary} onClick={() => setStep(s => s - 1)} disabled={submitting}>Back</button>
          ) : (
            <div></div> // empty div for flex spacing
          )}

          {step < 3 ? (
            <button className={styles.btnPrimary} onClick={nextStep} disabled={submitting}>Next Step</button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className={styles.btnSkip} onClick={completeOnboarding} disabled={submitting}>
                Skip for now
              </button>
              <button className={styles.btnPrimary} onClick={completeOnboarding} disabled={submitting}>
                {submitting ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CandidateOnboarding() {
  return (
    <Suspense fallback={<CenteredLoader label="Loading..." />}>
      <CandidateOnboardingContent />
    </Suspense>
  );
}
