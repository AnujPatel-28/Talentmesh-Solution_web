"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../../../shared-dashboard.module.css';
import { insforge, invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

const IC = {
    sparkles: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3l1.912 5.813h6.112l-4.944 3.593 1.888 5.794-4.968-3.612-4.968 3.612 1.888-5.794-4.944-3.593h6.112z" /></svg>,
    chevronLeft: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
};

export default function RecruiterJobDetails() {
    const { job_id, role_id } = useParams();
    const router = useRouter();
    const [job, setJob] = useState<any>(null);
    const [questions, setQuestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchJob() {
            try {
                const { data } = await insforge.database
                    .from('jobs')
                    .select('*, applications(*)')
                    .eq('id', job_id)
                    .single();
                setJob(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchJob();
    }, [job_id]);

    const generateQuestions = async () => {
        setIsGenerating(true);
        try {
            const { data } = await invokeFunction('interview-generator', {
                method: 'POST',
                body: { jobId: job_id }
            });
            if (data?.questions) setQuestions(data.questions);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading job details...</div>;
    if (!job) return <div>Job not found</div>;

    // Ownership check
    if (job.recruiter_id !== user?.id) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: 20, border: '1px solid #eef0f2' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Access Denied</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>You don't have permission to view this job posting.</p>
                <button 
                    onClick={() => router.push(`/dashboard/recruiter/${role_id}/jobs`)}
                    style={{ padding: '0.8rem 1.5rem', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}
                >
                    Back to My Jobs
                </button>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 600 }}>
                {IC.chevronLeft} Back to Jobs
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: 20, border: '1px solid #eef0f2', marginBottom: '1.5rem' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{job.title}</h1>
                        <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            <span>{job.location}</span> • <span>{job.type}</span> • <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Job Description</h3>
                            <p style={{ color: '#475569', lineHeight: 1.6 }}>{job.description}</p>
                        </div>
                    </div>

                    {/* AI Questions Section */}
                    <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{IC.sparkles} AI Interview Questions</h3>
                            <button onClick={generateQuestions} disabled={isGenerating} style={{ padding: '0.6rem 1.25rem', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isGenerating ? 'Generating...' : 'Regenerate Questions'}
                            </button>
                        </div>

                        {questions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {questions.map((q, i) => (
                                    <div key={i} style={{ background: 'white', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.95rem' }}>
                                        <strong>Q{i + 1}:</strong> {q}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                <p>No questions generated yet. Click the button to get AI-powered interview prompts tailored to this role.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: 20, border: '1px solid #eef0f2' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Applicants Overview</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-blue)' }}>{job.applications?.length || 0}</div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Total applications received</p>
                        <button style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                            View All Applicants
                        </button>
                    </div>

                    <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: 20, border: '1px solid #fef3c7', color: '#92400e' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Job Status</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                            <span style={{ width: 8, height: 8, background: '#f59e0b', borderRadius: '50%' }} />
                            {job.status || 'Active'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
