'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { createJobAction, updateJobAction } from './actions';
import { createJobSchema } from '@/lib/validation/jobs';
import Toast from '@/components/ui/Toast';

interface JobFormData {
    title: string;
    company_id: string;
    description: string;
    requirements: string;
    skills_required: string[];
    type: string;
    location: string;
    salary_min: number;
    salary_max: number;
    currency: string;
    experience_min: number;
    department: string;
    expires_at: string;
}

interface AdminJobFormProps {
    companies: { id: string, name: string }[];
    initialData?: any;
    mode?: 'create' | 'edit';
}

export default function AdminJobForm({ companies, initialData, mode = 'create' }: AdminJobFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [formData, setFormData] = useState<JobFormData>({
        title: initialData?.title || '',
        company_id: initialData?.company_id || '',
        description: initialData?.description || '',
        requirements: initialData?.requirements?.join('\n') || '',
        skills_required: initialData?.skills_required || [],
        type: initialData?.type || 'full-time',
        location: initialData?.location || '',
        salary_min: initialData?.salary_min || 0,
        salary_max: initialData?.salary_max || 0,
        currency: initialData?.currency || 'INR',
        experience_min: initialData?.experience_min || 0,
        department: initialData?.department || '',
        expires_at: initialData?.expires_at ? new Date(initialData.expires_at).toISOString().split('T')[0] : '',
    });

    const [skillInput, setSkillInput] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'salary_min' || name === 'salary_max' || name === 'experience_min' ? Number(value) : value 
        }));
        // Clear error when user changes field
        if (errors[name]) setErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleAddSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            if (!formData.skills_required.includes(skillInput.trim())) {
                setFormData(prev => ({ ...prev, skills_required: [...prev.skills_required, skillInput.trim()] }));
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setFormData(prev => ({ ...prev, skills_required: prev.skills_required.filter(s => s !== skill) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Prepare data for validation
        const validationData = {
            ...formData,
            requirements: formData.requirements.split('\n').filter((r: string) => r.trim()),
            expires_at: formData.expires_at ? new Date(formData.expires_at) : undefined,
        };

        const result = createJobSchema.safeParse(validationData);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const field = issue.path[0];
                if (typeof field === 'string' || typeof field === 'number') {
                    fieldErrors[field] = issue.message;
                }
            });
            setErrors(fieldErrors);
            setIsLoading(false);
            setToast({ message: 'Please fix the errors in the form.', type: 'error' });
            return;
        }

        try {
            // Admin created jobs are auto-approved
            const submissionData = {
                ...result.data,
                company_id: formData.company_id,
            };

            const res = mode === 'create' 
                ? await createJobAction(submissionData)
                : await updateJobAction(initialData.id, submissionData);

            if (res.success) {
                setToast({ message: `Job ${mode === 'create' ? 'created' : 'updated'} successfully!`, type: 'success' });
                setTimeout(() => router.push('/dashboard/admin/jobs'), 1500);
            } else {
                setToast({ message: res.error || 'Failed to save job', type: 'error' });
                setIsLoading(false);
            }
        } catch (err) {
            setToast({ message: 'An unexpected error occurred.', type: 'error' });
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.dash}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>{mode === 'create' ? 'Post New Job' : 'Edit Job'}</h1>
                    <p className={styles.pageSub}>Enter the job details carefully. Admin posts are live immediately.</p>
                </div>
                <button type="button" onClick={() => router.back()} className={styles.secondaryBtn}>Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.card} style={{ gap: '1.5rem' }}>
                <div className={styles.formGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Job Title</label>
                        <input 
                            name="title" 
                            className={styles.input}
                            value={formData.title} 
                            onChange={handleChange} 
                            placeholder="e.g. Senior Software Engineer"
                        />
                        {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Company</label>
                        <select 
                            name="company_id" 
                            className={styles.input}
                            value={formData.company_id} 
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a company</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.company_id && <span className={styles.errorText}>{errors.company_id}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Department</label>
                        <input 
                            name="department" 
                            className={styles.input}
                            value={formData.department} 
                            onChange={handleChange} 
                            placeholder="e.g. Engineering"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Location</label>
                        <input 
                            name="location" 
                            className={styles.input}
                            value={formData.location} 
                            onChange={handleChange} 
                            placeholder="e.g. Mumbai, MH or Remote"
                        />
                        {errors.location && <span className={styles.errorText}>{errors.location}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Job Type</label>
                        <select name="type" className={styles.input} value={formData.type} onChange={handleChange}>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Experience Required (Years)</label>
                        <input 
                            type="number"
                            name="experience_min" 
                            className={styles.input}
                            value={formData.experience_min} 
                            onChange={handleChange} 
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Salary Range ({formData.currency})</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                                type="number"
                                name="salary_min" 
                                className={styles.input}
                                value={formData.salary_min} 
                                onChange={handleChange}
                                placeholder="Min"
                            />
                            <span>-</span>
                            <input 
                                type="number"
                                name="salary_max" 
                                className={styles.input}
                                value={formData.salary_max} 
                                onChange={handleChange}
                                placeholder="Max"
                            />
                        </div>
                        {errors.salary_max && <span className={styles.errorText}>{errors.salary_max}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Currency</label>
                        <select name="currency" className={styles.input} value={formData.currency} onChange={handleChange}>
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Expiry Date (Optional)</label>
                        <input 
                            type="date"
                            name="expires_at" 
                            className={styles.input}
                            value={formData.expires_at} 
                            onChange={handleChange} 
                        />
                        {errors.expires_at && <span className={styles.errorText}>{errors.expires_at}</span>}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Job Description</label>
                    <textarea 
                        name="description" 
                        className={styles.input}
                        style={{ minHeight: '150px' }}
                        value={formData.description} 
                        onChange={handleChange} 
                        placeholder="Detailed role description..."
                    />
                    {errors.description && <span className={styles.errorText}>{errors.description}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Requirements (One per line)</label>
                    <textarea 
                        name="requirements" 
                        className={styles.input}
                        style={{ minHeight: '100px' }}
                        value={formData.requirements} 
                        onChange={handleChange} 
                        placeholder="List of requirements..."
                    />
                    {errors.requirements && <span className={styles.errorText}>{errors.requirements}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Skills Required (Press Enter to add)</label>
                    <div className={styles.tagInputContainer}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            {formData.skills_required.map((skill: string) => (
                                <span key={skill} className={styles.tag} onClick={() => removeSkill(skill)} style={{ cursor: 'pointer' }}>
                                    {skill} ✕
                                </span>
                            ))}
                        </div>
                        <input 
                            className={styles.input}
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleAddSkill}
                            placeholder="Add a skill..."
                        />
                    </div>
                </div>

                <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => router.back()} className={styles.secondaryBtn}>Cancel</button>
                    <button type="submit" className={styles.primaryBtn} disabled={isLoading}>
                        {isLoading ? 'Saving...' : mode === 'create' ? 'Post Job' : 'Update Job'}
                    </button>
                </div>
            </form>
        </div>
    );
}
