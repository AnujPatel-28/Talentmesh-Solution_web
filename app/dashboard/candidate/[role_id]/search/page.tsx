'use client';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth/AuthContext';
import AlertModal from '@/components/candidate/AlertModal';
import { insforge, invokeFunction } from '@/lib/insforge';
import styles from '../../../shared-dashboard.module.css';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';

// ─── Icons ──────────────────────────────────────────────────────────────────────
const IC = {
    Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    Filter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9v7l4 2v-9L22 3z" /></svg>,
    MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    Dots: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>,
    Briefcase: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
};

function AdvancedSearchPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [activeFilters, setActiveFilters] = useState({
        type: searchParams.get('type') || '',
        location: searchParams.get('location') || '',
        experience: searchParams.get('exp') || '',
    });
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await invokeFunction('jobs', {
                method: 'GET',
                queries: {
                    search: searchQuery || undefined,
                    type: activeFilters.type || undefined,
                    location: activeFilters.location || undefined,
                }
            });
            const results = res.data?.data || res.data?.jobs || (Array.isArray(res.data) ? res.data : []);
            setJobs(results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, activeFilters]);

    useEffect(() => {
        const timer = setTimeout(fetchJobs, 400);
        return () => clearTimeout(timer);
    }, [fetchJobs]);

    useEffect(() => {
        const handleBack = (e: Event) => {
            if (isAlertModalOpen) {
                e.preventDefault();
                setIsAlertModalOpen(false);
            }
        };
        window.addEventListener('app:back', handleBack);
        return () => window.removeEventListener('app:back', handleBack);
    }, [isAlertModalOpen]);

    const handleCopyLink = (jobId: string) => {
        const url = `${window.location.origin}/dashboard/candidate/${params.role_id}/jobs/${jobId}`;
        navigator.clipboard.writeText(url);
        setToast({ message: 'Job link copied to clipboard!', type: 'success' });
    };

    const handleSaveAlert = async (formData: any) => {
        if (!user) return;
        try {
            const { error } = await insforge.database
                .from('job_alerts')
                .insert([{
                    ...formData,
                    candidate_id: user.id,
                    label: formData.label || `${formData.keywords || 'Jobs'} in ${formData.location || 'Anywhere'}`
                }]);

            if (error) throw error;
            setIsAlertModalOpen(false);
            setToast({ message: 'Job alert saved successfully!', type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ message: 'Failed to save alert', type: 'error' });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '5rem 2rem 4rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Search Header */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                <div style={{ 
                    flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
                    background: 'white', border: '1px solid #CBD2DB', borderRadius: '9999px',
                    padding: '0.25rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                }}>
                    <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center' }}><IC.Search /></span>
                    <input 
                        type="text" 
                        placeholder="Search by job title, skills, or company..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            width: '100%', border: 'none', padding: '0.75rem 1rem', outline: 'none',
                            fontSize: '15px', background: 'transparent', color: '#12263A'
                        }}
                    />
                </div>
                <button 
                   onClick={() => router.back()}
                   style={{ 
                       padding: '10px 24px', 
                       borderRadius: '9999px',
                       border: '1px solid #CBD2DB',
                       background: '#ffffff',
                       color: '#475569',
                       fontSize: '14px',
                       fontWeight: 600,
                       cursor: 'pointer',
                       transition: 'all 0.15s ease'
                   }}
                   onMouseOver={e => {
                       e.currentTarget.style.backgroundColor = '#f8fafc';
                       e.currentTarget.style.borderColor = '#94a3b8';
                   }}
                   onMouseOut={e => {
                       e.currentTarget.style.backgroundColor = '#ffffff';
                       e.currentTarget.style.borderColor = '#CBD2DB';
                   }}
                >
                    Cancel
                </button>
            </div>

            <div className={styles.searchGrid}>
                {/* Filters Sidebar */}
                <aside style={{ 
                    background: 'white', 
                    border: '1px solid #e2e5ea', 
                    borderRadius: '16px', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#12263A' }}>Filters</h3>
                        <button 
                            onClick={() => { setSearchQuery(''); setActiveFilters({ type: '', location: '', experience: '' }); }} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#007BFF', 
                                fontWeight: 700, 
                                cursor: 'pointer', 
                                fontSize: '13px',
                                transition: 'color 0.15s'
                            }}
                            onMouseOver={e => e.currentTarget.style.color = '#0056b3'}
                            onMouseOut={e => e.currentTarget.style.color = '#007BFF'}
                        >
                            Reset
                        </button>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.fieldLabel}>Job Type</label>
                        <CustomSelect 
                            className={styles.premiumSelect}
                            value={activeFilters.type || ''}
                            onChange={(e) => setActiveFilters({ ...activeFilters, type: e.target.value })}
                            options={[
                                { label: 'All Types', value: '' },
                                { label: 'Full-Time', value: 'Full-Time' },
                                { label: 'Contract', value: 'Contract' },
                                { label: 'Remote', value: 'Remote' },
                                { label: 'Internship', value: 'Internship' }
                            ]}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.fieldLabel}>Location</label>
                        <div className={styles.inputIconWrap}>
                            <span className={styles.inputIcon}><IC.MapPin /></span>
                            <input 
                                className={styles.premiumInput} 
                                placeholder="City or Remote" 
                                value={activeFilters.location}
                                onChange={(e) => setActiveFilters({ ...activeFilters, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.fieldLabel}>Experience Level</label>
                        <CustomSelect 
                            className={styles.premiumSelect}
                            value={activeFilters.experience || ''}
                            onChange={(e) => setActiveFilters({ ...activeFilters, experience: e.target.value })}
                            options={[
                                { label: 'Any Experience', value: '' },
                                { label: 'Entry Level (0-2y)', value: 'entry' },
                                { label: 'Mid Level (2-5y)', value: 'mid' },
                                { label: 'Senior Level (5y+)', value: 'senior' }
                            ]}
                        />
                    </div>
                </aside>

                {/* Search Results */}
                <main>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Showing <strong>{jobs.length}</strong> jobs matching your criteria</p>
                        <button 
                            className={styles.secondaryBtn}
                            onClick={() => setIsAlertModalOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
                        >
                            <IC.Bell /> Save This Search
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <style>{`
                                @keyframes sk-pulse {
                                    0%, 100% { opacity: 0.6; }
                                    50% { opacity: 1; }
                                }
                                .sk-pulse {
                                    animation: sk-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                                    background-color: #e2e8f0;
                                }
                            `}</style>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ 
                                    background: 'white', border: '1px solid #e2e5ea', borderRadius: '12px', 
                                    padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flex: 1 }}>
                                        <div className="sk-pulse" style={{ width: '60px', height: '60px', borderRadius: '12px' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                            <div className="sk-pulse" style={{ width: '45%', height: '16px', borderRadius: '4px' }} />
                                            <div className="sk-pulse" style={{ width: '25%', height: '12px', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div className="sk-pulse" style={{ width: '70px', height: '24px', borderRadius: '100px' }} />
                                        <div className="sk-pulse" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '5rem 2rem', 
                            background: '#ffffff', 
                            border: '2px dashed #cbd5e1', 
                            borderRadius: '16px', 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)' 
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
                            <h3 style={{ color: '#12263A', fontWeight: 800, fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>No matches found</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Try broadening your search or clear some filters.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <style>{`
                                @keyframes fadeIn {
                                    from { opacity: 0; transform: translateY(6px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            `}</style>
                            {jobs.map(job => (
                                <div 
                                    key={job.id} 
                                    style={{ 
                                        background: 'white', 
                                        border: '1px solid #e2e5ea', 
                                        borderRadius: '12px', 
                                        padding: '1.25rem 1.5rem', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        transition: 'all 0.15s ease-in-out', 
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                        animation: 'fadeIn 0.3s ease-out'
                                    }}
                                    onClick={() => router.push(`/dashboard/candidate/${params.role_id}/jobs/${job.id}`)}
                                    onMouseOver={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                                        e.currentTarget.style.borderColor = '#007BFF';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                                        e.currentTarget.style.borderColor = '#e2e5ea';
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '60px', height: '60px', borderRadius: '10px', background: '#f1f5f9',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                            border: '1px solid #e2e5ea'
                                        }}>
                                            {job.companies?.logo_url ? <img src={getPublicStorageUrl('company-logos', job.companies.logo_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#12263A' }}>{job.title}</h3>
                                            <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.88rem', display: 'flex', gap: '0.75rem', fontWeight: 500 }}>
                                                <span>{job.companies?.name}</span>
                                                <span>•</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><IC.MapPin /> {job.location}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.4rem 0.8rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>{job.type}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleCopyLink(job.id); }}
                                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                                            onMouseOver={e => e.currentTarget.style.color = '#475569'}
                                            onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                                        >
                                            <IC.Dots />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {isAlertModalOpen && (
                <AlertModal 
                    alert={{
                        keywords: searchQuery,
                        location: activeFilters.location,
                        job_type: activeFilters.type ? [activeFilters.type] : [],
                        experience_level: activeFilters.experience
                    }}
                    onClose={() => setIsAlertModalOpen(false)}
                    onSave={handleSaveAlert}
                />
            )}
        </div>
    );
}

export default function AdvancedSearchPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading Search...</div>}>
            <AdvancedSearchPageContent />
        </Suspense>
    );
}
