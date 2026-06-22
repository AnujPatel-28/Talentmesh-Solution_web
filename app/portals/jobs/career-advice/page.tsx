'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import styles from './career-advice.module.css';

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIco = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const ClockIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const StarIco = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;

// ─── Form Data ────────────────────────────────────────────────────────────────
const CURRENT_STATUS = ['Actively Looking', 'Passively Exploring', 'Recently Laid Off', 'Fresh Graduate', 'Career Changer', 'Currently Employed'];
const EXP_YEARS = ['0–1 years', '1–3 years', '3–5 years', '5–10 years', '10+ years'];
const HELP_OPTIONS = ['Resume Review', 'Interview Prep', 'Job Search Strategy', 'Career Switching Advice', 'Salary Negotiation', 'LinkedIn Optimisation', 'Other'];
const CONTACT_TIMES = ['Morning', 'Afternoon', 'Evening'];
const CONTACT_METHODS = ['Call', 'Email', 'WhatsApp'];

const STEPS = [
    { n: 1, title: 'Fill in the Form', desc: 'Share your details and career situation in under 5 minutes.' },
    { n: 2, title: 'We Review Your Profile', desc: 'Our specialists review your goals and experience carefully.' },
    { n: 3, title: 'We Contact You', desc: 'A career specialist reaches out at your preferred time.' },
    { n: 4, title: 'Get Your Career Plan', desc: 'Receive personalised advice and clear next steps.' },
];

const TESTIMONIALS = [
    { quote: 'TalentMesh helped me pivot from finance to product management. Within 6 weeks I had three offers on the table.', name: 'Priya Sharma', role: 'Product Manager @ Fintech Startup' },
    { quote: 'The salary negotiation advice alone was worth it. I secured 22% above the initial offer — something I\'d never have done alone.', name: 'James Okafor', role: 'Senior Engineer @ CloudOps' },
    { quote: 'As a fresh graduate I had no idea how to stand out. The team gave me a specific, actionable plan that actually worked.', name: 'Mei Lin', role: 'Data Analyst @ Analytics Co.' },
];

const STATS = [
    { val: '500+', label: 'Candidates Guided' },
    { val: '94%', label: 'Success Rate' },
    { val: '48hr', label: 'Response Time' },
];

import { SectionHeader, CustomSelect } from '@/components/ui';

