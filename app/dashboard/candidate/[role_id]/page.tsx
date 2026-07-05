"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/ui/Toast';
import { invokeFunction, insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';
import ApplyModal from '@/components/candidate/ApplyModal';
import { CandidateDashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { getCandidateAccessState } from '@/lib/auth/candidate-access';

/* ─── Icons ─── */
const IC = {
    search: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    mapPin: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    dollar: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    briefcase: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    check: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    bookmark: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
    ),
    bookmarkFilled: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
    ),
    share: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
    ),
    star: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" style={{ color: '#f59e0b' }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    user: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    pencil: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
};

const formatSalary = (min: number | null, max: number | null, currency: string = 'INR') => {
    if (!min && !max) return 'Competitive';
    const symbol = currency === 'USD' ? '$' : '₹';
    const kMin = min ? `${(min / 100000).toFixed(1)}L` : '';
    const kMax = max ? `${(max / 100000).toFixed(1)}L` : '';
    if (kMin && kMax) return `${symbol}${kMin}–${symbol}${kMax} PA`;
    return kMin ? `${symbol}${kMin}+ PA` : `${symbol}${kMax} PA`;
};

const formatExperience = (min: number | null, max: number | null) => {
    if (min === null && max === null) return 'Not specified';
    if (min !== null && max !== null) return `${min}–${max} years`;
    return min !== null ? `${min}+ years` : `Up to ${max} years`;
};

export default function CandidateDashboardHome({ params }: { params: Promise<{ role_id: string }> }) {
    const { role_id } = React.use(params);
    return (
        <React.Suspense fallback={<CandidateDashboardSkeleton />}>
            <CandidateDashboardInner role_id={role_id} />
        </React.Suspense>
    );
}

