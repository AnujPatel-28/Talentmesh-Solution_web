'use client';
import React, { useState, useEffect, useRef } from 'react';
import { insforge, invokeFunction } from '@/lib/insforge';

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    companyName: string;
    candidateProfile?: {
        name: string;
        email: string;
        phone: string;
        location: string;
        headline: string;
        skills: string[];
        experienceYears: number;
        education: string;
        resumeUrl: string;
        profileStrength: number;
        linkedinUrl: string;
        githubUrl: string;
        portfolioUrl: string;
    } | null;
    jobSkills?: string[];
    onSuccess: (appId?: string) => void;
}

export default function ApplyModal({
    isOpen,
    onClose,
    jobId,
    jobTitle,
    companyName,
    candidateProfile,
    jobSkills = [],
    onSuccess
}: ApplyModalProps) {
    const [applyType, setApplyType] = useState<'quick' | 'manual'>('quick');
    const [coverLetter, setCoverLetter] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Manual form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [headline, setHeadline] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [education, setEducation] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [skillsString, setSkillsString] = useState('');

    // Screening answers
    const [sponsorshipRequired, setSponsorshipRequired] = useState<'Yes' | 'No'>('No');
    const [relocationInterest, setRelocationInterest] = useState<'Yes' | 'No'>('Yes');
    const [dynamicExp, setDynamicExp] = useState('');
    const [joiningDate, setJoiningDate] = useState('');

    // Resume file for manual upload
    const [manualResumeFile, setManualResumeFile] = useState<File | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);
    const mainSkill = jobSkills.length > 0 ? jobSkills[0] : 'React';

    useEffect(() => {
        if (isOpen) {
            setCoverLetter('');
            setError(null);
            setSuccess(false);
            document.body.style.overflow = 'hidden';
            modalRef.current?.focus();

            // Default to Quick Apply if profile strength > 80%, else Manual Apply
            const strength = candidateProfile?.profileStrength || 0;
            setApplyType(strength > 80 ? 'quick' : 'manual');

            // Pre-fill manual apply form values from candidateProfile
            if (candidateProfile) {
                setFullName(candidateProfile.name || '');
                setEmail(candidateProfile.email || '');
                setPhone(candidateProfile.phone || '');
                setLocation(candidateProfile.location || '');
                setHeadline(candidateProfile.headline || '');
                setExperienceYears(candidateProfile.experienceYears ? String(candidateProfile.experienceYears) : '');
                setEducation(candidateProfile.education || '');
                setPortfolioUrl(candidateProfile.portfolioUrl || '');
                setLinkedinUrl(candidateProfile.linkedinUrl || '');
                setGithubUrl(candidateProfile.githubUrl || '');
                setSkillsString(candidateProfile.skills ? candidateProfile.skills.join(', ') : '');
            } else {
                setFullName('');
                setEmail('');
                setPhone('');
                setLocation('');
                setHeadline('');
                setExperienceYears('');
                setEducation('');
                setPortfolioUrl('');
                setLinkedinUrl('');
                setGithubUrl('');
                setSkillsString('');
            }

            // Reset other states
            setManualResumeFile(null);
            setSponsorshipRequired('No');
            setRelocationInterest('Yes');
            setDynamicExp('');
            setJoiningDate('');
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, candidateProfile]);

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

        try {
            let finalResumeUrl = candidateProfile?.resumeUrl || '';

            if (applyType === 'manual') {
                // Validate manual inputs
                if (!fullName.trim() || !email.trim() || !phone.trim() || !location.trim() || !headline.trim() || !experienceYears.trim() || !education.trim() || !skillsString.trim()) {
                    throw new Error('Please fill in all required manual apply fields.');
                }

                if (!dynamicExp.trim() || !joiningDate.trim()) {
                    throw new Error('Please answer all screening questions.');
                }

                // 1. Upload custom resume if selected
                if (manualResumeFile) {
                    const sessionRes = await insforge.auth.getCurrentUser();
                    const userId = sessionRes.data?.user?.id;
                    if (!userId || userId === 'project-admin-with-api-key') {
                        throw new Error('User session not found. Please log in again.');
                    }
                    const path = `${userId}/${Date.now()}_${manualResumeFile.name}`;
                    const { data: uploadData, error: uploadError } = await insforge.storage
                        .from('resumes')
                        .upload(path, manualResumeFile);
                    if (uploadError) {
                        throw new Error(uploadError.message || 'Resume upload failed.');
                    }
                    finalResumeUrl = uploadData?.url || '';
                } else if (!finalResumeUrl) {
                    throw new Error('Please upload a resume for your application.');
                }

                    // 2. Update candidate's database profile (profiles and candidate_profiles)
                    const sessionRes = await insforge.auth.getCurrentUser();
                    const userId = sessionRes.data?.user?.id;
                    if (userId && userId !== 'project-admin-with-api-key') {
                        // Calculate profile completion percentage
                        let strength = 0;
                        if (fullName) strength += 10;
                        if (email) strength += 10;
                        if (phone) strength += 10;
                        if (location) strength += 10;
                        if (headline) strength += 15;
                        if (experienceYears) strength += 15;
                        if (education) strength += 15;
                        if (finalResumeUrl) strength += 15;

                        const skillsList = skillsString
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);

                        // Use the candidate-profile Edge Function to properly upsert both tables
                        const { error: profileError } = await invokeFunction('candidate-profile', {
                            method: 'PUT',
                            body: {
                                profile: {
                                    name: fullName,
                                    phone: phone || '',
                                    location: location || '',
                                },
                                candidateProfile: {
                                    headline,
                                    skills: skillsList,
                                    experience_years: Number(experienceYears) || null,
                                    education,
                                    resume_url: finalResumeUrl || '',
                                    linkedin_url: linkedinUrl || '',
                                    github_url: githubUrl || '',
                                    portfolio_url: portfolioUrl || '',
                                    profile_strength: strength
                                }
                            }
                        });

                        if (profileError) {
                            console.error('Failed to update candidate profile during apply:', profileError);
                        }
                    }
            } else {
                // Quick Apply - verify they have a resume
                if (!finalResumeUrl) {
                    throw new Error('Your profile is missing a resume. Please upload a resume using Manual Apply.');
                }
            }

            // 3. Construct screening answers map
            const screeningAnswers = applyType === 'manual' ? {
                'Do you require sponsorship?': sponsorshipRequired,
                'Can you relocate?': relocationInterest,
                [`Years of ${mainSkill} experience?`]: Number(dynamicExp) || 0,
                'Expected joining date?': joiningDate
            } : null;

            // 4. Submit application via Edge Function
            const result = await invokeFunction('candidate-applications', {
                method: 'POST',
                body: {
                    jobId,
                    coverLetter: coverLetter || undefined,
                    applyType,
                    resumeUrl: finalResumeUrl || undefined,
                    screeningAnswers: screeningAnswers || undefined
                }
            });

            if (result.error) {
                throw new Error(result.error.message || 'Application submission failed.');
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess(result.data?.application?.id);
                onClose();
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
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
                    background: 'white', borderRadius: '24px', width: '100%', maxWidth: '580px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                    overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid #f1f5f9', position: 'relative', background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Apply for Job</h2>
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
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
                            {/* Toggle Selector */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setApplyType('quick')}
                                    style={{
                                        flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px',
                                        background: applyType === 'quick' ? 'white' : 'transparent',
                                        color: applyType === 'quick' ? 'var(--primary-blue)' : '#475569',
                                        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                        boxShadow: applyType === 'quick' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Quick Apply
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setApplyType('manual')}
                                    style={{
                                        flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px',
                                        background: applyType === 'manual' ? 'white' : 'transparent',
                                        color: applyType === 'manual' ? 'var(--primary-blue)' : '#475569',
                                        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                        boxShadow: applyType === 'manual' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Manual Apply
                                </button>
                            </div>

                            {/* Warning if profile is incomplete in Quick Apply */}
                            {candidateProfile && candidateProfile.profileStrength <= 80 && applyType === 'quick' && (
                                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                    <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 500 }}>
                                        Your profile strength is <strong>{candidateProfile.profileStrength}%</strong>. We suggest using <strong>Manual Apply</strong> to fill out missing details and increase your profile strength.
                                    </div>
                                </div>
                            )}

                            {/* Quick Apply Form Section */}
                            {applyType === 'quick' && (
                                <div>
                                    {candidateProfile && (
                                        <div style={{
                                            background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem',
                                            border: '1px dashed #cbd5e1', display: 'flex', gap: '1rem', alignItems: 'center'
                                        }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 }}>
                                                {candidateProfile.name?.[0]}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{candidateProfile.name}</h4>
                                                    <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, background: '#eff6ff', padding: '2px 8px', borderRadius: '100px' }}>PRE-FILLED</span>
                                                </div>
                                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>{candidateProfile.headline || 'Product Professional'}</p>
                                                {candidateProfile.resumeUrl ? (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        Resume linked from profile
                                                    </div>
                                                ) : (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444', fontWeight: 500 }}>
                                                        No resume found on profile. Please upload one via Manual Apply.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                                            Tell the recruiter why you&apos;re a great fit (Optional)
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
                                    </div>
                                </div>
                            )}

                            {/* Manual Apply Form Section */}
                            {applyType === 'manual' && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: '1.25rem',
                                    maxHeight: '45vh', overflowY: 'auto', paddingRight: '0.5rem',
                                    marginBottom: '1.5rem', border: '1px solid #f1f5f9',
                                    padding: '1rem', borderRadius: '16px', background: '#fafcff'
                                }}>

                                    {/* Personal Info */}
                                    <div>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.75rem 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Details</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Full Name *</label>
                                                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Email *</label>
                                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Phone Number *</label>
                                                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Location *</label>
                                                <input type="text" required value={location} onChange={e => setLocation(e.target.value)} placeholder="Mumbai, India" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Info */}
                                    <div>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.75rem 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional Details</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Headline / Role *</label>
                                                <input type="text" required value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Software Engineer" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Experience (Years) *</label>
                                                    <input type="number" required value={experienceYears} onChange={e => setExperienceYears(e.target.value)} min="0" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Education *</label>
                                                    <input type="text" required value={education} onChange={e => setEducation(e.target.value)} placeholder="e.g. B.Tech in CS" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Skills (comma-separated) *</label>
                                                <input type="text" required value={skillsString} onChange={e => setSkillsString(e.target.value)} placeholder="React, TypeScript, Node.js" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Portfolio URL</label>
                                                    <input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>LinkedIn</label>
                                                    <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>GitHub</label>
                                                    <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resume Upload */}
                                    <div>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.75rem 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resume</h3>
                                        {candidateProfile?.resumeUrl && !manualResumeFile ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 500 }}>Using existing resume from profile</span>
                                                <button type="button" onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = '.pdf';
                                                    input.onchange = (e: any) => {
                                                        if (e.target.files?.[0]) setManualResumeFile(e.target.files[0]);
                                                    };
                                                    input.click();
                                                }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Change</button>
                                            </div>
                                        ) : (
                                            <div style={{ background: 'white', border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                                <input type="file" accept=".pdf" onChange={e => setManualResumeFile(e.target.files?.[0] || null)} style={{ fontSize: '0.8rem', cursor: 'pointer' }} />
                                                {manualResumeFile && (
                                                    <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 600 }}>
                                                        ✓ Selected: {manualResumeFile.name} ({(manualResumeFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Screening Questions */}
                                    <div>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.75rem 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screening Questions</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Do you require sponsorship? *</span>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                        <input type="radio" name="sponsorship" value="Yes" checked={sponsorshipRequired === 'Yes'} onChange={() => setSponsorshipRequired('Yes')} /> Yes
                                                    </label>
                                                    <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                        <input type="radio" name="sponsorship" value="No" checked={sponsorshipRequired === 'No'} onChange={() => setSponsorshipRequired('No')} /> No
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Can you relocate if required? *</span>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                        <input type="radio" name="relocate" value="Yes" checked={relocationInterest === 'Yes'} onChange={() => setRelocationInterest('Yes')} /> Yes
                                                    </label>
                                                    <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                        <input type="radio" name="relocate" value="No" checked={relocationInterest === 'No'} onChange={() => setRelocationInterest('No')} /> No
                                                    </label>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', alignItems: 'center' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                                                    Years of {mainSkill} experience? *
                                                </label>
                                                <input type="number" required value={dynamicExp} onChange={e => setDynamicExp(e.target.value)} min="0" step="0.5" style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', alignItems: 'center' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Expected joining date? *</label>
                                                <input type="date" required value={joiningDate} onChange={e => setJoiningDate(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cover Letter */}
                                    <div>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cover Letter Note</h3>
                                        <textarea
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value.slice(0, 1500))}
                                            placeholder="Write a short note about your experience and interest..."
                                            style={{
                                                width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '8px',
                                                border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.85rem',
                                                resize: 'vertical', outline: 'none', background: '#fafafa'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
                                    {error}
                                </div>
                            )}

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
                                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                {loading ? 'Processing...' : 'Send Application'}
                            </button>

                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '1.25rem', marginBottom: 0 }}>
                                By clicking apply, your updated profile details and resume will be shared with the employer.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
