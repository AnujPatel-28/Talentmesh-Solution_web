'use client';
import React, { useState } from 'react';
import styles from './sourcing.module.css';

const CheckIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const ArrowIco = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>;

const STEPS = [
    { n: 1, title: 'Submit Your Hiring Brief', desc: 'Tell us about the role, requirements, timeline, and culture fit.' },
    { n: 2, title: 'AI + Human Expert Sourcing', desc: 'Our team searches across 50+ platforms to find the best candidates.' },
    { n: 3, title: 'Receive Your Shortlist', desc: 'Get a curated shortlist of pre-vetted candidates in 3–5 business days.' },
    { n: 4, title: 'Interview & Hire', desc: 'Interview your shortlist and make your hire with confidence.' },
];

const INCLUSIONS = [
    'Dedicated sourcing specialist', 'Multi-platform search (LinkedIn, GitHub, Dribbble, AngelList+)',
    'Bias-free AI screening', 'Candidate summary reports with fit scores',
    'Ongoing shortlist management until role is filled', 'Weekly progress updates',
];

const INDUSTRIES = [
    { icon: '💻', label: 'Technology & Engineering' }, { icon: '🎨', label: 'Product & Design' },
    { icon: '💰', label: 'Finance & Accounting' }, { icon: '📈', label: 'Sales & Marketing' },
    { icon: '👥', label: 'HR & People Ops' }, { icon: '⚙️', label: 'Operations & PM' },
    { icon: '🤝', label: 'Customer Success' }, { icon: '🏥', label: 'Healthcare' },
];

export default function TalentSourcingPage() {
    const [form, setForm] = useState({ company: '', name: '', email: '', roles: '', count: '', industry: '', timeline: '', budget: '', notes: '' });
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || 'c755ba58-1a02-45d6-b021-3b66f62eb9fb',
                    subject: `New Sourcing Hiring Brief from ${form.company}`,
                    from_name: 'TalentMesh Sourcing',
                    name: form.name,
                    email: form.email,
                    company: form.company,
                    roles: form.roles,
                    count: form.count,
                    industry: form.industry,
                    timeline: form.timeline,
                    budget: form.budget,
                    message: form.notes
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                alert('Something went wrong. Please try again later.');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className={styles.page}>
            {/* ── HERO ── */}
            <section className={styles.hero}>
                <div className={styles.dotGrid} />
                <div className="premium-container">
                    <div className={styles.heroInner}>
                        <div className={styles.heroBadge}>White-Glove Talent Service</div>
                        <h1 className={styles.heroTitle}>Tell Us Who You Need.<br />We&apos;ll Find Them.</h1>
                        <p className={styles.heroSub}>Our talent sourcing specialists search across 50+ platforms to bring you a shortlist of pre-vetted, ready-to-interview candidates.</p>
                        <button className={styles.heroCta} onClick={() => document.getElementById('brief-form')?.scrollIntoView({ behavior: 'smooth' })}>
                            Submit a Hiring Brief <ArrowIco />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className={styles.howSection}>
                <div className="premium-container">
                    <h2 className={styles.sectionTitle}>How It Works</h2>
                    <div className={styles.stepsRow}>
                        {STEPS.map((step, idx) => (
                            <React.Fragment key={step.n}>
                                <div className={`${styles.stepCard} glass-card`}>
                                    <div className={styles.stepNum}>{step.n}</div>
                                    <h3 className={styles.stepTitle}>{step.title}</h3>
                                    <p className={styles.stepDesc}>{step.desc}</p>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={styles.stepArrow}><ArrowIco /></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── INCLUSIONS + INDUSTRIES ── */}
            <section className={styles.detailSection}>
                <div className="premium-container">
                    <div className={styles.detailGrid}>
                        <div>
                            <h2 className={styles.sectionTitle} style={{ textAlign: 'left', marginBottom: '24px' }}>What&apos;s Included</h2>
                            <div className={styles.inclusionList}>
                                {INCLUSIONS.map(item => (
                                    <div key={item} className={styles.inclusionItem}>
                                        <span className={styles.checkIco}><CheckIco /></span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className={styles.sectionTitle} style={{ textAlign: 'left', marginBottom: '24px' }}>Industries We Serve</h2>
                            <div className={styles.industryGrid}>
                                {INDUSTRIES.map(ind => (
                                    <div key={ind.label} className={styles.industryChip}>
                                        <span className={styles.industryIcon}>{ind.icon}</span>
                                        {ind.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HIRING BRIEF FORM ── */}
            <section className={styles.formSection} id="brief-form">
                <div className="premium-container">
                    <h2 className={styles.sectionTitle}>Submit Your Hiring Brief</h2>
                    <p className={styles.formSubtitle}>Our team will be in touch within <strong>24 hours.</strong></p>

                    <div className={styles.formCard}>
                        {submitted ? (
                            <div className={styles.successState}>
                                <div className={styles.successCircle}>✓</div>
                                <h3 className={styles.successTitle}>Brief Received!</h3>
                                <p className={styles.successDesc}>A member of our sourcing team will contact you within 24 hours.</p>
                                <div className={styles.successBadge}>⏱ 24hr Response Guaranteed</div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}><label className={styles.lbl}>Company Name *</label><input required className={styles.input} placeholder="Acme Corp" value={form.company} onChange={e => set('company', e.target.value)} /></div>
                                    <div className={styles.field}><label className={styles.lbl}>Your Name *</label><input required className={styles.input} placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} /></div>
                                </div>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}><label className={styles.lbl}>Email Address *</label><input required type="email" className={styles.input} placeholder="jane@acme.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                                    <div className={styles.field}><label className={styles.lbl}>Role(s) to Fill *</label><input required className={styles.input} placeholder="e.g. Senior Engineer, Product Manager" value={form.roles} onChange={e => set('roles', e.target.value)} /></div>
                                </div>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}><label className={styles.lbl}>Number of Hires</label><input type="number" min="1" className={styles.input} placeholder="e.g. 3" value={form.count} onChange={e => set('count', e.target.value)} /></div>
                                    <div className={styles.field}><label className={styles.lbl}>Industry / Domain</label><input className={styles.input} placeholder="e.g. SaaS, FinTech" value={form.industry} onChange={e => set('industry', e.target.value)} /></div>
                                </div>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}><label className={styles.lbl}>Ideal Start / Timeline</label><input className={styles.input} placeholder="e.g. ASAP, Q3 2026" value={form.timeline} onChange={e => set('timeline', e.target.value)} /></div>
                                    <div className={styles.field}><label className={styles.lbl}>Budget Range <em className={styles.opt}>(optional)</em></label><input className={`${styles.input} ${styles.dashed}`} placeholder="e.g. $80k–$120k per hire" value={form.budget} onChange={e => set('budget', e.target.value)} /></div>
                                </div>
                                <div className={styles.field}><label className={styles.lbl}>Anything else we should know? <em className={styles.opt}>(optional)</em></label><textarea className={styles.textarea} rows={4} placeholder="Culture fit, deal-breakers, remote policy, etc." value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
                                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit My Hiring Brief'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
