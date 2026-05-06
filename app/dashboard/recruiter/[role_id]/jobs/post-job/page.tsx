"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../../shared-dashboard.module.css';
import { invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

const IC = {
    check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>,
    chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
};

export default function PostJobPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        type: 'Full-time',
        salary_min: '',
        salary_max: '',
        industry: '',
        description: '',
        requirements: '',
        skills_required: [] as string[]
    });

    const steps = [
        { id: 1, label: 'Basics' },
        { id: 2, label: 'Content' },
        { id: 3, label: 'Budget' },
        { id: 4, label: 'Preview' }
    ];

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
                    company_id: user.company_id,
                }
            });

            if (error) throw error;
            router.push(`/dashboard/recruiter/${user.id}/jobs`);
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to post job');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <div className={styles.postJobPage}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Post a New Job</h1>
                <p className={styles.pageSub}>Step {step} of 4: {steps.find(s => s.id === step)?.label}</p>
            </div>

            {/* Stepper Header */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {steps.map(s => (
                    <div key={s.id} style={{ 
                        flex: 1, height: 4, borderRadius: 2, 
                        background: s.id <= step ? 'var(--primary-blue)' : '#e2e8f0' 
                    }} />
                ))}
            </div>

            <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #eef0f2', minHeight: 400 }}>
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className={styles.formGroup}>
                            <label>Job Title</label>
                            <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Lead Developer" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Location</label>
                            <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Remote or Bengaluru" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Job Type</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contract</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className={styles.formGroup}>
                            <label>Job Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={6} placeholder="What is the role about?" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Requirements (one per line)</label>
                            <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={4} placeholder="What skills are needed?" />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className={styles.formGroup}>
                            <label>Annual Salary (Min)</label>
                            <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange} placeholder="e.g. 1200000" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Annual Salary (Max)</label>
                            <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange} placeholder="e.g. 1800000" />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Salary values in INR. This helps us match candidates with appropriate expectations.</p>
                    </div>
                )}

                {step === 4 && (
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Review Job Posting</h3>
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div><strong>Title:</strong> {formData.title}</div>
                            <div><strong>Location:</strong> {formData.location}</div>
                            <div><strong>Type:</strong> {formData.type}</div>
                            <div><strong>Budget:</strong> ₹{(parseInt(formData.salary_min)/100000).toFixed(1)}L - ₹{(parseInt(formData.salary_max)/100000).toFixed(1)}L PA</div>
                        </div>
                    </div>
                )}

                <div className={styles.formActions} style={{ marginTop: '2rem' }}>
                    {step > 1 && <button onClick={prevStep} className={styles.cancelBtn}>Back</button>}
                    {step < 4 ? (
                        <button onClick={nextStep} className={styles.submitBtn} style={{ marginLeft: 'auto' }}>Next</button>
                    ) : (
                        <button onClick={handleSubmit} className={styles.submitBtn} disabled={isLoading} style={{ marginLeft: 'auto' }}>
                            {isLoading ? 'Posting...' : 'Publish Job'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
