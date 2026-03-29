'use client';
import React, { useState, useEffect, useRef } from 'react';
import { applyToJob } from '@/lib/api/applications';

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    companyName: string;
    candidateProfile?: {
        name: string;
        email: string;
        headline?: string;
        skills?: string[];
    } | null;
    onSuccess: (appId?: string) => void;
}

export default function ApplyModal({ 
    isOpen, 
    onClose, 
    jobId, 
    jobTitle, 
    companyName, 
    candidateProfile,
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
                onSuccess(result.applicationId);
                onClose();
            }, 1500);
        } else {
            setError(result.error || 'An unexpected error occurred.');
        }
        setLoading(false);
    };

    return (
        <div 
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem'
            }}
            onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                style={{
                    background: 'white', borderRadius: '24px', width: '100%', maxWidth: '540px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                    overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid #f1f5f9', position: 'relative', background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Quick Apply</h2>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0.4rem 0 0' }}>{jobTitle} <span style={{ color: '#cbd5e1' }}>at</span> {companyName}</p>
                    {!loading && !success && (
                        <button 
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '1.5rem', right: '1.5rem',
                                background: '#f1f5f9', border: 'none', cursor: 'pointer',
                                padding: '0.5rem', color: '#64748b', borderRadius: '50%', display: 'flex', transition: 'all 0.2s'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: '2rem' }}>
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <div style={{ 
                                width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4',
                                color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem', fontSize: '2.5rem', boxShadow: '0 0 0 10px #f0fdf4'
                            }}>✓</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>Application Sent!</h3>
                            <p style={{ color: '#64748b', fontSize: '1rem' }}>Your details have been shared with the recruiter.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Profile Summary Section */}
                            {candidateProfile && (
                                <div style={{ 
                                    background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem',
                                    border: '1px dashed #cbd5e1', display: 'flex', gap: '1rem', alignItems: 'center'
                                }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 }}>
                                        {candidateProfile.name[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{candidateProfile.name}</h4>
                                            <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, background: '#eff6ff', padding: '2px 8px', borderRadius: '100px' }}>PRE-FILLED</span>
                                        </div>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>{candidateProfile.headline || 'Product Professional'}</p>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                                    Tell the recruiter why you&apos;re a great fit
                                </label>
                                <textarea 
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value.slice(0, 1500))}
                                    placeholder="Write a short note about your experience and interest..."
                                    style={{
                                        width: '100%', minHeight: '140px', padding: '1rem', borderRadius: '14px',
                                        border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.95rem',
                                        resize: 'vertical', outline: 'none', transition: 'border-color 0.2s',
                                        background: '#fafafa'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: error ? '#ef4444' : '#94a3b8', fontWeight: 500 }}>{error || ''}</span>
                                    <span style={{ fontSize: '0.8rem', color: coverLetter.length >= 1400 ? '#f59e0b' : '#94a3b8', fontWeight: 500 }}>
                                        {coverLetter.length}/1500
                                    </span>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '1rem', border: 'none', borderRadius: '14px',
                                    background: loading ? '#94a3b8' : 'var(--primary-blue)', color: 'white',
                                    fontSize: '1.05rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                                    boxShadow: loading ? 'none' : '0 10px 15px -3px rgba(37, 99, 235, 0.25)',
                                    transform: loading ? 'none' : 'translateY(0)'
                                }}
                                onMouseEnter={(e) => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { if(!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                {loading ? 'Processing...' : 'Send Application'}
                            </button>
                            
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '1.25rem' }}>
                                By clicking apply, your full profile will be shared with the employer.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