export default function CareerAdvicePage() {
    const [form, setForm] = useState({
        fullName: '', email: '', phone: '', status: '', currentTitle: '', industry: '', expYears: '',
        contactTime: '', contactMethod: '', situation: ''
    });
    const [helpNeeds, setHelpNeeds] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
    const toggleHelp = (h: string) => setHelpNeeds(p => p.includes(h) ? p.filter(x => x !== h) : [...p, h]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <main className={styles.page}>
            {/* <section className={styles.blogHero}>
                <h1 className={styles.blogTitle}>Level up your career with <span className="text-gradient">expert insights</span></h1>
                <p className={styles.blogSub}>Discover actionable advice, industry trends, and the tools you need to stand out in today&apos;s competitive job market.</p>
                <div className={styles.searchBox}>
                    <SearchIcon className={styles.searchIcon} />
                    <input type="text" placeholder="Search articles..." className={styles.searchInput} />
                </div>
            </section> */}

            {/* ── CATEGORY FILTERS ── */}
            {/* <div className={styles.categoryFilters}>
                {['All', 'Resume Tips', 'Interview Prep', 'Salary Negotiation', 'AI in Recruiting'].map(c => (
                    <button key={c} className={`${styles.filterPill} ${c === 'All' ? styles.filterPillActive : ''}`}>{c}</button>
                ))}
            </div> */}

            {/* ── BLOG GRID ── */}
            {/* <div className={styles.blogGrid}>
                <div className={`${styles.articleCard} ${styles.featuredCard}`} style={{ backgroundImage: 'url(/images/tech-office.jpg)' }}>
                    <div className={styles.cardContent}>
                        <span className={styles.articleTag}>AI in Recruiting</span>
                        <h2 className={styles.featuredTitle}>How Generative AI is Reshaping the Hiring Process in 2024</h2>
                        <p className={styles.featuredDesc}>Stay ahead of the curve by understanding how top companies are using AI to screen candidates and what you can do to optimize your profile.</p>
                    </div>
                </div>
                <div className={styles.articleCard}>
                    <div>
                        <span className={`${styles.articleTag} ${styles.articleTagDark}`}>Interview Prep</span>
                        <h2 className={styles.articleTitle}>5 Questions You Should Always Ask at the End of an Interview</h2>
                        <p className={styles.articleDesc}>Flipping the script shows engagement and helps you determine if the company culture is the right fit.</p>
                    </div>
                    <Link href="#" className={styles.readMore}>Read more <ArrowForwardIcon fontSize="small" /></Link>
                </div>
            </div>

            <div className={styles.blogGridSecondary}>
                <div className={styles.articleCard}>
                    <div>
                        <span className={`${styles.articleTag} ${styles.articleTagDark}`}>Salary Negotiation</span>
                        <h2 className={styles.articleTitle}>The Art of the Counter-Offer: Knowing Your Worth</h2>
                        <p className={styles.articleDesc}>A step-by-step guide to confidently navigating salary discussions without risking the job offer.</p>
                    </div>
                    <Link href="#" className={styles.readMore}>Read more <ArrowForwardIcon fontSize="small" /></Link>
                </div>
                <div className={styles.articleCard} style={{ padding: 0 }}>
                    <div style={{ height: '220px', backgroundImage: 'url(/images/careers-team.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span className={`${styles.articleTag} ${styles.articleTagDark}`} style={{ width: 'fit-content' }}>Resume Tips</span>
                        <h2 className={styles.articleTitle}>Modernizing Your Resume for Applicant Tracking Systems (ATS)</h2>
                        <p className={styles.articleDesc}>Formatting mistakes might be getting you auto-rejected. Learn how to structure your resume to pass the initial digital screening.</p>
                        <Link href="#" className={styles.readMore}>Read more <ArrowForwardIcon fontSize="small" /></Link>
                    </div>
                </div>
            </div> */}

            {/* ── NEWSLETTER ── */}
            {/* <section className={styles.newsletterSection}>
                <div className={styles.newsletterBox}>
                    <div className={styles.newsletterContent}>
                        <h2 className={styles.newsletterTitle}>Stay ahead of the <span className="text-gradient">curve</span></h2>
                        <p className={styles.newsletterDesc}>Get weekly career advice, industry insights, and exclusive tips delivered straight to your inbox.</p>
                    </div>
                    <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Enter your email address" className={styles.newsletterInput} required />
                        <button type="submit" className={styles.newsletterBtn}>Subscribe</button>
                    </form>
                </div>
            </section> */}

            {/* ── HERO ── */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroInner}>
                        <SectionHeader
                            centered
                            className={styles.heroHeader}
                            tag="Career Services"
                            title={<>Expert Guidance for Your <span className={styles.highlight}>Career Path</span></>}
                            description="From resume reviews to interview preparation, our experts are here to help you navigate your next big move."
                        />
                    </div>
                </div>
            </section>

            {/* ── FORM + ASIDE ── */}
            <section className={styles.formSection}>
                <div className="premium-container">
                    <div className={styles.formLayout}>

                        {/* Form card */}
                        <div className={styles.formCard}>
                            {submitted ? (
                                <div className={styles.successState}>
                                    <div className={styles.successIco}><CheckIco /></div>
                                    <h2 className={styles.successTitle}>Request Received!</h2>
                                    <p className={styles.successDesc}>Thank you, <strong>{form.fullName || 'there'}</strong>. A TalentMesh career specialist will reach out to you within 24–48 hours.</p>
                                    <div className={styles.successBadge}><ClockIco /> 24–48 hr response</div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                                    <h2 className={styles.formTitle}>Request My Career Consultation</h2>
                                    <p className={styles.formNote}>All fields required unless marked <em>(optional)</em></p>

                                    <div className={styles.formTrustNote}>
                                        <ClockIco />
                                        <span>Our team typically responds within <strong>24–48 hours.</strong></span>
                                    </div>

                                    {/* SECTION 1: CONTACT INFO */}
                                    <div className={styles.formSectionHeader}>
                                        <span className={styles.formSectionNumber}>01</span>
                                        <h3 className={styles.formSectionTitle}>Contact Information</h3>
                                    </div>
                                    <div className={styles.formSectionDivider} />

                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Full Name</label>
                                            <input required className={styles.input} type="text" placeholder="Jane Smith" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Email Address</label>
                                            <input required className={styles.input} type="email" placeholder="jane@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Phone Number <em className={styles.optional}>(optional)</em></label>
                                        <input className={styles.input} type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                                    </div>

                                    {/* SECTION 2: CAREER PROFILE */}
                                    <div className={styles.formSectionHeader}>
                                        <span className={styles.formSectionNumber}>02</span>
                                        <h3 className={styles.formSectionTitle}>Career Profile</h3>
                                    </div>
                                    <div className={styles.formSectionDivider} />

                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Current Status</label>
                                            <CustomSelect
                                                className={styles.select}
                                                value={form.status}
                                                onChange={e => set('status', (e as any).target.value)}
                                                placeholder="Select your status"
                                                options={CURRENT_STATUS.map(s => ({ label: s, value: s }))}
                                                required
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Years of Experience</label>
                                            <CustomSelect
                                                className={styles.select}
                                                value={form.expYears}
                                                onChange={e => set('expYears', (e as any).target.value)}
                                                placeholder="Select range"
                                                options={EXP_YEARS.map(e => ({ label: e, value: e }))}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Current Job Title</label>
                                            <input required className={styles.input} type="text" placeholder="e.g. Software Engineer" value={form.currentTitle} onChange={e => set('currentTitle', e.target.value)} />
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Industry / Domain of Interest</label>
                                            <input required className={styles.input} type="text" placeholder="e.g. FinTech, Healthcare" value={form.industry} onChange={e => set('industry', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* SECTION 3: CONSULTATION DETAILS */}
                                    <div className={styles.formSectionHeader}>
                                        <span className={styles.formSectionNumber}>03</span>
                                        <h3 className={styles.formSectionTitle}>Consultation Details</h3>
                                    </div>
                                    <div className={styles.formSectionDivider} />

                                    {/* Multi-select help needs */}
                                    <div className={styles.field}>
                                        <label className={styles.label}>What kind of help do you need? <span className={styles.selectAll}>(select all that apply)</span></label>
                                        <div className={styles.chipGroup}>
                                            {HELP_OPTIONS.map(h => (
                                                <button type="button" key={h}
                                                    className={`${styles.helpChip} ${helpNeeds.includes(h) ? styles.helpChipActive : ''}`}
                                                    onClick={() => toggleHelp(h)}>{h}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Tell us a bit about your situation</label>
                                        <textarea required className={styles.textarea} rows={4}
                                            placeholder="Briefly describe where you are in your career and what you're hoping to achieve..."
                                            value={form.situation} onChange={e => set('situation', e.target.value)} />
                                    </div>

                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Preferred Contact Time</label>
                                            <div className={styles.radioGroup}>
                                                {CONTACT_TIMES.map(t => (
                                                    <label key={t} className={styles.radioLabel}>
                                                        <input
                                                            type="radio"
                                                            name="contactTime"
                                                            value={t}
                                                            checked={form.contactTime === t}
                                                            onChange={e => set('contactTime', e.target.value)}
                                                            className={styles.radioInput}
                                                        />
                                                        <span className={styles.radioCustom} />
                                                        {t}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Preferred Contact Method</label>
                                            <div className={styles.radioGroup}>
                                                {CONTACT_METHODS.map(m => (
                                                    <label key={m} className={styles.radioLabel}>
                                                        <input
                                                            type="radio"
                                                            name="contactMethod"
                                                            value={m}
                                                            checked={form.contactMethod === m}
                                                            onChange={e => set('contactMethod', e.target.value)}
                                                            className={styles.radioInput}
                                                        />
                                                        <span className={styles.radioCustom} />
                                                        {m}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className={styles.submitBtn}>
                                        Request My Career Consultation
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Aside */}
                        <div className={styles.aside}>
                            <div className={styles.asideCard}>
                                <h3 className={styles.asideTitle}>What you get</h3>
                                {['Personalised career roadmap', '1-on-1 specialist call', 'Tailored job search strategy', 'Resume & LinkedIn review tips', 'Salary benchmarking insights'].map(item => (
                                    <div key={item} className={styles.asideItem}><span className={styles.asideCheck}><CheckIco /></span><span>{item}</span></div>
                                ))}
                            </div>
                            <div className={styles.asideStat}>
                                {STATS.map(s => (
                                    <div key={s.val} className={styles.asideStatItem}>
                                        <div className={styles.asideStatVal}>{s.val}</div>
                                        <div className={styles.asideStatLabel}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── VELVET WRAPPER ── */}
            <div className={styles.velvetContainer}>
                {/* ── HOW IT WORKS ── */}
                <section className={styles.howSection}>
                    <div className="premium-container">
                        <SectionHeader
                            centered
                            light
                            tag="Process"
                            title="How it works"
                        />
                        <div className={styles.stepsRow}>
                            {STEPS.map((step, idx) => (
                                <React.Fragment key={step.n}>
                                    <div className={styles.stepCard}>
                                        <div className={styles.stepCircle}>{step.n}</div>
                                        <h3 className={styles.stepTitle}>{step.title}</h3>
                                        <p className={styles.stepDesc}>{step.desc}</p>
                                    </div>
                                    {idx < STEPS.length - 1 && <div className={styles.stepConnector} />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── TESTIMONIALS ── */}
                <section className={styles.trustSection}>
                    <div className="premium-container">
                        <SectionHeader
                            centered
                            light
                            tag="Testimonials"
                            title="What Candidates Say"
                            description="Trusted by hundreds of professionals seeking their next career milestone."
                        />
                        <div className={styles.testiGrid}>
                            {TESTIMONIALS.map((t, i) => (
                                <div key={i} className={`${styles.testiCard} glass-card`}>
                                    <div className={styles.stars}>{[...Array(5)].map((_, si) => <StarIco key={si} />)}</div>
                                    <p className={styles.quote}>&ldquo;{t.quote}&rdquo;</p>
                                    <div className={styles.author}>
                                        <div className={styles.authorAvatar}>{t.name.split(' ').map(w => w[0]).join('')}</div>
                                        <div>
                                            <div className={styles.authorName}>{t.name}</div>
                                            <div className={styles.authorRole}>{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
