'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Application, ApplicationStatus } from '@/types/user';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Toast from '@/components/ui/Toast';
import styles from '../../../shared-dashboard.module.css';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useCandidateApplicationsQuery, useWithdrawApplicationMutation } from '@/lib/queries/applications';
import * as Icons from '@/components/ui/icons';

import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants/applicationStatuses';
 
// ─── Icons ──────────────────────────────────────────────────────────────────────
const IC = {
    Location: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
    Briefcase: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    Clock: () => <Icons.Clock />,
    Check: () => <Icons.Check />,
    External: () => <Icons.External />,
    Withdraw: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
    ArrowRight: () => <Icons.ArrowRight />,
};

const STATUS_MAP: Record<string, { label: string, color: string, stage: number }> = {
    applied:      { label: STATUS_LABELS.applied,      color: STATUS_COLORS.applied,      stage: 1 },
    reviewing:    { label: STATUS_LABELS.reviewing,    color: STATUS_COLORS.reviewing,    stage: 2 },
    shortlisted:  { label: STATUS_LABELS.shortlisted,  color: STATUS_COLORS.shortlisted,  stage: 3 },
    interviewing: { label: STATUS_LABELS.interviewing, color: STATUS_COLORS.interviewing, stage: 4 },
    interview:    { label: STATUS_LABELS.interviewing, color: STATUS_COLORS.interviewing, stage: 4 },
    offered:      { label: STATUS_LABELS.offered,      color: STATUS_COLORS.offered,      stage: 5 },
    offer:        { label: STATUS_LABELS.offered,      color: STATUS_COLORS.offered,      stage: 5 },
    hired:        { label: STATUS_LABELS.hired,        color: STATUS_COLORS.hired,        stage: 5 },
    accepted:     { label: STATUS_LABELS.hired,        color: STATUS_COLORS.hired,        stage: 5 },
    rejected:     { label: STATUS_LABELS.rejected,     color: STATUS_COLORS.rejected,     stage: 0 },
    withdrawn:    { label: STATUS_LABELS.withdrawn,    color: STATUS_COLORS.withdrawn,    stage: 0 },
    active:       { label: STATUS_LABELS.applied,      color: STATUS_COLORS.applied,      stage: 1 },
};

