'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import CenteredLoader from '@/components/ui/CenteredLoader';
import styles from '../../candidate/onboarding/onboarding.module.css';

export default function RecruiterOnboarding() {
  const { user, refreshUser, isInitialized, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (isInitialized && user) {
      setName(user.name || '');
    }
  }, [user, isInitialized]);

  const completeOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name || !jobTitle) {
      setError('Please provide your name and job title.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Update general profile
      const { error: profileError } = await insforge.database
        .from('profiles')
        .update({
          name,
          onboarding_completed: true,
          onboarding_step: 1
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Upsert recruiter profile
      const { error: recruiterError } = await insforge.database
        .from('recruiter_profiles')
        .upsert({
          id: user.id,
          job_title: jobTitle,
          department: department,
        }, { onConflict: 'id' });
        
      if (recruiterError) {
        await insforge.database.from('recruiter_profiles').update({ 
          job_title: jobTitle, 
          department 
        }).eq('id', user.id);
      }

      await refreshUser();
      router.push(returnUrl || '/dashboard/recruiter/pending-approval');
      
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
        <p className={styles.subtitle}>Let's set up your recruiter profile.</p>
      </div>

      <div className={styles.stepContainer}>
        <form onSubmit={completeOnboarding}>
          <h2 className={styles.stepTitle}>Tell us about your role</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name *</label>
            <input 
              type="text" 
              className={styles.input} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="John Doe" 
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Job Title *</label>
            <input 
              type="text" 
              className={styles.input} 
              value={jobTitle} 
              onChange={e => setJobTitle(e.target.value)} 
              placeholder="e.g. Senior Technical Recruiter" 
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Department</label>
            <input 
              type="text" 
              className={styles.input} 
              value={department} 
              onChange={e => setDepartment(e.target.value)} 
              placeholder="e.g. Engineering" 
            />
          </div>

          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
