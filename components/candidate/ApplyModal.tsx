'use client';
import React, { useState, useEffect, useRef } from 'react';
import { applyToJob } from '@/lib/api/applications';

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    companyName: string;
    onSuccess: () => void;
}

export default function ApplyModal({ 
    isOpen, 
    onClose, 
    jobId, 
    jobTitle, 
    companyName, 
    onSuccess 
}: ApplyModalProps) {
    const [coverLetter, setCoverLetter] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setCoverLetter('');
            setError(null);
            setSuccess(false);
            document.body.style.overflow = 'hidden';
            modalRef.current?.focus();
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, loading]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await applyToJob(jobId, coverLetter || undefined);
        
        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } else {
            setError(result.error || 'An unexpected error occurred.');
            setLoading(false);
        }
    };

    return (
        <div 
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem'
            }}
            onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                style={{
                    background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    overflow: 'hidden', position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Apply for Role</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>{jobTitle} at {companyName}</p>
                    {!loading && !success && (
                        <button 
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '1.25rem', right: '1.25rem',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                padding: '0.5rem', color: '#94a3b8'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem' }}>
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{ 
                                width: '64px', height: '64px', borderRadius: '50%', background: '#f0fdf4',
                                color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem', fontSize: '2rem'
                            }}>✓</div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>Application Submitted!</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>We&apos;ll be in touch with any updates.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                    Cover Letter (Optional)
                                </label>
                                <textarea 
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value.slice(0, 1500))}
                                    placeholder="Why are you a good fit for this role?"
                                    style={{
                                        width: '100%', minHeight: '160px', padding: '0.75rem', borderRadius: '10px',
                                        border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem',
                                        resize: 'vertical', outline: 'none'
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: error ? '#ef4444' : '#94a3b8' }}>{error || ''}</span>
                                    <span style={{ fontSize: '0.75rem', color: coverLetter.length >= 1400 ? '#f59e0b' : '#94a3b8' }}>
                                        {coverLetter.length}/1500
                                    </span>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '0.875rem', border: 'none', borderRadius: '12px',
                                    background: loading ? '#94a3b8' : 'var(--primary-blue)', color: 'white',
                                    fontSize: '1rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                                    transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)'
                                }}
                            >
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
