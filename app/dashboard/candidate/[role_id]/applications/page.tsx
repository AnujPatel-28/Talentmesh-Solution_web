"use client";
import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useCandidateApplicationsQuery, useWithdrawApplicationMutation } from '@/lib/queries/applications';
import StatusPill from '@/components/dashboard/StatusPill';

/* ─── Icons ─── */
const IC = {
    building: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
        </svg>
    ),
    clock: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    dots: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
    ),
    info: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    check: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
};

type TabKey = 'saved' | 'applied' | 'interviews' | 'archived';

function getStatusLabel(status: string): string {
    switch (status) {
        case 'applied': return 'Applied';
        case 'reviewing':
        case 'shortlisted': return 'Under review';
        case 'interviewing': return 'Interview scheduled';
        case 'offered': return 'Offer received';
        case 'hired': return 'Hired';
        case 'rejected': return 'Not selected by employer';
        case 'withdrawn': return 'Withdrawn';
        default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function getStatusStyle(status: string): React.CSSProperties {
    switch (status) {
        case 'applied':
            return { background: '#EFF6FF', color: '#007BFF', border: '1px solid #BFDBFE' };
        case 'reviewing':
        case 'shortlisted':
            return { background: '#FFF4E5', color: '#B4690E', border: '1px solid #FDE68A' };
        case 'interviewing':
            return { background: '#EFF6FF', color: '#1565c0', border: '1px solid #BFDBFE' };
        case 'offered':
        case 'hired':
            return { background: '#E7F7EE', color: '#157A45', border: '1px solid #A7F3D0' };
        case 'rejected':
            return { background: '#FEF2F2', color: '#C4302B', border: '1px solid #FECACA' };
        case 'withdrawn':
            return { background: '#F2F3F4', color: '#475569', border: '1px solid #E2E5EA' };
        default:
            return { background: '#F2F3F4', color: '#475569', border: '1px solid #E2E5EA' };
    }
}

export default function ApplicationsPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const roleId = params.role_id as string;

    const [activeTab, setActiveTab] = useState<TabKey>('applied');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);

    const { data: applications = [], isLoading: loading } = useCandidateApplicationsQuery(roleId, !!user);
    const withdrawMutation = useWithdrawApplicationMutation(roleId);

    /* ─── Tab Counts ─── */
    const counts = useMemo(() => ({
        saved: 0, // future: saved jobs count
        applied: applications.filter(a => !['interviewing', 'offered', 'hired', 'rejected', 'withdrawn'].includes(a.status)).length,
        interviews: applications.filter(a => a.status === 'interviewing').length,
        archived: applications.filter(a => ['rejected', 'withdrawn'].includes(a.status)).length,
    }), [applications]);

    /* ─── Filter by tab ─── */
    const filteredApps = useMemo(() => {
        switch (activeTab) {
            case 'saved':
                return []; // future: saved jobs
            case 'applied':
                return applications.filter(a => !['interviewing', 'offered', 'hired', 'rejected', 'withdrawn'].includes(a.status));
            case 'interviews':
                return applications.filter(a => a.status === 'interviewing');
            case 'archived':
                return applications.filter(a => ['rejected', 'withdrawn'].includes(a.status));
            default:
                return applications;
        }
    }, [applications, activeTab]);

    const handleWithdraw = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setWithdrawTarget(id);
    };

    const confirmWithdraw = async () => {
        if (!withdrawTarget) return;
        const id = withdrawTarget;
        setWithdrawTarget(null);
        withdrawMutation.mutate(id, {
            onSuccess: () => setToast({ message: 'Application withdrawn successfully', type: 'success' }),
            onError: (err: any) => setToast({ message: err.message || 'Failed to withdraw application', type: 'error' })
        });
    };

    const TABS: { key: TabKey; label: string }[] = [
        { key: 'saved', label: 'Saved' },
        { key: 'applied', label: 'Applied' },
        { key: 'interviews', label: 'Interviews' },
        { key: 'archived', label: 'Archived' },
    ];

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmModal
                isOpen={!!withdrawTarget}
                title="Withdraw Application"
                message="Are you sure you want to withdraw this application? This action cannot be undone."
                confirmLabel="Yes, Withdraw"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmWithdraw}
                onCancel={() => setWithdrawTarget(null)}
            />

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 2rem 4rem' }}>

                {/* Page Title */}
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#12263A', margin: '0 0 1.25rem', letterSpacing: '-0.02em' }}>
                    My Jobs
                </h1>

                {/* ─── Tab Strip (matches Indeed "My jobs" tabs with count ABOVE label) ─── */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e5ea', gap: '0', marginBottom: '1.5rem' }}>
                    {TABS.map(tab => {
                        const count = counts[tab.key];
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '0 20px 14px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    borderBottom: `2px solid ${isActive ? '#007BFF' : 'transparent'}`,
                                    marginBottom: '-1px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1px',
                                    outline: 'none',
                                    transition: 'border-color 0.15s'
                                }}
                            >
                                <span style={{ fontSize: '18px', fontWeight: 700, color: isActive ? '#12263A' : '#94a3b8', lineHeight: 1 }}>
                                    {count}
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400, color: isActive ? '#12263A' : '#6B7280' }}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ─── Application List ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} style={{ padding: '1.5rem 0', borderBottom: '1px solid #e2e5ea' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '6px', background: '#F2F3F4', flexShrink: 0 }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                        <div style={{ height: '12px', width: '120px', background: '#F2F3F4', borderRadius: '4px' }} />
                                        <div style={{ height: '16px', width: '200px', background: '#E2E5EA', borderRadius: '4px' }} />
                                        <div style={{ height: '12px', width: '160px', background: '#F2F3F4', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : filteredApps.length === 0 ? (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#6B7280' }}>
                            {activeTab === 'saved' ? (
                                <>
                                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🔖</span>
                                    <h3 style={{ margin: '0 0 0.5rem', color: '#12263A', fontSize: '18px', fontWeight: 700 }}>No saved jobs yet</h3>
                                    <p style={{ fontSize: '14px', margin: '0 0 1.5rem' }}>Bookmark jobs you like and they'll show up here.</p>
                                    <Link href="/candidate/dashboard" style={{ background: '#007BFF', color: '#ffffff', textDecoration: 'none', padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
                                        Browse Jobs
                                    </Link>
                                </>
                            ) : activeTab === 'interviews' ? (
                                <>
                                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🎤</span>
                                    <h3 style={{ margin: '0 0 0.5rem', color: '#12263A', fontSize: '18px', fontWeight: 700 }}>No interviews scheduled</h3>
                                    <p style={{ fontSize: '14px', margin: 0 }}>When an employer invites you for an interview, it will appear here.</p>
                                </>
                            ) : activeTab === 'archived' ? (
                                <>
                                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📁</span>
                                    <h3 style={{ margin: '0 0 0.5rem', color: '#12263A', fontSize: '18px', fontWeight: 700 }}>Nothing archived yet</h3>
                                    <p style={{ fontSize: '14px', margin: 0 }}>Rejected or withdrawn applications will appear here.</p>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>✉️</span>
                                    <h3 style={{ margin: '0 0 0.5rem', color: '#12263A', fontSize: '18px', fontWeight: 700 }}>No applications yet</h3>
                                    <p style={{ fontSize: '14px', margin: '0 0 1.5rem' }}>Start exploring jobs to submit your first application.</p>
                                    <Link href="/candidate/dashboard" style={{ background: '#007BFF', color: '#ffffff', textDecoration: 'none', padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
                                        Find Jobs
                                    </Link>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredApps.map((app: any) => {
                            const isInactive = ['rejected', 'withdrawn'].includes(app.status);
                            const statusLabel = getStatusLabel(app.status);
                            const statusStyle = getStatusStyle(app.status);
                            const appliedDate = app.applied_at
                                ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '';

                            return (
                                <div
                                    key={app.id}
                                    style={{
                                        padding: '1.5rem 0',
                                        borderBottom: '1px solid #e2e5ea',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                        {/* Left: icon + info */}
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
                                            {/* Company icon square */}
                                            <div style={{
                                                width: 48, height: 48, borderRadius: '6px',
                                                background: '#F2F3F4', border: '1px solid #E2E5EA',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#6B7280', flexShrink: 0
                                            }}>
                                                {IC.building}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                {/* Status pill ABOVE title */}
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    padding: '2px 10px',
                                                    borderRadius: '9999px',
                                                    width: 'fit-content',
                                                    ...statusStyle
                                                }}>
                                                    {statusLabel}
                                                </span>

                                                {/* Job title — clickable */}
                                                <h3
                                                    style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#007BFF', cursor: 'pointer', textDecoration: 'underline' }}
                                                    onClick={() => router.push('/candidate/dashboard')}
                                                >
                                                    {app.jobs?.title}
                                                </h3>

                                                <span style={{ fontSize: '14px', color: '#475569' }}>{app.jobs?.companies?.name}</span>
                                                <span style={{ fontSize: '14px', color: '#475569' }}>{app.jobs?.location}</span>
                                                {appliedDate && (
                                                    <span style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                        {IC.clock} Applied on TalentMesh on {appliedDate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: action buttons */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                            {['applied', 'reviewing', 'shortlisted'].includes(app.status) && (
                                                <button
                                                    onClick={(e) => handleWithdraw(app.id, e)}
                                                    style={{
                                                        background: '#ffffff',
                                                        border: '1px solid #CBD2DB',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#12263A',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.background = '#F2F3F4'; }}
                                                    onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; }}
                                                >
                                                    Update status
                                                </button>
                                            )}
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', color: '#6B7280', display: 'flex', alignItems: 'center' }}
                                                title="More options"
                                            >
                                                {IC.dots}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline info banner for inactive/closed applications */}
                                    {isInactive && (
                                        <div style={{
                                            display: 'flex', gap: '8px', alignItems: 'center',
                                            background: '#F2F3F4', padding: '10px 14px',
                                            borderRadius: '8px', fontSize: '13px', color: '#475569'
                                        }}>
                                            {IC.info}
                                            <span>
                                                {app.status === 'withdrawn'
                                                    ? 'You withdrew this application.'
                                                    : 'Job closed or expired on TalentMesh'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer issues note */}
                {filteredApps.length > 0 && (
                    <p style={{ fontSize: '14px', color: '#475569', marginTop: '2rem' }}>
                        Having an issue with My Jobs?{' '}
                        <span style={{ color: '#007BFF', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                            Tell us more
                        </span>
                    </p>
                )}
            </div>

            {/* ─── Footer Links (matching Indeed bottom nav) ─── */}
            <div style={{ borderTop: '1px solid #e2e5ea', padding: '1.5rem 2rem', backgroundColor: '#ffffff' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '12px 24px' }}>
                    {[
                        { label: 'Career advice', href: '/candidate/dashboard' },
                        { label: 'Browse jobs', href: '/candidate/dashboard' },
                        { label: 'Browse companies', href: '/candidate/dashboard/company-reviews' },
                        { label: 'Salaries', href: '/candidate/dashboard/salary-guide' },
                        { label: 'Help', href: '/candidate/dashboard' },
                        { label: 'Settings', href: '/candidate/dashboard/settings' },
                    ].map(link => (
                        <Link
                            key={link.label}
                            href={link.href}
                            style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
