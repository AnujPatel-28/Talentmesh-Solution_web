'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { insforge } from '@/lib/insforge';
import styles from '../../../../shared-dashboard.module.css';
import appStyles from '../applications.module.css';
import ApplicationTimeline from '@/components/candidate/ApplicationTimeline';

// ─── Constants ──────────────────────────────────────────────────────────────────
const STATUS_STEPS = [
    { key: 'applied', label: 'Applied', desc: 'Your application has been successfully submitted.' },
    { key: 'reviewing', label: 'Under Review', desc: 'The recruiter is reviewing your profile and resume.' },
    { key: 'shortlisted', label: 'Shortlisted', desc: 'Congratulations! You have been shortlisted for the next round.' },
    { key: 'interview', label: 'Interviewing', desc: 'An interview has been scheduled or is in progress.' },
    { key: 'offer', label: 'Offer Received', desc: 'You have been selected! Check your email for offer details.' },
];

const TERMINAL_STATUS = {
    rejected: { label: 'Not Selected', color: '#ef4444', desc: 'The company has decided to move forward with other candidates.' },
    withdrawn: { label: 'Withdrawn', color: '#64748b', desc: 'You have withdrawn this application.' },
    accepted: { label: 'Accepted', color: '#10b981', desc: 'You have accepted the offer. Congratulations!' },
};

// ─── Icons ──────────────────────────────────────────────────────────────────────
const IC = {
    Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
    Dot: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>,
    Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>,
};

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [application, setApplication] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const { data, error } = await insforge.database
                .from('applications')
                .select('id, status, applied_at, updated_at, cover_letter, jobs(title, location, type, salary_min, salary_max, currency, companies(name, logo_url))')
                .eq('id', params.app_id)
                .single();
            
            if (data) setApplication(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params.app_id]);

    if (loading) return <div style={{ padding: '80px 0', textAlign: 'center' }}>Syncing your application status...</div>;
    if (!application) return <div>Application not found.</div>;

    const job = application.jobs;
    const company = job?.companies;
    const currentStatus = application.status;
    const isTerminal = !!(TERMINAL_STATUS as any)[currentStatus];
    const statusIdx = STATUS_STEPS.findIndex(s => s.key === currentStatus);

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
                             {company?.logo_url ? <img src={company.logo_url} className={appStyles.logo} /> : '🏢'}
                        </div>
                        <div>
                            <h1 className={appStyles.title}>{job?.title}</h1>
                            <p className={appStyles.subtitle}>{company?.name} · {job?.location} · {job?.type}</p>
                        </div>
                    </div>

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

                    {/* Cover Letter Snapshot */}
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
                                { label: 'Job Type', value: job?.type },
                                { label: 'Location', value: job?.location },
                            ].map(item => (
                                <div key={item.label} className={appStyles.recapItem}>
                                    <span className={appStyles.recapLabel}>{item.label}</span>
                                    <span className={appStyles.recapValue}>{item.value}</span>
                                </div>
                            ))}
                         </div>
                    </div>

                    <div className={appStyles.helpCard}>
                         <h3 className={appStyles.helpTitle}>Need Help?</h3>
                         <p className={appStyles.helpText}>
                            If you have questions regarding this application, please visit our <Link href="#" className={appStyles.helpLink}>Support Center</Link> or check our FAQ.
                         </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
