'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from '../../../../shared-dashboard.module.css';
import appStyles from '../applications.module.css';
import ApplicationTimeline from '@/components/candidate/ApplicationTimeline';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';

import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/lib/constants/application-status-map';

// ─── Constants ──────────────────────────────────────────────────────────────────
const STATUS_STEPS = [
    { key: 'applied',      label: APPLICATION_STATUS_LABELS.applied,      desc: 'Your application has been successfully submitted.' },
    { key: 'reviewing',    label: APPLICATION_STATUS_LABELS.reviewing,    desc: 'The recruiter is reviewing your profile and resume.' },
    { key: 'shortlisted',  label: APPLICATION_STATUS_LABELS.shortlisted,  desc: 'Congratulations! You have been shortlisted for the next round.' },
    { key: 'interviewing', label: APPLICATION_STATUS_LABELS.interviewing, desc: 'An interview has been scheduled or is in progress.' },
    { key: 'offered',      label: APPLICATION_STATUS_LABELS.offered,      desc: 'You have been selected! Check your email for offer details.' },
    { key: 'hired',        label: APPLICATION_STATUS_LABELS.hired,        desc: 'You have been hired! Congratulations on landing the role.' },
];

const TERMINAL_STATUS: Record<string, { label: string; color: string; desc: string }> = {
    rejected:  { label: APPLICATION_STATUS_LABELS.rejected,  color: APPLICATION_STATUS_COLORS.rejected,  desc: 'The company has decided to move forward with other candidates.' },
    withdrawn: { label: APPLICATION_STATUS_LABELS.withdrawn, color: APPLICATION_STATUS_COLORS.withdrawn, desc: 'You have withdrawn this application.' },
    hired:     { label: APPLICATION_STATUS_LABELS.hired,      color: APPLICATION_STATUS_COLORS.hired,      desc: 'You have been hired! Congratulations on landing the role.' },
};

// Map status key → progress step index (1-5)
const STATUS_STAGE: Record<string, number> = {
    applied:      1,
    reviewing:    2,
    shortlisted:  3,
    interviewing: 4,
    offered:      5,
    hired:        5,
};

// ─── Icons ──────────────────────────────────────────────────────────────────────
const IC = {
    Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
};

