'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { insforge } from '@/lib/insforge';
import styles from '../../candidate.module.css';

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
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Link 
                href={`/dashboard/candidate/${params.role_id}/applications`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
            >
                <IC.Back /> Back to Applications
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '16px', background: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', overflow: 'hidden'
                        }}>
                             {company?.logo_url ? <img src={company.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{job?.title}</h1>
                            <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>{company?.name} · {job?.location} · {job?.type}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <section style={{ 
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', 
                        padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Application Activity</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', marginLeft: '12px' }}>
                            <div style={{ 
                                position: 'absolute', top: '10px', left: '10px', width: '2px', 
                                height: 'calc(100% - 30px)', background: '#f1f5f9'
                            }} />

                            {isTerminal ? (
                                <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: (TERMINAL_STATUS as any)[currentStatus].color, zIndex: 1, border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: (TERMINAL_STATUS as any)[currentStatus].color }}>{(TERMINAL_STATUS as any)[currentStatus].label}</h4>
                                        <p style={{ margin: '0.4rem 0 0', color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5 }}>
                                            {(TERMINAL_STATUS as any)[currentStatus].desc}
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            {STATUS_STEPS.map((step, i) => {
                                const isCompleted = !isTerminal && statusIdx >= i;
                                const isCurrent = !isTerminal && statusIdx === i;
                                
                                return (
                                    <div key={step.key} style={{ 
                                        display: 'flex', gap: '1.5rem', position: 'relative', marginBottom: '2rem',
                                        opacity: (!isTerminal && statusIdx < i) ? 0.4 : 1
                                    }}>
                                        <div style={{ 
                                            width: '22px', height: '22px', borderRadius: '50%', 
                                            background: isCompleted ? 'var(--primary-blue)' : '#f1f5f9', 
                                            zIndex: 1, border: '4px solid white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {isCompleted && <IC.Check />}
                                        </div>
                                        <div>
                                            <h4 style={{ 
                                                margin: 0, fontSize: '0.95rem', fontWeight: 800, 
                                                color: isCurrent ? 'var(--primary-blue)' : '#334155' 
                                            }}>
                                                {step.label}
                                                {isCurrent && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: '#eff6ff', color: 'var(--primary-blue)', padding: '0.2rem 0.5rem', borderRadius: '100px' }}>Active</span>}
                                            </h4>
                                            <p style={{ margin: '0.4rem 0 0', color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                                {isCurrent ? step.desc : ''}
                                                {step.key === 'applied' && `Applied on ${new Date(application.applied_at).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Cover Letter Snapshot */}
                    {application.cover_letter && (
                        <section>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Cover Letter Snapshot</h2>
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.92rem', lineHeight: 1.7 }}>
                                {application.cover_letter}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem' }}>
                         <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Application Recap</h3>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'Application ID', value: application.id.slice(0, 8).toUpperCase() },
                                { label: 'Applied At', value: new Date(application.applied_at).toLocaleDateString() },
                                { label: 'Job Type', value: job?.type },
                                { label: 'Location', value: job?.location },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#64748b' }}>{item.label}</span>
                                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                                </div>
                            ))}
                         </div>
                    </div>

                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '20px', padding: '1.5rem' }}>
                         <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1', marginBottom: '0.75rem' }}>Need Help?</h3>
                         <p style={{ fontSize: '0.85rem', color: '#0c4a6e', lineHeight: 1.6, margin: 0 }}>
                            If you have questions regarding this application, please visit our <Link href="#" style={{ color: '#0284c7', fontWeight: 700 }}>Support Center</Link> or check our FAQ.
                         </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
