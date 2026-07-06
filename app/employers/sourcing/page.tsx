'use client';
import React, { useState } from 'react';
import styles from './sourcing.module.css';
import HeroBg from '@/components/ui/HeroBg/HeroBg';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import {
    Monitor,
    Palette,
    Landmark,
    TrendingUp,
    Users,
    Settings,
    HeartHandshake,
    Activity,
    ArrowRight,
    Check,
    Calendar,
    Clock
} from 'lucide-react';

const CheckIco = () => <Check size={16} className={styles.checkIconColor} />;
const ArrowIco = () => <ArrowRight size={18} />;

const STEPS = [
    { n: 1, title: 'Submit Your Hiring Brief', desc: 'Tell us about the role, requirements, timeline, and culture fit.' },
    { n: 2, title: 'AI + Human Expert Sourcing', desc: 'Our team searches across 50+ platforms to find the best candidates.' },
    { n: 3, title: 'Receive Your Shortlist', desc: 'Get a curated shortlist of pre-vetted candidates in 3–5 business days.' },
    { n: 4, title: 'Interview & Hire', desc: 'Interview your shortlist and make your hire with confidence.' },
];

const INCLUSIONS = [
    {
        title: 'Dedicated Sourcing Specialist',
        desc: 'A seasoned expert assigned to your account who understands your tech stack, requirements, and culture fit.'
    },
    {
        title: 'Multi-Platform Search',
        desc: 'Deep scanning of LinkedIn, GitHub, Dribbble, Read.cv, AngelList, and specialized developer communities.'
    },
    {
        title: 'Bias-Free AI Screening',
        desc: 'Leverage objective AI matching combined with human verification to screen skills and experience.'
    },
    {
        title: 'Curated Shortlist Reports',
        desc: 'Receive comprehensive summaries, resumes, fit scores, and salary expectations for each candidate.'
    },
    {
        title: 'Continuous Pipeline Management',
        desc: 'Active outreach and interview coordination until your vacancy is successfully filled.'
    },
    {
        title: 'Weekly Progress Updates',
        desc: 'Transparent reporting on pipeline metrics, candidate feedback, and market intelligence.'
    }
];