export default function ApplicationsPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const roleId = params.role_id as string;

    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'rejected' | 'withdrawn'>('all');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);

    const { data: applications = [], isLoading: loading } = useCandidateApplicationsQuery(roleId, !!user);
    const withdrawMutation = useWithdrawApplicationMutation(roleId);

    const stats = useMemo(() => {
        return {
            total: applications.length,
            active: applications.filter(a => !['rejected', 'withdrawn', 'accepted'].includes(a.status)).length,
            offers: applications.filter(a => a.status === 'offer').length
        };
    }, [applications]);

    const filteredApps = useMemo(() => {
        if (activeTab === 'all') return applications;
        if (activeTab === 'active') return applications.filter(a => !['rejected', 'withdrawn', 'accepted'].includes(a.status));
        return applications.filter(a => a.status === activeTab);
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
            onSuccess: () => {
                setToast({ message: 'Application withdrawn successfully', type: 'success' });
            },
            onError: (err: any) => {
                setToast({ message: err.message || 'Failed to withdraw application', type: 'error' });
            }
        });
    };

    if (loading) return <div style={{ padding: '80px 0', textAlign: 'center' }}>Loading applications...</div>;

    return (
        <div className={styles.dash} style={{ gap: '2rem' }}>
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

            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderContent}>
                    <h1 className={styles.pageHeaderTitle}>My Applications</h1>
                    <p className={styles.pageHeaderSub}>Track your journey across {stats.total} roles.</p>
                </div>
                <div className={styles.headerStats}>
                    <div className={styles.statCard} style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{stats.total}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Applied</div>
                    </div>
                    <div className={styles.statCard} style={{ padding: '0.75rem 1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>{stats.active}</div>
                        <div style={{ fontSize: '0.75rem', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Active</div>
                    </div>
                    <div className={styles.statCard} style={{ padding: '0.75rem 1.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e' }}>{stats.offers}</div>
                        <div style={{ fontSize: '0.75rem', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Offers</div>
                    </div>
                </div>
            </div>

            <div className={styles.tabScroll}>
                {(['all', 'active', 'rejected', 'withdrawn'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: 'transparent',
                            color: activeTab === tab ? 'var(--primary-blue)' : '#64748b',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            borderBottom: activeTab === tab ? '2px solid var(--primary-blue)' : '2px solid transparent',
                            transition: 'all 0.2s',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredApps.length === 0 ? (
                    <div style={{ padding: '80px 0', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}><span role="img" aria-hidden="true">📁</span></div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>No applications yet</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start your journey by browsing available roles.</p>
                        <Link href={`/dashboard/candidate/${roleId}/jobs`} style={{ background: 'var(--primary-blue)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 600 }}>Browse Jobs</Link>
                    </div>
                ) : (
                    filteredApps.map(app => {
                        const statusInfo = STATUS_MAP[app.status];
                        const isTerminal = ['rejected', 'withdrawn', 'accepted'].includes(app.status);

                        return (
                            <Link
                                key={app.id}
                                href={`/dashboard/candidate/${roleId}/applications/${app.id}`}
                                style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.25rem',
                                    textDecoration: 'none',
                                    color: 'inherit'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '12px',
                                            background: '#f1f5f9', border: '1px solid #e2e8f0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, color: 'var(--primary-blue)', overflow: 'hidden'
                                        }}>
                                            {app.jobs?.companies?.logo_url ? (
                                                <img src={getPublicStorageUrl('company-logos', app.jobs.companies.logo_url)} alt={app.jobs?.companies?.name || 'Company Logo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (app.jobs?.companies?.name?.[0] || '🏢')}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{app.jobs?.title ?? 'Job Unavailable'}</h3>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                                <span>{app.jobs?.companies?.name ?? 'Company Unavailable'}</span>
                                                <span>•</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><IC.Location /> {app.jobs?.location ?? 'N/A'}</span>
                                                <span>•</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><IC.Briefcase /> {app.jobs?.type ?? 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            background: (statusInfo?.color || '#64748b') + '15',
                                            color: statusInfo?.color || '#64748b',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.02em',
                                            display: 'inline-block'
                                        }}>
                                            {statusInfo?.label || 'Unknown'}
                                        </span>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                            Applied {formatDistanceToNow(new Date(app.applied_at))} ago
                                        </div>
                                    </div>
                                </div>

                                {!isTerminal ? (
                                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            {['Applied', 'Review', 'Shortlist', 'Interview', 'Offer'].map((s, idx) => (
                                                <span key={s} style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    color: (statusInfo?.stage || 0) > idx ? 'var(--primary-blue)' : '#94a3b8',
                                                    textTransform: 'uppercase'
                                                }}>{s}</span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', height: '6px' }}>
                                            {[1, 2, 3, 4, 5].map(step => (
                                                <div key={step} style={{
                                                    flex: 1,
                                                    background: (statusInfo?.stage || 0) >= step ? 'var(--primary-blue)' : '#e2e8f0',
                                                    borderRadius: '4px'
                                                }} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    app.status === 'rejected' && (
                                        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '0.9rem' }}>
                                            Thank you for your interest. The company has decided to move forward with other candidates at this time.
                                        </div>
                                    )
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    {['applied', 'reviewing', 'shortlisted'].includes(app.status) && (
                                        <button
                                            onClick={(e) => handleWithdraw(app.id, e)}
                                            style={{
                                                padding: '0.6rem 1rem', borderRadius: '10px',
                                                background: 'white', border: '1px solid #e2e8f0',
                                                color: '#ef4444', fontWeight: 600, fontSize: '0.85rem',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                            }}
                                        >
                                            <IC.Withdraw /> Withdraw
                                        </button>
                                    )}
                                    <span style={{
                                        padding: '0.6rem 1rem', borderRadius: '10px',
                                        background: '#f1f5f9', color: '#475569',
                                        textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem'
                                    }}>
                                        View Details <IC.ArrowRight />
                                    </span>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
