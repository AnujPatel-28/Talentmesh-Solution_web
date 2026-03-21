"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../recruiter.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

export default function PostJobPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        type: 'Full-time',
        salary: '',
        industry: '',
        description: '',
        requirements: '',
        responsibilities: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.company_id) {
            alert('Please complete your company profile onboarding first.');
            return;
        }
        setIsLoading(true);

        try {
            const { error } = await insforge.database
                .from('jobs')
                .insert([{
                    title: formData.title,
                    location: formData.location,
                    type: formData.type,
                    salary: formData.salary,
                    industry: formData.industry,
                    description: formData.description,
                    requirements: formData.requirements.split('\n').filter((r: string) => r.trim()),
                    responsibilities: formData.responsibilities.split('\n').filter((r: string) => r.trim()),
                    company_id: user.company_id,
                    logo: 'https://logo.clearbit.com/talentmesh.ai', 
                    color: '#0D47A1',
                    status: 'active'
                }]);

            if (error) throw error;

            // Log activity
            await insforge.database.from('activity').insert([{
                user_id: user.id || '',
                description: `Posted a new job: ${formData.title}`,
                type: 'job_post'
            }]);

            router.push('/dashboard/recruiter/jobs');
        } catch (err) {
            console.error(err);
            alert('Failed to post job');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className={styles.postJobPage}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Post a New Job</h1>
                <p className={styles.pageSub}>Reach the best talent with TalentMesh AI matching.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.jobForm}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>Job Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Senior Product Designer" required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Location</label>
                        <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. New York or Remote" required />
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Job Type</label>
                        <select name="type" value={formData.type} onChange={handleChange}>
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Industry</label>
                        <input name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. Technology" required />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Job Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Describe the role and the team..." required />
                </div>

                <div className={styles.formGroup}>
                    <label>Requirements (one per line)</label>
                    <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={4} placeholder="e.g. 5+ years of experience in..." required />
                </div>

                <div className={styles.formGroup}>
                    <label>Responsibilities (one per line)</label>
                    <textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} rows={4} placeholder="e.g. Leading the design team..." required />
                </div>

                <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? 'Posting...' : 'Post Job'}
                    </button>
                </div>
            </form>
        </div>
    );
}