const INDUSTRIES = [
    {
        icon: <Monitor size={20} />,
        label: 'Tech & Engineering',
        roles: 'Software Engineers, DevOps Specialists, Cloud Architects, Data Leaders',
        desc: 'We locate and vet top-tier technical minds capable of engineering highly scalable platforms, designing robust architectures, and managing complex cloud infrastructures.',
        skills: ['React/Node', 'Python/Go', 'Kubernetes', 'AWS/GCP', 'System Design'],
        theme: 'dark',
        gridClass: 'spanCol2'
    },
    {
        icon: <Palette size={20} />,
        label: 'Product & Design',
        roles: 'UI/UX Designers, Product Leads, User Researchers, Creative Directors',
        desc: 'Connecting you with creative visionaries who build intuitive, human-centered digital experiences that drive user interaction and customer loyalty.',
        skills: ['Figma', 'UI/UX Design', 'Product Roadmap', 'Wireframing', 'User Research'],
        theme: 'blue',
        gridClass: 'spanCol1'
    },
    {
        icon: <Landmark size={20} />,
        label: 'Finance & Accounting',
        roles: 'CFOs, Strategic Analysts, Auditing Leads, Tax Advisors',
        desc: 'Vetting analytical professionals to optimize your financial structures, manage compliance risks, and guide your strategic scaling efforts.',
        skills: ['Financial Modeling', 'Risk Assessment', 'Auditing', 'Compliance', 'SaaS Metrics'],
        theme: 'light',
        gridClass: 'spanCol1'
    },
    {
        icon: <TrendingUp size={20} />,
        label: 'Sales & Marketing',
        roles: 'Growth Managers, Account Executives, SEO Specialists, Brand Strategists',
        desc: 'Hiring high-energy revenue builders who scale marketing pipelines, accelerate sales cycles, and maximize your market presence.',
        skills: ['Lead Gen', 'SEO/SEM', 'Enterprise Sales', 'Brand Strategy', 'CRM/HubSpot'],
        theme: 'blue',
        gridClass: 'spanCol2'
    },
    {
        icon: <Users size={20} />,
        label: 'HR & Talent Ops',
        roles: 'People Directors, HR Business Partners, Technical Sourcing Experts',
        desc: 'Finding people-first advocates who build high-performance workplace cultures, design retention systems, and recruit top talent.',
        skills: ['HR Strategy', 'Talent Ops', 'Culture Building', 'Onboarding', 'ATS Systems'],
        theme: 'dark',
        gridClass: 'spanCol2'
    },
    {
        icon: <Settings size={20} />,
        label: 'Operations & PM',
        roles: 'COOs, Project Managers, Delivery Leads, Agile Coaches',
        desc: 'Aligning teams with efficiency leaders who streamline operations, remove workflow blockers, and deliver milestones on schedule.',
        skills: ['Agile/Scrum', 'Workflow Optimization', 'Resource Planning', 'Jira/Asana', 'PMO'],
        theme: 'light',
        gridClass: 'spanCol1'
    },
    {
        icon: <HeartHandshake size={20} />,
        label: 'Customer Success',
        roles: 'CSMs, Technical Support Leads, Implementation Specialists',
        desc: 'Placing customer champions who drive product adoption, decrease churn rates, build accounts, and foster long-term loyalty.',
        skills: ['Customer Success', 'Churn Reduction', 'Onboarding', 'Support Ops', 'Zendesk'],
        theme: 'blue',
        gridClass: 'spanCol1'
    },
    {
        icon: <Activity size={20} />,
        label: 'Healthcare & Biotech',
        roles: 'Clinical Operations Managers, Bio-Researchers, Regulatory Leads',
        desc: 'Onboarding certified specialists to navigate complex medical regulations, manage clinical trials, and drive scientific innovation.',
        skills: ['HIPAA', 'Clinical Trials', 'Regulatory Audits', 'Biotech R&D', 'Lab Ops'],
        theme: 'dark',
        gridClass: 'spanCol2'
    },
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
                    access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || '',
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
            <HeroBg src="/bg job1.png" fixed />

            {/* ── HERO ── */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroInner}>
                        <div className={styles.heroBadge}>White-Glove Talent Service</div>
                        <h1 className={styles.heroTitle}>
                            Tell Us Who You Need.<br />
                            <span className={styles.highlight}>We&apos;ll Find Them.</span>
                        </h1>
                        <p className={styles.heroSub}>Our talent sourcing specialists search across 50+ platforms to bring you a shortlist of pre-vetted, ready-to-interview candidates.</p>
                        <button className={styles.heroCta} onClick={() => document.getElementById('brief-form')?.scrollIntoView({ behavior: 'smooth' })}>
                            Submit a Hiring Brief <ArrowIco />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.howSection}>
                    <div className="premium-container">
                        <h2 className={styles.sectionTitle}>How It <span className={styles.highlight}>Works</span></h2>
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
            </AnimateOnScroll>

            {/* ── WHAT'S INCLUDED (FULL WIDTH) ── */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.inclusionsSection}>
                    <div className="premium-container">
                        <h2 className={styles.sectionTitle}>What&apos;s <span className={styles.highlight}>Included</span></h2>
                        <div className={styles.inclusionGrid}>
                            {INCLUSIONS.map((item, idx) => (
                                <div key={idx} className={`${styles.inclusionCard} glass-card`}>
                                    <div className={styles.inclusionHeader}>
                                        <span className={styles.checkIco}><CheckIco /></span>
                                        <h3 className={styles.inclusionTitle}>{item.title}</h3>
                                    </div>
                                    <p className={styles.inclusionDesc}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* ── INDUSTRIES WE SERVE (FULL WIDTH MASONRY GRID) ── */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.industriesSection}>
                    <div className="premium-container">
                        <h2 className={styles.sectionTitle}>Industries We <span className={styles.highlight}>Serve</span></h2>
                        <div className={styles.industriesGrid}>
                            {INDUSTRIES.map((ind, i) => {
                                // Theme classes mapping
                                const themeClass = ind.theme === 'dark'
                                    ? styles.darkCard
                                    : ind.theme === 'light'
                                        ? styles.lightCard
                                        : styles.blueCard;

                                // Grid class mapping
                                const gridSpanClass = ind.gridClass === 'spanCol2'
                                    ? styles.spanCol2
                                    : ind.gridClass === 'spanRow2'
                                        ? styles.spanRow2
                                        : styles.spanCol1;

                                return (
                                    <div
                                        key={i}
                                        className={`${styles.industryCard} ${themeClass} ${gridSpanClass}`}
                                    >
                                        <div className={styles.cardHeader}>
                                            <div className={styles.cardTag}>
                                                <span className={styles.cardIcon}>{ind.icon}</span>
                                                <span className={styles.cardLabel}>{ind.label}</span>
                                            </div>
                                            <div className={styles.arrowBtn}>
                                                <ArrowRight size={16} className={styles.arrow} />
                                            </div>
                                        </div>

                                        <div className={styles.cardDivider} />

                                        <div className={styles.cardBody}>
                                            <span className={styles.cardRoles}>{ind.roles}</span>
                                            <p className={styles.cardDesc}>{ind.desc}</p>
                                            {ind.skills && (
                                                <div className={styles.skillsContainer}>
                                                    {ind.skills.map((skill, sIdx) => (
                                                        <span key={sIdx} className={styles.skillTag}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* ── HIRING BRIEF FORM ── */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.formSection} id="brief-form">
                    <div className="premium-container">
                        <h2 className={styles.sectionTitle}>Submit Your <span className={styles.highlight}>Hiring Brief</span></h2>
                        <p className={styles.formSubtitle}>Our team will be in touch within <strong>24 hours.</strong></p>

                        <div className={styles.formCard}>
                            {submitted ? (
                                <div className={styles.successState}>
                                    <div className={styles.successCircle}>✓</div>
                                    <h3 className={styles.successTitle}>Brief Received!</h3>
                                    <p className={styles.successDesc}>A member of our sourcing team will contact you within 24 hours.</p>
                                    <div className={styles.successBadge}>
                                        <Clock size={14} style={{ marginRight: '6px' }} />
                                        <span>24hr Response Guaranteed</span>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className={styles.form}>
                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}><label className={styles.lbl}>Company Name *</label><input required className={styles.input} placeholder="Acme Corp" value={form.company} onChange={e => set('company', e.target.value)} /></div>
                                        <div className={styles.field}><label className={styles.lbl}>Your Name *</label><input required className={styles.input} placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} /></div>
                                    </div>
                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}><label className={styles.lbl}>Email Address *</label><input required type="email" className={styles.input} placeholder="jane@acme.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                                        <div className={styles.field}>
                                            <label className={styles.lbl}>Role(s) to Fill *</label>
                                            <div className={styles.tagSuggestions}>
                                                {['React', 'Node.js', 'Go/Rust', 'AWS', 'Kubernetes', 'Mobile'].map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        className={styles.suggestionTag}
                                                        onClick={() => {
                                                            const current = form.roles ? form.roles.trim() : '';
                                                            if (!current.includes(tag)) {
                                                                set('roles', current ? `${current}, ${tag}` : tag);
                                                            }
                                                        }}
                                                    >
                                                        + {tag}
                                                    </button>
                                                ))}
                                            </div>
                                            <input required className={styles.input} placeholder="e.g. Senior Engineer, Product Manager" value={form.roles} onChange={e => set('roles', e.target.value)} />
                                        </div>
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
            </AnimateOnScroll>
        </main>
    );
}
