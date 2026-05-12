'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './postJob.module.css';
import { invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

const JOB_CATEGORIES = [
  'Software Development', 'Design', 'Marketing', 'Sales', 'Customer Support', 
  'Product Management', 'Data Science', 'Human Resources', 'Finance', 'Other'
];

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote'];

export default function PostJobPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '', // Added as per requirement
    category: 'Software Development',
    type: 'Full-time',
    salary_min: '',
    salary_max: '',
    location: '',
    description: '',
    requirements: '',
    openings: '1',
    deadline: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!user?.company_id) {
      alert('Please complete your company profile onboarding first.');
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await invokeFunction('jobs', {
        method: 'POST',
        body: {
          ...formData,
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
          salary_min: parseInt(formData.salary_min) || 0,
          salary_max: parseInt(formData.salary_max) || 0,
          openings: parseInt(formData.openings) || 1,
          company_id: user.company_id,
          recruiter_id: user.id
        }
      });

      if (error) throw error;
      router.push(`/dashboard/recruiter/${params.role_id}/jobs`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to post job');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Post a New Job</h1>
          <p className={styles.subtitle}>Fill in the details to find your next great hire.</p>
        </div>

        <div className={styles.stepper}>
          {[1, 2, 3].map(s => (
            <div key={s} className={`${styles.stepBar} ${s <= step ? styles.stepBarActive : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Job Title</label>
              <input name="title" className={styles.input} value={formData.title} onChange={handleChange} placeholder="e.g. Senior Frontend Engineer" required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Company Name</label>
              <input name="company_name" className={styles.input} value={formData.company_name} onChange={handleChange} placeholder="Your Company Name" required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select name="category" className={styles.select} value={formData.category} onChange={handleChange}>
                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Job Type</label>
              <select name="type" className={styles.select} value={formData.type} onChange={handleChange}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Location</label>
              <input name="location" className={styles.input} value={formData.location} onChange={handleChange} placeholder="e.g. Remote or Bengaluru" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Openings</label>
              <input type="number" name="openings" className={styles.input} value={formData.openings} onChange={handleChange} min="1" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Salary Min (Annual INR)</label>
              <input type="number" name="salary_min" className={styles.input} value={formData.salary_min} onChange={handleChange} placeholder="e.g. 1200000" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Salary Max (Annual INR)</label>
              <input type="number" name="salary_max" className={styles.input} value={formData.salary_max} onChange={handleChange} placeholder="e.g. 2000000" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Job Description</label>
              <textarea name="description" className={styles.textarea} value={formData.description} onChange={handleChange} placeholder="Describe the role, responsibilities, and team..." />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Requirements (one per line)</label>
              <textarea name="requirements" className={styles.textarea} style={{ minHeight: 100 }} value={formData.requirements} onChange={handleChange} placeholder="Skill 1&#10;Skill 2&#10;Experience Level..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Application Deadline</label>
              <input type="date" name="deadline" className={styles.input} value={formData.deadline} onChange={handleChange} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.previewCard}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Preview Posting</h3>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Job Title</span>
              <span className={styles.previewValue}>{formData.title}</span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Company</span>
              <span className={styles.previewValue}>{formData.company_name}</span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Details</span>
              <span className={styles.previewValue}>{formData.category} · {formData.type} · {formData.location}</span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Salary</span>
              <span className={styles.previewValue}>₹{(parseInt(formData.salary_min)/100000).toFixed(1)}L - ₹{(parseInt(formData.salary_max)/100000).toFixed(1)}L PA</span>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.previewLabel}>Openings</span>
              <span className={styles.previewValue}>{formData.openings}</span>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          {step > 1 && <button className={styles.backBtn} onClick={prevStep}>Back</button>}
          <div style={{ marginLeft: 'auto' }}>
            {step < 3 ? (
              <button className={styles.nextBtn} onClick={nextStep}>Continue</button>
            ) : (
              <button className={styles.nextBtn} onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Publishing...' : 'Publish Job'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
