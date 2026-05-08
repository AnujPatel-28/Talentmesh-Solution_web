'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import Toast from '@/components/ui/Toast';
import styles from '../../../shared-dashboard.module.css';

// ─── Icons ──────────────────────────────────────────────────────────────────────
const IC = {
    Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    Filter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9v7l4 2v-9L22 3z" /></svg>,
    MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    Dots: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>,
    Briefcase: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
};

export default function AdvancedSearchPage() {
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
            const results = res.data?.jobs || res.data || [];
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

    const handleCopyLink = (jobId: string) => {
        const url = `${window.location.origin}/dashboard/candidate/${params.role_id}/jobs/${jobId}`;
        navigator.clipboard.writeText(url);
        setToast({ message: 'Job link copied to clipboard!', type: 'success' });
    };

    return (
        <div className={styles.dash} style={{ gap: '2rem' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {/* Search Header */}
            <div className={styles.pageHeader} style={{ alignItems: 'center' }}>
                <div style={{ 
                    flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                    padding: '0.25rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}>
                    <IC.Search />
                    <input 
                        type="text" 
                        placeholder="Search by title, skills, or company..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            width: '100%', border: 'none', padding: '1rem', outline: 'none',
                            fontSize: '1rem', background: 'transparent'
                        }}
                    />
                </div>
                <button 
                   onClick={() => router.back()}
                   className={styles.secondaryBtn}
                   style={{ padding: '1.2rem 1.5rem', borderRadius: '16px' }}
                >
                    Cancel
                </button>
            </div>

            <div className={styles.searchGrid}>
                {/* Filters Sidebar */}
                <aside style={{ 
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', 
                    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Filters</h3>
                        <button onClick={() => { setSearchQuery(''); setActiveFilters({ type: '', location: '', experience: '' }); }} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Reset</button>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.fieldLabel}>Job Type</label>
                        <select 
                            className={styles.premiumSelect}
                            value={activeFilters.type}
                            onChange={(e) => setActiveFilters({ ...activeFilters, type: e.target.value })}
                        >
                            <option value="">All Types</option>
                            <option value="Full-Time">Full-Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Remote">Remote</option>
                            <option value="Internship">Internship</option>
                        </select>
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
                        <select 
                            className={styles.premiumSelect}
                            value={activeFilters.experience}
                            onChange={(e) => setActiveFilters({ ...activeFilters, experience: e.target.value })}
                        >
                            <option value="">Any Experience</option>
                            <option value="entry">Entry Level (0-2y)</option>
                            <option value="mid">Mid Level (2-5y)</option>
                            <option value="senior">Senior Level (5y+)</option>
                        </select>
                    </div>
                </aside>

                {/* Search Results */}
                <main>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Showing <strong>{jobs.length}</strong> jobs matching your criteria</p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ height: '140px', background: '#f8fafc', borderRadius: '16px', opacity: 0.6 }} />
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
                            <h3 style={{ color: '#0f172a' }}>No matches found</h3>
                            <p style={{ color: '#64748b' }}>Try broadening your search or clear some filters.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {jobs.map(job => (
                                <div key={job.id} style={{ 
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', 
                                    padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    transition: 'transform 0.2s', cursor: 'pointer'
                                }} onClick={() => router.push(`/dashboard/candidate/${params.role_id}/jobs/${job.id}`)}>
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '60px', height: '60px', borderRadius: '12px', background: '#f1f5f9',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                        }}>
                                            {job.companies?.logo_url ? <img src={job.companies.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{job.title}</h3>
                                            <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.88rem', display: 'flex', gap: '0.75rem' }}>
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
                                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem' }}
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
        </div>
    );
}
