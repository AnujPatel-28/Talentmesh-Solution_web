"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './CandidateProfileDrawer.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { format, differenceInMonths, differenceInYears } from 'date-fns';
import { toast } from 'react-hot-toast';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface CandidateProfileDrawerProps {
    candidateId: string | null;
    onClose: () => void;
}

const IC = {
    x: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
    mapPin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
    briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    graduation: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5L2 10L12 15L22 10Z" /><path d="M6 12V17C6 17 8 19 12 19C16 19 18 17 18 17V12" /></svg>
};

export default function CandidateProfileDrawer({ candidateId, onClose }: CandidateProfileDrawerProps) {
    const { user } = useAuth();
    const [candidate, setCandidate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleDownload = async (url: string, filename: string) => {
        try {
            const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://sytk3jgv.ap-southeast.insforge.app';
            let targetUrl = url;
            if (url.startsWith(insforgeUrl)) {
                targetUrl = url.replace(insforgeUrl, `${window.location.origin}/api/v1/remote`);
            }

            const response = await fetch(targetUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Failed to download document:', err);
            window.open(url, '_blank');
        }
    };

    const handleView = async (url: string) => {
        try {
            const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://sytk3jgv.ap-southeast.insforge.app';
            let targetUrl = url;
            if (url.startsWith(insforgeUrl)) {
                targetUrl = url.replace(insforgeUrl, `${window.location.origin}/api/v1/remote`);
            }

            const response = await fetch(targetUrl);
            const blob = await response.blob();

            let mimeType = blob.type;

            try {
                const buffer = await blob.slice(0, 4).arrayBuffer();
                const arr = new Uint8Array(buffer);
                if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
                    mimeType = 'application/pdf';
                } else if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
                    mimeType = 'image/png';
                } else if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
                    mimeType = 'image/jpeg';
                } else if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
                    mimeType = 'image/gif';
                }
            } catch (readErr) {
                console.error('Failed to parse magic bytes:', readErr);
            }

            if (mimeType === 'application/octet-stream' || !mimeType) {
                if (url.toLowerCase().endsWith('.pdf')) {
                    mimeType = 'application/pdf';
                } else if (url.toLowerCase().endsWith('.png')) {
                    mimeType = 'image/png';
                } else if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
                    mimeType = 'image/jpeg';
                } else {
                    mimeType = 'application/pdf';
                }
            }

            const fileBlob = new Blob([blob], { type: mimeType });
            const blobUrl = window.URL.createObjectURL(fileBlob);
            window.open(blobUrl, '_blank');
        } catch (err) {
            console.error('Failed to view document:', err);
            window.open(url, '_blank');
        }
    };
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimer = useRef<NodeJS.Timeout | null>(null);

    const fetchCandidate = useCallback(async (id: string) => {
        setLoading(true);
        try {
            let res = await insforge.database
                .from('candidate_profiles')
                .select(`
                    *,
                    profile:profiles(id, full_name:name, email, avatar_url, created_at),
                    applications:applications(
                        id, status, applied_at, updated_at, job_id,
                        apply_type, resume_url, screening_answers,
                        job:jobs(id, title, recruiter_id)
                    )
                `)
                .eq('user_id', id)
                .single();

            // Handle session expiry and retry
            const err = res.error as any;
            if (err && (err.statusCode === 401 || err.message?.includes('token') || err.error === 'AUTH_UNAUTHORIZED')) {
                console.warn('[fetchCandidate] Access token expired, attempting to refresh...');
                const { refreshAccessToken } = await import('@/lib/insforge');
                const newToken = await refreshAccessToken();
                if (newToken) {
                    console.log('[fetchCandidate] Refresh successful, retrying query...');
                    res = await insforge.database
                        .from('candidate_profiles')
                        .select(`
                            *,
                            profile:profiles(id, full_name:name, email, avatar_url, created_at),
                            applications:applications(
                                id, status, applied_at, updated_at, job_id,
                                apply_type, resume_url, screening_answers,
                                job:jobs(id, title, recruiter_id)
                            )
                        `)
                        .eq('user_id', id)
                        .single();
                }
            }

            if (res.error) throw res.error;
            const data = res.data;

            // Filter applications to only those belonging to this recruiter
            if (data?.applications) {
                data.applications = data.applications.filter((app: any) => app.job?.recruiter_id === user?.id);
            }

            setCandidate(data);

            // Fetch recruiter notes
            let noteRes = await insforge.database
                .from('recruiter_candidate_notes')
                .select('notes, updated_at')
                .eq('recruiter_id', user?.id)
                .eq('candidate_id', id)
                .maybeSingle();

            const noteErr = noteRes.error as any;
            if (noteErr && (noteErr.statusCode === 401 || noteErr.message?.includes('token') || noteErr.error === 'AUTH_UNAUTHORIZED')) {
                const { refreshAccessToken } = await import('@/lib/insforge');
                const newToken = await refreshAccessToken();
                if (newToken) {
                    noteRes = await insforge.database
                        .from('recruiter_candidate_notes')
                        .select('notes, updated_at')
                        .eq('recruiter_id', user?.id)
                        .eq('candidate_id', id)
                        .maybeSingle();
                }
            }

            const noteData = noteRes.data;
            setNotes(noteData?.notes || '');
            if (noteData?.updated_at) setLastSaved(new Date(noteData.updated_at));

        } catch (err) {
            console.error('Error fetching candidate:', err);
            toast.error('Failed to load candidate profile');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (candidateId) {
            fetchCandidate(candidateId);
            setActiveTab('overview');
        } else {
            setCandidate(null);
            setNotes('');
        }
    }, [candidateId, fetchCandidate]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNotes(val);

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            saveNotes(val);
        }, 1000);
    };

    const saveNotes = async (content: string) => {
        if (!user?.id || !candidateId) return;
        setIsSaving(true);
        try {
            let res = await insforge.database
                .from('recruiter_candidate_notes')
                .upsert({
                    recruiter_id: user.id,
                    candidate_id: candidateId,
                    notes: content,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'recruiter_id,candidate_id' });

            const err = res.error as any;
            if (err && (err.statusCode === 401 || err.message?.includes('token') || err.error === 'AUTH_UNAUTHORIZED')) {
                const { refreshAccessToken } = await import('@/lib/insforge');
                const newToken = await refreshAccessToken();
                if (newToken) {
                    res = await insforge.database
                        .from('recruiter_candidate_notes')
                        .upsert({
                            recruiter_id: user.id,
                            candidate_id: candidateId,
                            notes: content,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'recruiter_id,candidate_id' });
                }
            }

            if (res.error) throw res.error;
            setLastSaved(new Date());
        } catch (err) {
            console.error('Save notes error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const updateApplicationStatus = async (appId: string, status: string) => {
        try {
            let res = await insforge.database
                .from('applications')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', appId);

            const err = res.error as any;
            if (err && (err.statusCode === 401 || err.message?.includes('token') || err.error === 'AUTH_UNAUTHORIZED')) {
                const { refreshAccessToken } = await import('@/lib/insforge');
                const newToken = await refreshAccessToken();
                if (newToken) {
                    res = await insforge.database
                        .from('applications')
                        .update({ status, updated_at: new Date().toISOString() })
                        .eq('id', appId);
                }
            }

            if (res.error) throw res.error;

            setCandidate((prev: any) => ({
                ...prev,
                applications: prev.applications.map((app: any) => 
                    app.id === appId ? { ...app, status } : app
                )
            }));
            toast.success(`Status updated to ${status}`);
        } catch (err) {
            console.error('Update status error:', err);
            toast.error('Failed to update status');
        }
    };

    const getMatchClass = (score: number) => {
        if (score >= 80) return styles.match_strong;
        if (score >= 60) return styles.match_good;
        return styles.match_partial;
    };

    const getMatchLabel = (score: number) => {
        if (score >= 80) return `Strong Match ${score}%`;
        if (score >= 60) return `Good Match ${score}%`;
        return `Partial Match ${score}%`;
    };

    const formatDateRange = (start: string, end: string | null) => {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        const diffY = differenceInYears(endDate, startDate);
        const diffM = differenceInMonths(endDate, startDate) % 12;
        
        let dur = '';
        if (diffY > 0) dur += `${diffY} yr${diffY > 1 ? 's' : ''} `;
        if (diffM > 0) dur += `${diffM} mo${diffM > 1 ? 's' : ''}`;
        
        return `${format(startDate, 'MMM yyyy')} – ${end ? format(endDate, 'MMM yyyy') : 'Present'} · ${dur.trim()}`;
    };

    if (!candidateId) return null;

    return (
        <>
            <div 
                className={`${styles.backdrop} ${candidateId ? styles.backdropVisible : ''}`} 
                onClick={onClose}
            />
            <aside className={`${styles.drawer} ${candidateId ? styles.open : ''}`}>
                <button type="button" className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); onClose(); }}>{IC.x}</button>
                
                <div className={styles.drawerHeader}>
                    {loading ? (
                        <div className={styles.profileSummary}>
                            <div className={`${styles.avatar} ${styles.skeleton}`} />
                            <div className={`${styles.fullName} ${styles.skeleton}`} style={{ width: '150px', height: '24px' }} />
                            <div className={`${styles.headline} ${styles.skeleton}`} style={{ width: '100px', height: '16px' }} />
                        </div>
                    ) : (
                        <div className={styles.profileSummary}>
                            <div className={styles.avatar}>
                                {candidate?.profile?.full_name?.split(' ').map((n: any) => n[0]).join('')}
                            </div>
                            <h2 className={styles.fullName}>{candidate?.profile?.full_name}</h2>
                            <p className={styles.headline}>{candidate?.headline || 'Full Stack Developer'}</p>
                            <div className={styles.meta}>
                                <span>{IC.mapPin} {candidate?.location || 'Remote'}</span>
                                <span>{IC.mail} {candidate?.profile?.email}</span>
                            </div>
                            <div className={`${styles.matchBadge} ${getMatchClass(candidate?.ai_match_score || 0)}`}>
                                {getMatchLabel(candidate?.ai_match_score || 0)}
                            </div>
                            
                            <div className={styles.actionRow}>
                                <Link href={`/recruiter/nvite/compose?candidate_id=${candidateId}`} className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                                    Send NVite
                                </Link>
                                <button className={styles.actionBtn}>Schedule Interview</button>
                                <button className={styles.actionBtn}>Shortlist</button>
                                <button className={styles.actionBtn}>View Full Profile</button>
                            </div>
                        </div>
                    )}
                </div>

                <nav className={styles.drawerTabs}>
                    {['overview', 'experience', 'skills', 'applications', 'notes'].map(t => (
                        <button 
                            key={t}
                            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(t)}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </nav>

                <div className={styles.drawerBody}>
                    {loading ? (
                        <div className={styles.skeletonList}>
                            {[1,2,3].map(i => <div key={i} className={`${styles.skeleton}`} style={{ height: '80px', marginBottom: '16px' }} />)}
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className={styles.tabContent}>
                                    <span className={styles.sectionTitle}>Summary</span>
                                    <p className={styles.desc}>{candidate?.summary || "Highly motivated professional with experience in developing scalable web applications and leading cross-functional teams. Passionate about AI and cloud architecture."}</p>
                                    
                                    <div className={styles.statsGrid}>
                                        <div className={styles.statItem}>
                                            <span className={styles.statVal}>{candidate?.experience_years || 0} Years</span>
                                            <span className={styles.statLab}>Experience</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statVal}>{(candidate?.education && candidate.education[0]?.degree) || 'B.Tech'}</span>
                                            <span className={styles.statLab}>Education</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statVal}>{candidate?.skills?.length || 0}</span>
                                            <span className={styles.statLab}>Skills</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statVal}>{candidate?.applications?.length || 0}</span>
                                            <span className={styles.statLab}>Applications</span>
                                        </div>
                                    </div>

                                    <span className={styles.sectionTitle}>Top Skills</span>
                                    <div className={styles.skillPills}>
                                        {candidate?.skills?.map((s: string) => <span key={s} className={styles.skillTag}>{s}</span>)}
                                    </div>

                                    <span className={styles.sectionTitle}>Resume</span>
                                    {candidate?.resume_url ? (
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            <button
                                                type="button"
                                                className={styles.resumeBtn}
                                                style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}
                                                onClick={() => handleView(candidate.resume_url)}
                                            >
                                                📄 View Resume
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.resumeBtn}
                                                style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', background: '#eff6ff' }}
                                                onClick={() => handleDownload(candidate.resume_url, 'candidate_resume.pdf')}
                                            >
                                                📥 Download
                                            </button>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No resume uploaded</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'experience' && (
                                <div className={styles.tabContent}>
                                    <span className={styles.sectionTitle}>{IC.briefcase} Experience</span>
                                    <div className={styles.timeline}>
                                        {(candidate?.work_history || []).map((exp: any, i: number) => (
                                            <div key={i} className={styles.timelineItem}>
                                                <div className={styles.timelineMarker} />
                                                <span className={styles.companyName}>{exp.company}</span>
                                                <div className={styles.roleTitle}>{exp.role}</div>
                                                <div className={styles.dateRange}>{formatDateRange(exp.startDate, exp.endDate)}</div>
                                                <p className={styles.desc}>{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <span className={styles.sectionTitle} style={{ marginTop: '32px' }}>{IC.graduation} Education</span>
                                    <div className={styles.timeline}>
                                        {(candidate?.education || []).map((edu: any, i: number) => (
                                            <div key={i} className={styles.timelineItem}>
                                                <div className={styles.timelineMarker} />
                                                <span className={styles.companyName}>{edu.institution}</span>
                                                <div className={styles.roleTitle}>{edu.degree} in {edu.field}</div>
                                                <div className={styles.dateRange}>{edu.year}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'skills' && (
                                <div className={styles.tabContent}>
                                    <span className={styles.sectionTitle}>All Skills</span>
                                    <div className={styles.skillPills}>
                                        {[...(candidate?.skills || [])].sort().map((s: string) => (
                                            <span key={s} className={styles.skillTag}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'applications' && (
                                <div className={styles.tabContent}>
                                    <span className={styles.sectionTitle}>Active Applications</span>
                                    {candidate?.applications?.length > 0 ? candidate.applications.map((app: any) => (
                                        <div key={app.id} className={styles.appItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div className={styles.appHead}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{app.job?.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Applied {format(new Date(app.applied_at), 'MMM dd, yyyy')}</div>
                                                </div>
                                                <span className={`${styles.appStatus} ${styles[`status_${app.status}`]}`}>{app.status}</span>
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', alignItems: 'center' }}>
                                                <span>Method: <strong style={{ textTransform: 'uppercase', color: app.apply_type === 'manual' ? '#f59e0b' : '#3b82f6' }}>{app.apply_type || 'quick'}</strong></span>
                                                {app.resume_url && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            type="button"
                                                            style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                                                            onClick={() => handleView(app.resume_url)}
                                                        >
                                                            View Resume ↗
                                                        </button>
                                                        <span style={{ color: '#cbd5e1' }}>|</span>
                                                        <button
                                                            type="button"
                                                            style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                                                            onClick={() => handleDownload(app.resume_url, 'application_resume.pdf')}
                                                        >
                                                            Download 📥
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {app.screening_answers && Object.keys(app.screening_answers).length > 0 && (
                                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.25rem' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Screening Answers</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        {Object.entries(app.screening_answers).map(([question, answer]: any) => (
                                                            <div key={question} style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                                                                <div style={{ color: '#64748b', fontWeight: 500 }}>Q: {question}</div>
                                                                <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '1px' }}>A: {String(answer)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ marginTop: '0.25rem' }}>
                                                <CustomSelect
                                                    value={app.status}
                                                    onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                                    options={[
                                                        { label: 'Screening', value: 'screening' },
                                                        { label: 'Shortlisted', value: 'shortlisted' },
                                                        { label: 'Interviewing', value: 'interviewing' },
                                                        { label: 'Offer', value: 'offer' },
                                                        { label: 'Rejected', value: 'rejected' }
                                                    ]}
                                                    className={styles.statusSelect}
                                                />
                                            </div>
                                        </div>
                                    )) : (
                                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No applications for your jobs found.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className={styles.tabContent}>
                                    <span className={styles.sectionTitle}>Recruiter Notes (Private)</span>
                                    <textarea 
                                        className={styles.notesArea}
                                        placeholder="Add private notes about this candidate... these are only visible to you."
                                        value={notes}
                                        onChange={handleNotesChange}
                                    />
                                    {(isSaving || lastSaved) && (
                                        <div className={styles.saveIndicator}>
                                            {isSaving ? 'Saving...' : <>{IC.check} Saved {lastSaved && format(lastSaved, 'HH:mm:ss')}</>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}