export default function ApplicationDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const [application, setApplication] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await invokeFunction('candidate-applications-id', {
                method: 'GET',
                queries: { id: params.app_id as string },
            });

            if (error) {
                if (error.message?.includes('not found') || error.status === 404) {
                    setNotFound(true);
                } else {
                    setErrorMsg(error.message || 'Failed to load application');
                }
                return;
            }

            if (data?.application) {
                setApplication(data.application);
            } else {
                setNotFound(true);
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Unexpected error loading application');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [params.app_id, user]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
                Syncing your application status...
            </div>
        );
    }

    // ── Error states ──────────────────────────────────────────────────────────
    if (notFound) {
        return (
            <div style={{ padding: '80px 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h2 style={{ fontWeight: 700, color: '#0f172a' }}>Application not found</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    This application may have been removed or does not belong to your account.
                </p>
                <Link
                    href={`/dashboard/candidate/${params.role_id}/applications`}
                    style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 600 }}
                >
                    Back to My Applications
                </Link>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div style={{ padding: '80px 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h2 style={{ fontWeight: 700, color: '#0f172a' }}>Something went wrong</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{errorMsg}</p>
                <button
                    onClick={fetchData}
                    style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    const job = application?.jobs;
    const company = job?.companies;
    const currentStatus: string = application?.status || 'applied';
    const isTerminal = !!TERMINAL_STATUS[currentStatus];
    const terminalInfo = TERMINAL_STATUS[currentStatus];
    const stage = STATUS_STAGE[currentStatus] || 1;

    // Find the matching step for the current status label
    const currentStep = STATUS_STEPS.find(s => s.key === currentStatus);

    return (
        <div className={appStyles.pageContainer}>
            <Link
                href={`/dashboard/candidate/${params.role_id}/applications`}
                className={appStyles.backLink}
            >
                <IC.Back /> Back to Applications
            </Link>

            <div className={appStyles.grid}>
                <div className={appStyles.mainContent}>

                    {/* Header */}
                    <div className={appStyles.header}>
                        <div className={appStyles.logoWrapper}>
                            {company?.logo_url ? <img src={getPublicStorageUrl('company-logos', company.logo_url)} className={appStyles.logo} alt={company.name} /> : '🏢'}
                        </div>
                        <div>
                            <h1 className={appStyles.title}>{job?.title}</h1>
                            <p className={appStyles.subtitle}>
                                {company?.name}
                                {job?.location ? ` · ${job.location}` : ''}
                                {job?.type ? ` · ${job.type}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Current status banner */}
                    {isTerminal ? (
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: terminalInfo.color + '12',
                            border: `1px solid ${terminalInfo.color}40`,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: terminalInfo.color + '20',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.25rem', flexShrink: 0,
                            }}>
                                {currentStatus === 'hired' ? '🎉' : currentStatus === 'rejected' ? '✗' : '✓'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, color: terminalInfo.color, fontSize: '1rem' }}>
                                    {terminalInfo.label}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '2px' }}>
                                    {terminalInfo.desc}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Progress bar for active applications
                        <section style={{
                            background: 'white', border: '1px solid #e2e8f0',
                            borderRadius: '20px', padding: '1.5rem',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                {['Applied', 'Review', 'Shortlist', 'Interview', 'Offer'].map((label, idx) => (
                                    <span key={label} style={{
                                        fontSize: '0.7rem', fontWeight: 700,
                                        color: stage > idx ? '#3b82f6' : '#94a3b8',
                                        textTransform: 'uppercase',
                                    }}>{label}</span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', height: '8px', marginBottom: '1rem' }}>
                                {[1, 2, 3, 4, 5].map(step => (
                                    <div key={step} style={{
                                        flex: 1,
                                        background: stage >= step ? '#3b82f6' : '#e2e8f0',
                                        borderRadius: '4px',
                                        transition: 'background 0.3s',
                                    }} />
                                ))}
                            </div>
                            {currentStep && (
                                <div style={{ fontSize: '0.875rem', color: '#475569', fontStyle: 'italic' }}>
                                    <strong style={{ color: '#0f172a' }}>{currentStep.label}:</strong> {currentStep.desc}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Timeline */}
                    <section style={{
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px',
                        padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Application Activity</h2>
                        <ApplicationTimeline
                            applicationId={application.id}
                            currentStatus={application.status}
                            appliedAt={application.applied_at}
                        />
                    </section>

                    {/* Cover Letter */}
                    {application.cover_letter && (
                        <section className={appStyles.coverLetterSection}>
                            <h2 className={appStyles.sectionTitle}>Cover Letter Snapshot</h2>
                            <div className={appStyles.coverLetterBox}>
                                {application.cover_letter}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar */}
                <aside className={appStyles.sidebar}>
                    <div className={appStyles.sidebarCard}>
                        <h3 className={appStyles.sidebarTitle}>Application Recap</h3>
                        <div className={appStyles.recapList}>
                            {[
                                { label: 'Application ID', value: application.id.slice(0, 8).toUpperCase() },
                                { label: 'Applied At', value: new Date(application.applied_at).toLocaleDateString() },
                                { label: 'Last Updated', value: new Date(application.updated_at).toLocaleDateString() },
                                { label: 'Current Status', value: (TERMINAL_STATUS[currentStatus]?.label || currentStep?.label || currentStatus) },
                                { label: 'Job Type', value: job?.type },
                                { label: 'Location', value: job?.location },
                                ...(job?.salary_min ? [{
                                    label: 'Salary',
                                    value: `${job.currency || '$'}${job.salary_min.toLocaleString()}${job.salary_max ? ' – ' + job.salary_max.toLocaleString() : '+'}`
                                }] : []),
                            ].map(item => item.value ? (
                                <div key={item.label} className={appStyles.recapItem}>
                                    <span className={appStyles.recapLabel}>{item.label}</span>
                                    <span className={appStyles.recapValue}>{item.value}</span>
                                </div>
                            ) : null)}
                        </div>
                    </div>

                    <div className={appStyles.helpCard}>
                        <h3 className={appStyles.helpTitle}>Need Help?</h3>
                        <p className={appStyles.helpText}>
                            If you have questions regarding this application, please visit our{' '}
                            <Link href="/portals/jobs/contact" className={appStyles.helpLink}>Support Center</Link> or check our{' '}
                            <Link href="/portals/jobs/contact#faq" className={appStyles.helpLink}>FAQ</Link>.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