function CandidateDashboardInner({ role_id }: { role_id: string }) {
    const router = useRouter();
    const { user: authUser, isLoading: authLoading, refreshUser } = useAuth();
    const [onboardingVerified, setOnboardingVerified] = useState(false);

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    useEffect(() => {
        if (authLoading) return;
        if (!authUser) {
            router.replace('/login');
            return;
        }

        const userId = authUser.id;
        if (!role_id || role_id === ':role_id' || role_id === 'undefined') return;

        if ((!isUUID(role_id) || role_id !== userId) && isUUID(userId)) {
            router.replace(`/dashboard/candidate/${userId}`);
            return;
        }

        if (!isUUID(role_id)) return;

        async function verifyOnboarding() {
            const accessState = await getCandidateAccessState(userId);
            if (!accessState.completedOnboarding) {
                router.replace('/onboarding/candidate');
                return;
            }
            setOnboardingVerified(true);
        }

        verifyOnboarding();
    }, [authLoading, authUser, role_id, router]);

    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [candidateProfile, setCandidateProfile] = useState<any | null>(null);

    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('');
    const isMounted = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const querySearch = params.get('search');
            if (querySearch) {
                setSearch(querySearch);
            }
        }
    }, []);

    /* ─── Fetch candidate profile ─── */
    const fetchCandidateProfile = async () => {
        if (!authUser) return;
        try {
            const { data } = await insforge.database
                .from('candidate_profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();
            if (data) setCandidateProfile(data);
        } catch (err: any) {
            console.warn('Could not fetch candidate profile:', err?.message);
        }
    };

    /* ─── Fetch user applications ─── */
    const fetchAppliedIds = async () => {
        if (!authUser) return;
        try {
            const res = await invokeFunction('candidate-applications', { method: 'GET' });
            if (res.data?.applications) {
                setAppliedIds(new Set(res.data.applications.map((a: any) => a.job_id)));
            }
        } catch (err: any) {
            console.warn('Could not fetch applied IDs:', err?.message);
        }
    };

    /* ─── Fetch user saved jobs ─── */
    const fetchSavedIds = async () => {
        if (!authUser) return;
        try {
            const { data } = await insforge.database
                .from('saved_jobs')
                .select('job_id')
                .eq('candidate_id', authUser.id);
            if (data) {
                setSavedIds(new Set(data.map((s: any) => s.job_id)));
            }
        } catch (err: any) {
            console.warn('Could not fetch saved IDs:', err?.message);
        }
    };

    const fetchJobsList = async (pageNum: number, isNewSearch: boolean = false) => {
        if (!onboardingVerified) return;
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            const res = await invokeFunction('jobs', {
                method: 'GET',
                queries: {
                    search: search || undefined,
                    location: location || undefined,
                    page: pageNum.toString()
                }
            });

            const results = res.data?.data || res.data?.jobs || (Array.isArray(res.data) ? res.data : []);

            if (isNewSearch) {
                setJobs(results);
                if (results.length > 0) {
                    setSelectedJob(results[0]);
                } else {
                    setSelectedJob(null);
                }
            } else {
                setJobs(prev => [...prev, ...results]);
                if (!selectedJob && results.length > 0) {
                    setSelectedJob(results[0]);
                }
            }

            setHasMore(results.length === 20);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (onboardingVerified && authUser) {
            fetchAppliedIds();
            fetchSavedIds();
            fetchCandidateProfile();
        }
    }, [authUser, onboardingVerified]);

    useEffect(() => {
        if (!onboardingVerified) return;

        if (!isMounted.current) {
            isMounted.current = true;
            fetchJobsList(0, true);
            return;
        }

        const timer = setTimeout(() => {
            setPage(0);
            fetchJobsList(0, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, location, onboardingVerified]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchJobsList(next, false);
    };

    const handleToggleSave = async (jobId: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!authUser) return router.push('/login');
        const isCurrentlySaved = savedIds.has(jobId);
        try {
            if (isCurrentlySaved) {
                await insforge.database.from('saved_jobs').delete().eq('job_id', jobId).eq('candidate_id', authUser.id);
                setSavedIds(prev => {
                    const next = new Set(prev);
                    next.delete(jobId);
                    return next;
                });
                setToast({ message: 'Job removed from saved list.', type: 'info' });
            } else {
                await insforge.database.from('saved_jobs').insert({ job_id: jobId, candidate_id: authUser.id });
                setSavedIds(prev => {
                    const next = new Set(prev);
                    next.add(jobId);
                    return next;
                });
                setToast({ message: 'Job saved successfully!', type: 'success' });
            }
        } catch (err) {
            console.error('Save toggle failed:', err);
        }
    };

    const showInitialLoading = authLoading || !onboardingVerified;

    if (showInitialLoading) {
        return <CandidateDashboardSkeleton />;
    }

    const userName = authUser?.name ? authUser.name.split(' ')[0] : 'User';
    const userInitials = authUser?.name
        ? authUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    /* ─── Profile strength calculation ─── */
    const profileFields = [
        candidateProfile?.headline,
        candidateProfile?.location,
        candidateProfile?.bio,
        authUser?.avatar_url,
        candidateProfile?.skills?.length > 0,
        candidateProfile?.experience_years != null,
    ];
    const filledCount = profileFields.filter(Boolean).length;
    const profileStrength = Math.round((filledCount / profileFields.length) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ─── Top Search Bar ─── */}
            <div style={{ borderBottom: '1px solid #e2e5ea', padding: '0.75rem 2rem', backgroundColor: '#ffffff', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '0', width: '100%', maxWidth: '900px', margin: '0 auto', background: '#ffffff', border: '1px solid #CBD2DB', borderRadius: '9999px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', alignItems: 'center', overflow: 'hidden' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.25rem' }}>
                        <span style={{ color: '#6B7280', flexShrink: 0 }}>{IC.search}</span>
                        <input
                            type="text"
                            placeholder="Job title, keywords, or company"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px', height: '44px', color: '#12263A', background: 'transparent' }}
                        />
                    </div>
                    <div style={{ width: '1px', background: '#E2E5EA', height: '28px', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.25rem' }}>
                        <span style={{ color: '#6B7280', flexShrink: 0 }}>{IC.mapPin}</span>
                        <input
                            type="text"
                            placeholder='City, state, zip code, or "remote"'
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px', height: '44px', color: '#12263A', background: 'transparent' }}
                        />
                    </div>
                    <button
                        onClick={() => fetchJobsList(0, true)}
                        style={{ background: '#007BFF', color: '#ffffff', border: 'none', padding: '0 1.75rem', height: '44px', borderRadius: '9999px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', margin: '4px', flexShrink: 0, transition: 'background 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.background = '#006AE6')}
                        onMouseOut={e => (e.currentTarget.style.background = '#007BFF')}
                    >
                        Find Jobs
                    </button>
                </div>
            </div>

            {/* ─── Split Page Content ─── */}
            {/* ─── Split Page Content: 3 Columns ─── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>

                {/* ─── Column 1: Left Profile Sidebar (250px) ─── */}
                <div 
                    className="no-scrollbar"
                    style={{ width: '250px', flexShrink: 0, borderRight: '1px solid #e2e5ea', background: '#f8fafc', padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                    {/* Profile Summary Card (Vertical Short Card) */}
                    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e5ea', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                            {/* Avatar */}
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EFF6FF', color: '#007BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, border: '2px solid #BFDBFE', overflow: 'hidden' }}>
                                {authUser?.avatar_url ? (
                                    <img src={getPublicStorageUrl('avatars', authUser.avatar_url)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    userInitials
                                )}
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#12263A' }}>
                                {authUser?.name || 'Candidate'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                                {candidateProfile?.headline || candidateProfile?.current_role || 'Add your headline'}
                            </div>
                            {candidateProfile?.location && (
                                <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ width: 12, height: 12 }}>{IC.mapPin}</span>
                                    {candidateProfile.location}
                                </div>
                            )}

                            {/* Visibility Badge */}
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '12px',
                                backgroundColor: candidateProfile?.is_visible ? '#e6f4ea' : '#f1f3f4',
                                color: candidateProfile?.is_visible ? '#137333' : '#5f6368',
                                marginTop: '2px'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: candidateProfile?.is_visible ? '#137333' : '#5f6368'
                                }} />
                                {candidateProfile?.is_visible ? 'Open to opportunities' : 'Off-market'}
                            </div>

                            <Link
                                href="/candidate/dashboard/profile"
                                style={{ color: '#007BFF', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}
                            >
                                {IC.pencil} Edit Profile
                            </Link>
                        </div>

                        {/* Profile Strength */}
                        <div style={{ borderTop: '1px solid #e2e5ea', paddingTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Strength</span>
                                <span style={{ fontSize: '11px', color: '#007BFF', fontWeight: 700 }}>{profileStrength}%</span>
                            </div>
                            <div style={{ height: '4px', background: '#E2E5EA', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${profileStrength}%`, background: profileStrength >= 80 ? '#10b981' : profileStrength >= 50 ? '#007BFF' : '#f59e0b', borderRadius: '9999px' }} />
                            </div>
                        </div>
                    </div>

                    {/* Activity Stats Card */}
                    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e5ea', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#12263A', borderBottom: '1px solid #e2e5ea', paddingBottom: '6px' }}>
                            Activity Summary
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#475569' }}>Applied Jobs</span>
                            <span style={{ fontSize: '13px', fontWeight: 750, color: '#007BFF', background: '#EFF6FF', padding: '2px 8px', borderRadius: '12px' }}>
                                {appliedIds.size}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#475569' }}>Saved Jobs</span>
                            <span style={{ fontSize: '13px', fontWeight: 750, color: '#007BFF', background: '#EFF6FF', padding: '2px 8px', borderRadius: '12px' }}>
                                {savedIds.size}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#475569' }}>Profile Views</span>
                            <span style={{ fontSize: '13px', fontWeight: 750, color: '#10b981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '12px' }}>
                                12
                            </span>
                        </div>
                    </div>

                    {/* Quick Links Vertical List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link href="/candidate/dashboard/applications" style={{ display: 'block', fontSize: '13px', color: '#475569', textDecoration: 'none', background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '8px', padding: '10px 12px', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#007BFF'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e5ea'}>
                            My Applications
                        </Link>
                        <Link href="/candidate/dashboard/saved-jobs" style={{ display: 'block', fontSize: '13px', color: '#475569', textDecoration: 'none', background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '8px', padding: '10px 12px', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#007BFF'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e5ea'}>
                            Saved Jobs
                        </Link>
                        <Link href="/candidate/dashboard/resumes" style={{ display: 'block', fontSize: '13px', color: '#475569', textDecoration: 'none', background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '8px', padding: '10px 12px', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#007BFF'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e5ea'}>
                            Resumes
                        </Link>
                        <Link href="/candidate/dashboard/interviews" style={{ display: 'block', fontSize: '13px', color: '#475569', textDecoration: 'none', background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '8px', padding: '10px 12px', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#007BFF'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e5ea'}>
                            My Interviews
                        </Link>
                        <Link href="/candidate/dashboard/referrals" style={{ display: 'block', fontSize: '13px', color: '#475569', textDecoration: 'none', background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '8px', padding: '10px 12px', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#007BFF'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e5ea'}>
                            My Referrals
                        </Link>
                        <Link href="/candidate/dashboard/settings" style={{ display: 'block', fontSize: '13px', color: '#475569', textDecoration: 'none', background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '8px', padding: '10px 12px', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#007BFF'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e5ea'}>
                            Account Settings
                        </Link>
                    </div>
                </div>

                {/* ─── Column 2: Center Column Welcome + Job List (440px) ─── */}
                <div style={{ width: '440px', flexShrink: 0, overflowY: 'auto', borderRight: '1px solid #e2e5ea', height: '100%', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        {/* Section header */}
                        <div style={{ marginBottom: '2px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#12263A', margin: '0 0 2px' }}>Welcome, {userName}</h2>
                            <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#475569', margin: 0 }}>Jobs for you</h3>
                        </div>

                        {loading && jobs.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
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
                                    <div
                                        key={i}
                                        style={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e5ea',
                                            borderRadius: '10px',
                                            padding: '20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div className="sk-pulse" style={{ width: 70, height: 18, borderRadius: 4 }} />
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <div className="sk-pulse" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                                                <div className="sk-pulse" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                                            </div>
                                        </div>
                                        <div className="sk-pulse" style={{ width: '80%', height: 16, borderRadius: 4 }} />
                                        <div className="sk-pulse" style={{ width: '50%', height: 12, borderRadius: 4 }} />
                                        <div className="sk-pulse" style={{ width: '65%', height: 12, borderRadius: 4 }} />
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <div className="sk-pulse" style={{ width: 60, height: 18, borderRadius: 4 }} />
                                            <div className="sk-pulse" style={{ width: 80, height: 18, borderRadius: 4 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : jobs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e5ea', width: '100%' }}>
                                <span style={{ fontSize: '2.5rem' }}>🔍</span>
                                <h3 style={{ margin: '1rem 0 0.5rem', color: '#12263A', fontSize: '16px' }}>No jobs match your search</h3>
                                <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Try clearing filters or search terms.</p>
                            </div>
                        ) : (
                            <>
                                <style>{`
                                    @keyframes fadeIn {
                                        from { opacity: 0; transform: translateY(6px); }
                                        to { opacity: 1; transform: translateY(0); }
                                    }
                                `}</style>
                                {jobs.map((job) => {
                                    const isSelected = selectedJob?.id === job.id;
                                    const isApplied = appliedIds.has(job.id);
                                    const isSaved = savedIds.has(job.id);
                                    return (
                                        <div
                                            key={job.id}
                                            onClick={() => setSelectedJob(job)}
                                            style={{
                                                background: '#ffffff',
                                                border: `1px solid ${isSelected ? '#007BFF' : '#e2e5ea'}`,
                                                borderRadius: '10px',
                                                padding: '20px',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.15s, box-shadow 0.15s, background-color 0.15s',
                                                backgroundColor: isSelected ? '#F4F8FD' : '#ffffff',
                                                boxShadow: isSelected
                                                    ? '0 0 0 1px #007BFF, 0 4px 20px rgba(0,123,255,0.12)'
                                                    : '0 1px 4px rgba(0,0,0,0.04)',
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                                animation: 'fadeIn 0.3s ease-out'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                <span style={{ background: '#EFF6FF', color: '#007BFF', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', fontWeight: 600 }}>
                                                    Easily apply
                                                </span>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => handleToggleSave(job.id, e)}
                                                        style={{
                                                            background: isSaved ? '#EFF6FF' : '#ffffff',
                                                            border: `1px solid ${isSaved ? '#3B82F6' : '#e2e5ea'}`,
                                                            borderRadius: '50%',
                                                            width: '32px',
                                                            height: '32px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            color: isSaved ? '#007BFF' : '#475569',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: isSaved ? '0 2px 6px rgba(59, 130, 246, 0.15)' : 'none'
                                                        }}
                                                        onMouseOver={e => {
                                                            e.currentTarget.style.borderColor = '#3B82F6';
                                                            e.currentTarget.style.background = '#EFF6FF';
                                                            e.currentTarget.style.color = '#007BFF';
                                                            e.currentTarget.style.transform = 'scale(1.05)';
                                                        }}
                                                        onMouseOut={e => {
                                                            e.currentTarget.style.borderColor = isSaved ? '#3B82F6' : '#e2e5ea';
                                                            e.currentTarget.style.background = isSaved ? '#EFF6FF' : '#ffffff';
                                                            e.currentTarget.style.color = isSaved ? '#007BFF' : '#475569';
                                                            e.currentTarget.style.transform = 'none';
                                                        }}
                                                        title={isSaved ? 'Unsave job' : 'Save job'}
                                                    >
                                                        {isSaved ? IC.bookmarkFilled : IC.bookmark}
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 600, color: '#12263A', lineHeight: 1.3 }}>{job.title}</h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                <span style={{ fontSize: '13px', color: '#475569' }}>{job.companies?.name}</span>
                                                <span style={{ fontSize: '13px', color: '#475569' }}>{job.location}</span>
                                            </div>

                                            {/* Tags */}
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
                                                <span style={{ background: '#E7F7EE', color: '#157A45', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    {IC.check} {formatSalary(job.salary_min, job.salary_max, job.currency)}
                                                </span>
                                                <span style={{ background: '#F2F3F4', color: '#475569', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', fontWeight: 600 }}>
                                                    {job.type || 'Full-Time'}
                                                </span>
                                                {job.remote && (
                                                    <span style={{ background: '#F2F3F4', color: '#475569', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', fontWeight: 600 }}>
                                                        Work from home
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                                                <span>{formatDistanceToNow(new Date(job.created_at))} ago</span>
                                                {isApplied && (
                                                    <span style={{ color: '#157A45', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                        {IC.check} Applied
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {hasMore && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        style={{ background: '#ffffff', color: '#007BFF', border: '1px solid #e2e5ea', padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', width: '100%', marginTop: '4px', transition: 'background 0.15s' }}
                                        onMouseOver={e => (e.currentTarget.style.background = '#EFF6FF')}
                                        onMouseOut={e => (e.currentTarget.style.background = '#ffffff')}
                                    >
                                        {loadingMore ? 'Loading more...' : 'Load more jobs'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ─── Right Column: Job Detail Panel ─── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', height: '100%', backgroundColor: '#ffffff' }}>
                    {loading && !selectedJob ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '680px' }}>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="sk-pulse" style={{ width: '70%', height: 26, borderRadius: 4 }} />
                                <div className="sk-pulse" style={{ width: '40%', height: 16, borderRadius: 4 }} />
                                <div className="sk-pulse" style={{ width: '30%', height: 14, borderRadius: 4 }} />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <div className="sk-pulse" style={{ width: 200, height: 44, borderRadius: 8 }} />
                                    <div className="sk-pulse" style={{ width: 44, height: 44, borderRadius: 8 }} />
                                    <div className="sk-pulse" style={{ width: 44, height: 44, borderRadius: 8 }} />
                                </div>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="sk-pulse" style={{ width: 140, height: 18, borderRadius: 4 }} />
                                <div className="sk-pulse" style={{ width: '100%', height: 14, borderRadius: 4 }} />
                                <div className="sk-pulse" style={{ width: '95%', height: 14, borderRadius: 4 }} />
                                <div className="sk-pulse" style={{ width: '90%', height: 14, borderRadius: 4 }} />
                                <div className="sk-pulse" style={{ width: '40%', height: 14, borderRadius: 4 }} />
                            </div>
                        </div>
                    ) : selectedJob ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '680px' }}>
                            {/* Detail Header */}
                            <div>
                                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 600, color: '#12263A', lineHeight: 1.3 }}>{selectedJob.title}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    <Link
                                        href={`/dashboard/candidate/${role_id}/company-reviews`}
                                        style={{ fontSize: '14px', color: '#007BFF', textDecoration: 'underline', fontWeight: 500 }}
                                    >
                                        {selectedJob.companies?.name}
                                    </Link>
                                    <span style={{ color: '#e2e5ea' }}>·</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                        {selectedJob.companies?.rating || '4.0'} {IC.star}
                                    </span>
                                </div>
                                <div style={{ fontSize: '14px', color: '#12263A', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span>{selectedJob.location}</span>
                                    <span style={{ fontWeight: 600 }}>{formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.currency)}</span>
                                </div>

                                {/* CTA Row */}
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '16px' }}>
                                    {appliedIds.has(selectedJob.id) ? (
                                        <div style={{ background: '#E7F7EE', color: '#157A45', padding: '0 2rem', borderRadius: '8px', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', height: '44px' }}>
                                            {IC.check} Applied
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsApplyModalOpen(true)}
                                            style={{ background: '#007BFF', color: '#ffffff', border: 'none', padding: '0 2rem', borderRadius: '8px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', height: '44px', transition: 'background 0.15s' }}
                                            onMouseOver={e => (e.currentTarget.style.background = '#006AE6')}
                                            onMouseOut={e => (e.currentTarget.style.background = '#007BFF')}
                                        >
                                            Apply with TalentMesh
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => handleToggleSave(selectedJob.id, e)}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '8px',
                                            border: `1px solid ${savedIds.has(selectedJob.id) ? '#3B82F6' : '#e2e5ea'}`,
                                            background: savedIds.has(selectedJob.id) ? '#EFF6FF' : '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: savedIds.has(selectedJob.id) ? '#007BFF' : '#475569',
                                            transition: 'all 0.2s ease',
                                            boxShadow: savedIds.has(selectedJob.id) ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.borderColor = '#3B82F6';
                                            e.currentTarget.style.background = '#EFF6FF';
                                            e.currentTarget.style.color = '#007BFF';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseOut={e => {
                                            const isSavedNow = savedIds.has(selectedJob.id);
                                            e.currentTarget.style.borderColor = isSavedNow ? '#3B82F6' : '#e2e5ea';
                                            e.currentTarget.style.background = isSavedNow ? '#EFF6FF' : '#ffffff';
                                            e.currentTarget.style.color = isSavedNow ? '#007BFF' : '#475569';
                                            e.currentTarget.style.transform = 'none';
                                        }}
                                        title={savedIds.has(selectedJob.id) ? 'Unsave job' : 'Save job'}
                                    >
                                        {savedIds.has(selectedJob.id) ? IC.bookmarkFilled : IC.bookmark}
                                    </button>
                                    <button
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e5ea',
                                            background: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#475569',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#1e293b';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.borderColor = '#e2e5ea';
                                            e.currentTarget.style.background = '#ffffff';
                                            e.currentTarget.style.color = '#475569';
                                            e.currentTarget.style.transform = 'none';
                                        }}
                                        title="Share"
                                    >
                                        {IC.share}
                                    </button>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e2e5ea', margin: 0 }} />

                            {/* Job Details Spec */}
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#12263A', margin: '0 0 16px' }}>Job details</h3>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px' }}>Here's how the job details align with your profile.</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Pay Row */}
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ color: '#6B7280', marginTop: '2px' }}>{IC.dollar}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#12263A' }}>Pay</span>
                                            <span style={{ background: '#E7F7EE', color: '#157A45', fontSize: '13px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, width: 'fit-content', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                {IC.check} {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.currency)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Job Type Row */}
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ color: '#6B7280', marginTop: '2px' }}>{IC.briefcase}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#12263A' }}>Job type</span>
                                            <span style={{ background: '#F2F3F4', color: '#475569', fontSize: '13px', padding: '4px 10px', borderRadius: '6px', fontWeight: 500, width: 'fit-content', marginTop: '6px' }}>
                                                {selectedJob.type || 'Full-Time'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Experience Row */}
                                    {(selectedJob.experience_min != null || selectedJob.experience_max != null) && (
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <div style={{ color: '#6B7280', marginTop: '2px' }}>{IC.user}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#12263A' }}>Experience</span>
                                                <span style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                                                    {formatExperience(selectedJob.experience_min, selectedJob.experience_max)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e2e5ea', margin: 0 }} />

                            {/* Job Description */}
                            <div>
                                <h4 style={{ margin: '0 0 0.75rem', fontSize: '16px', fontWeight: 700, color: '#12263A' }}>Job Description</h4>
                                <div style={{ color: '#334155', fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                    {selectedJob.description}
                                </div>
                            </div>

                            {Array.isArray(selectedJob.requirements) && selectedJob.requirements.length > 0 && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '16px', fontWeight: 700, color: '#12263A' }}>Requirements</h4>
                                    <ul style={{ paddingLeft: '1.25rem', margin: 0, color: '#334155', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '0.4rem', lineHeight: 1.6 }}>
                                        {selectedJob.requirements.map((req: string, idx: number) => (
                                            <li key={idx}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {Array.isArray(selectedJob.skills_required) && selectedJob.skills_required.length > 0 && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '16px', fontWeight: 700, color: '#12263A' }}>Skills Required</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {selectedJob.skills_required.map((skill: string) => (
                                            <span key={skill} style={{ background: '#F2F3F4', color: '#334155', fontSize: '12px', padding: '5px 12px', borderRadius: '9999px', fontWeight: 500, border: '1px solid #E2E5EA' }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</span>
                            <span style={{ fontSize: '15px', fontWeight: 500 }}>Select a job to view details</span>
                            <span style={{ fontSize: '13px', marginTop: '4px' }}>Click any job on the left to see full details here</span>
                        </div>
                    )}
                </div>
            </div>

            {selectedJob && (
                <ApplyModal
                    isOpen={isApplyModalOpen}
                    onClose={() => setIsApplyModalOpen(false)}
                    jobId={selectedJob.id}
                    jobTitle={selectedJob.title}
                    companyName={selectedJob.companies?.name || 'Company'}
                    candidateProfile={null}
                    jobSkills={selectedJob.skills_required || []}
                    onSuccess={() => {
                        setAppliedIds(prev => {
                            const next = new Set(prev);
                            next.add(selectedJob.id);
                            return next;
                        });
                        setToast({ message: 'Successfully applied for the job!', type: 'success' });
                    }}
                />
            )}
        </div>
    );
}
