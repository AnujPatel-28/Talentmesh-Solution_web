'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './postJob.module.css';
import { invokeFunction, insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { CustomSelect } from '@/components/ui/CustomSelect';

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
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
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

  useEffect(() => {
    if (!user) return;

    const fetchPrefillData = async () => {
      try {
        // 1. Fetch Company Name
        if (user.company_id) {
          const { data: company } = await insforge.database
            .from('companies')
            .select('name')
            .eq('id', user.company_id)
            .single();

          if (company?.name) {
            setFormData(prev => ({ ...prev, company_name: prev.company_name || company.name }));
          }
        }

        // 2. Fetch Recruiter Profile Location
        const { data: profile } = await insforge.database
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();

        if (profile?.location) {
          setFormData(prev => ({ ...prev, location: prev.location || profile.location }));
        }

        // 3. Fetch previous job titles posted by this recruiter
        const { data: jobs } = await insforge.database
          .from('jobs')
          .select('title')
          .eq('recruiter_id', user.id)
          .order('created_at', { ascending: false });

        const predefinedTitles = [
          'Software Engineer', 'Frontend Developer', 'Backend Developer',
          'Full Stack Developer', 'Product Manager', 'Project Manager',
          'UI/UX Designer', 'Data Scientist', 'DevOps Engineer', 'QA Tester',
          'Marketing Specialist', 'Sales Executive', 'HR Manager'
        ];

        let uniqueTitles = [...predefinedTitles];
        if (jobs && jobs.length > 0) {
          const pastTitles = jobs.map(j => j.title);
          uniqueTitles = Array.from(new Set([...uniqueTitles, ...pastTitles]));
        }
        setJobTitles(uniqueTitles);
      } catch (error) {
        console.error('Failed to pre-fill form data:', error);
      }
    };

    fetchPrefillData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'title_select') {
      if (e.target.value === '___OTHER___') {
        setIsCustomTitle(true);
        setFormData(prev => ({ ...prev, title: '' }));
      } else {
        setIsCustomTitle(false);
        setFormData(prev => ({ ...prev, title: e.target.value }));
      }
      return;
    }
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
              {!isCustomTitle ? (
                <CustomSelect
                  name="title_select"
                  className={styles.select}
                  value={formData.title}
                  onChange={handleChange}
                  options={jobTitles}
                  placeholder="Select a Job Title"
                  required
                  footer={
                    <div 
                      style={{ padding: '12px 16px', cursor: 'pointer', color: '#1e88e5', fontWeight: 600, fontSize: '14.5px', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}
                      onClick={(e) => {
                         e.stopPropagation();
                         setIsCustomTitle(true);
                         setFormData(prev => ({ ...prev, title: '' }));
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                    >
                      + Create Custom Title
                    </div>
                  }
                />
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    name="title"
                    className={styles.input}
                    style={{ flex: 1 }}
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Type custom job title..."
                    autoComplete="off"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTitle(false);
                      setFormData(prev => ({ ...prev, title: '' }));
                    }}
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 1rem', cursor: 'pointer', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Company Name</label>
              <input name="company_name" className={styles.input} value={formData.company_name} onChange={handleChange} placeholder="Your Company Name" required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <CustomSelect 
                name="category"
                className={styles.select}
                value={formData.category}
                onChange={handleChange}
                options={JOB_CATEGORIES}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Job Type</label>
              <CustomSelect 
                name="type"
                className={styles.select}
                value={formData.type}
                onChange={handleChange}
                options={JOB_TYPES}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Location</label>
              <input name="location" className={styles.input} value={formData.location} onChange={handleChange} placeholder="e.g. Remote or Bengaluru" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Openings</label>
              <CustomSelect 
                name="openings"
                className={styles.select}
                value={formData.openings}
                onChange={handleChange}
                options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
              />
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
              <span className={styles.previewValue}>₹{(parseInt(formData.salary_min) / 100000).toFixed(1)}L - ₹{(parseInt(formData.salary_max) / 100000).toFixed(1)}L PA</span>
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
