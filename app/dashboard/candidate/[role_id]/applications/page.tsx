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

import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/lib/constants/application-status-map';
 
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
    applied:      { label: APPLICATION_STATUS_LABELS.applied,      color: APPLICATION_STATUS_COLORS.applied,      stage: 1 },
    reviewing:    { label: APPLICATION_STATUS_LABELS.reviewing,    color: APPLICATION_STATUS_COLORS.reviewing,    stage: 2 },
    shortlisted:  { label: APPLICATION_STATUS_LABELS.shortlisted,  color: APPLICATION_STATUS_COLORS.shortlisted,  stage: 3 },
    interviewing: { label: APPLICATION_STATUS_LABELS.interviewing, color: APPLICATION_STATUS_COLORS.interviewing, stage: 4 },
    offered:      { label: APPLICATION_STATUS_LABELS.offered,      color: APPLICATION_STATUS_COLORS.offered,      stage: 5 },
    hired:        { label: APPLICATION_STATUS_LABELS.hired,        color: APPLICATION_STATUS_COLORS.hired,        stage: 5 },
    rejected:     { label: APPLICATION_STATUS_LABELS.rejected,     color: APPLICATION_STATUS_COLORS.rejected,     stage: 0 },
    withdrawn:    { label: APPLICATION_STATUS_LABELS.withdrawn,    color: APPLICATION_STATUS_COLORS.withdrawn,    stage: 0 },
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
            active: applications.filter(a => !['rejected', 'withdrawn'].includes(a.status)).length,
            offers: applications.filter(a => a.status === 'offered').length
        };
    }, [applications]);

    const filteredApps = useMemo(() => {
        if (activeTab === 'all') return applications;
        if (activeTab === 'active') return applications.filter(a => !['rejected', 'withdrawn'].includes(a.status));
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
                <div className={styles.headerStats} style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className={styles.statCard} style={{ 
                        padding: '0.6rem 1.25rem', 
                        background: '#eff6ff', 
                        border: '1px solid #bfdbfe', 
                        borderRadius: '12px', 
                        textAlign: 'center',
                        boxShadow: '0 1px 2px rgba(59, 130, 246, 0.03)',
                        minWidth: '90px'
                    }}>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e40af', lineHeight: 1.2 }}>{stats.total}</div>
                        <div style={{ fontSize: '0.7rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginTop: '2px' }}>Applied</div>
                    </div>
                    <div className={styles.statCard} style={{ 
                        padding: '0.6rem 1.25rem', 
                        background: '#ecfdf5', 
                        border: '1px solid #a7f3d0', 
                        borderRadius: '12px', 
                        textAlign: 'center',
                        boxShadow: '0 1px 2px rgba(16, 185, 129, 0.03)',
                        minWidth: '90px'
                    }}>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#065f46', lineHeight: 1.2 }}>{stats.active}</div>
                        <div style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginTop: '2px' }}>Active</div>
                    </div>
                    <div className={styles.statCard} style={{ 
                        padding: '0.6rem 1.25rem', 
                        background: '#fffbeb', 
                        border: '1px solid #fde68a', 
                        borderRadius: '12px', 
                        textAlign: 'center',
                        boxShadow: '0 1px 2px rgba(245, 158, 11, 0.03)',
                        minWidth: '90px'
                    }}>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#92400e', lineHeight: 1.2 }}>{stats.offers}</div>
                        <div style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginTop: '2px' }}>Offers</div>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '9999px',
                gap: '4px',
                alignSelf: 'flex-start',
                marginBottom: '0.5rem'
            }}>
                {(['all', 'active', 'rejected', 'withdrawn'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.45rem 1.25rem',
                            border: 'none',
                            background: activeTab === tab ? 'white' : 'transparent',
                            color: activeTab === tab ? '#0f172a' : '#64748b',
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            borderRadius: '9999px',
                            boxShadow: activeTab === tab ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                            transition: 'all 0.2s',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredApps.length === 0 ? (
                    <div style={{ padding: '80px 0', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}><span role="img" aria-hidden="true">📁</span></div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>No applications yet</h3>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Start your journey by browsing available roles.</p>
                        <Link href={`/dashboard/candidate/${roleId}/jobs`} style={{ background: 'var(--primary-blue)', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>Browse Jobs</Link>
                    </div>
                ) : (
                    filteredApps.map(app => {
                        const statusInfo = STATUS_MAP[app.status];
                        const isTerminal = ['rejected', 'withdrawn'].includes(app.status);

                        return (
                            <Link
                                key={app.id}
                                href={`/dashboard/candidate/${roleId}/applications/${app.id}`}
                                style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.25rem',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(15, 23, 42, 0.04)';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.01)';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '12px',
                                            background: '#f8fafc', border: '1px solid #e2e8f0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, color: 'var(--primary-blue)', overflow: 'hidden',
                                            flexShrink: 0
                                        }}>
                                            {app.jobs?.companies?.logo_url ? (
                                                <img src={getPublicStorageUrl('company-logos', app.jobs.companies.logo_url)} alt={app.jobs?.companies?.name || 'Company Logo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (app.jobs?.companies?.name?.[0] || '🏢')}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>{app.jobs?.title ?? 'Job Unavailable'}</h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    color: '#475569',
                                                    fontSize: '0.725rem',
                                                    fontWeight: 600,
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '6px'
                                                }}>
                                                    🏢 {app.jobs?.companies?.name ?? 'Company'}
                                                </span>
                                                {app.jobs?.location && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        background: '#f8fafc',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        fontSize: '0.725rem',
                                                        fontWeight: 600,
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '6px'
                                                    }}>
                                                        <IC.Location /> {app.jobs.location}
                                                    </span>
                                                )}
                                                {app.jobs?.type && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        background: '#f8fafc',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        fontSize: '0.725rem',
                                                        fontWeight: 600,
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '6px'
                                                    }}>
                                                        <IC.Briefcase /> {app.jobs.type}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                                        <span style={{
                                            background: (statusInfo?.color || '#64748b') + '12',
                                            color: statusInfo?.color || '#64748b',
                                            border: `1px solid ${statusInfo?.color || '#64748b'}25`,
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            display: 'inline-block'
                                        }}>
                                            {statusInfo?.label || 'Unknown'}
                                        </span>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.725rem', color: '#94a3b8', fontWeight: 500 }}>
                                            Applied {formatDistanceToNow(new Date(app.applied_at))} ago
                                        </div>
                                    </div>
                                </div>

                                {!isTerminal ? (
                                    <div style={{ 
                                        background: '#f8fafc', 
                                        padding: '1rem 1.25rem', 
                                        borderRadius: '12px', 
                                        border: '1px solid #f1f5f9',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.6rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusInfo?.color || 'var(--primary-blue)', display: 'inline-block' }} />
                                                Pipeline Status: <strong style={{ color: '#0f172a' }}>{statusInfo?.label}</strong>
                                            </span>
                                            <span style={{ color: '#64748b' }}>Step {statusInfo?.stage || 1} of 5</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '10px', marginTop: '0.15rem' }}>
                                            {[1, 2, 3, 4, 5].map((step, idx) => {
                                                const isFilled = (statusInfo?.stage || 0) >= step;
                                                const isLastFilled = (statusInfo?.stage || 0) === step;
                                                return (
                                                    <React.Fragment key={step}>
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: isFilled ? 'var(--primary-blue)' : '#cbd5e1',
                                                            border: isLastFilled ? '3px solid #eff6ff' : 'none',
                                                            boxShadow: isLastFilled ? '0 0 0 1.5px var(--primary-blue)' : 'none',
                                                            transition: 'all 0.3s',
                                                            zIndex: 2,
                                                            flexShrink: 0
                                                        }} />
                                                        {idx < 4 && (
                                                            <div style={{
                                                                flex: 1,
                                                                height: '2.5px',
                                                                background: (statusInfo?.stage || 0) > step ? 'var(--primary-blue)' : '#e2e8f0',
                                                                transition: 'all 0.3s',
                                                                zIndex: 1
                                                            }} />
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    app.status === 'rejected' && (
                                        <div style={{ 
                                            background: '#fef2f2', 
                                            padding: '0.85rem 1.1rem', 
                                            borderRadius: '12px', 
                                            border: '1px solid #fee2e2', 
                                            color: '#991b1b', 
                                            fontSize: '0.825rem',
                                            lineHeight: 1.5
                                        }}>
                                            Thank you for your interest. The company has decided to move forward with other candidates at this time.
                                        </div>
                                    )
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                    {['applied', 'reviewing', 'shortlisted'].includes(app.status) && (
                                        <button
                                            onClick={(e) => handleWithdraw(app.id, e)}
                                            style={{
                                                padding: '0.45rem 1rem', borderRadius: '8px',
                                                background: 'white', border: '1px solid #e2e8f0',
                                                color: '#ef4444', fontWeight: 600, fontSize: '0.8rem',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#fee2e2';
                                                e.currentTarget.style.borderColor = '#fca5a5';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                        >
                                            <IC.Withdraw /> Withdraw
                                        </button>
                                    )}
                                    <span style={{
                                        padding: '0.45rem 1rem', borderRadius: '8px',
                                        background: 'var(--primary-blue)', color: '#ffffff',
                                        textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        boxShadow: '0 1px 2px rgba(59, 130, 246, 0.1)'
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
