'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { CTA } from '@/components/sections';
import styles from './career-advice.module.css';
import { SectionHeader, CustomSelect } from '@/components/ui';
import { 
    Clock, 
    Sparkles, 
    ShieldAlert, 
    Download, 
    Check, 
    BookOpen, 
    ArrowRight,
    Award,
    Briefcase
} from 'lucide-react';

// ─── Form Options & Data ──────────────────────────────────────────────────────
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

// ─── Unified Sector Hub Data ─────────────────────────────────────────────────
const SECTORS = [
    {
        id: "technology",
        title: "Software Engineering",
        description: "Build and scale modern software applications using code.",
        icon: <Briefcase size={20} />,
        skills: ["React & Next.js", "Node.js & Python", "System Design", "Cloud Infrastructure"],
        roadmap: [
            "Learn programming fundamentals & data structures.",
            "Build 2-3 production-ready full-stack projects.",
            "Practice mock system design & coding interviews."
        ],
        playbookTitle: "Tech Recruiting Playbook",
        playbookTips: [
            "Optimize your GitHub readme to show production-ready projects, not just academic exercises.",
            "Be prepared to explain the 'why' behind database selection (SQL vs NoSQL) for scaled apps.",
            "Build a project incorporating LLM integrations or vector databases to stand out."
        ]
    },
    {
        id: "creative",
        title: "Product Design (UI/UX)",
        description: "Design intuitive interfaces and premium user experiences.",
        icon: <Sparkles size={20} />,
        skills: ["Figma & Prototyping", "User Research Synthesis", "Design Systems", "Interaction Design"],
        roadmap: [
            "Master design tools (Figma, Framer) & typography.",
            "Create 2 detailed case studies showcasing iteration.",
            "Collaborate with developers to understand handoff."
        ],
        playbookTitle: "Creative & Design Playbook",
        playbookTips: [
            "Treat your case studies like stories. Clearly state the conflict, the user struggle, and the outcome.",
            "Learn basic React/HTML/CSS so you can speak the same language as front-end developers.",
            "Show evidence of design iteration: explain why your first three ideas didn't work."
        ]
    },
    {
        id: "finance",
        title: "Finance & Strategy",
        description: "Analyze financial data and drive corporate transaction strategies.",
        icon: <Award size={20} />,
        skills: ["LBO & DCF Modeling", "Data Analysis (SQL)", "PowerPoint Storytelling", "Market Research"],
        roadmap: [
            "Build strong foundations in corporate accounting.",
            "Practice modeling complex merger & acquisition scenarios.",
            "Network with professionals to secure warm referrals."
        ],
        playbookTitle: "Finance & Strategy Playbook",
        playbookTips: [
            "Understand macroeconomic trends, interest rate dynamics, and their impact on corporate dealmaking.",
            "Flawless formatting in Excel and PowerPoint is non-negotiable; errors signal lack of diligence.",
            "Network early. Build genuine relationships months before recruiting cycles open."
        ]
    }
];

export default function CareerAdvicePage() {
    // ─── Filter State ───
    const [activeCategory, setActiveCategory] = useState<'All' | 'Technology' | 'Creative' | 'Finance'>('All');

    // ─── Sector Cards Tab State ───
    const [sectorTabs, setSectorTabs] = useState<Record<string, 'roadmap' | 'playbook'>>({
        technology: 'roadmap',
        creative: 'roadmap',
        finance: 'roadmap'
    });

    // ─── Download Form State ───
    const [downloadEmail, setDownloadEmail] = useState('');
    const [downloaded, setDownloaded] = useState(false);

    // ─── Consultation Request Form State ───
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

    const handleDownloadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (downloadEmail.trim()) {
            setDownloaded(true);
            setTimeout(() => {
                setDownloaded(false);
                setDownloadEmail('');
            }, 6000);
        }
    };

    // Filter logic
    const filteredSectors = SECTORS.filter(s => activeCategory === 'All' || s.id === activeCategory.toLowerCase());

    return (
        <main className={styles.page}>
            {/* Moving background container with translation & scaling animation */}
            <div className={styles.bgWrapper}>
                <div className={styles.bgImage} />
                <div className={styles.bgOverlay} />
            </div>

            {/* ── HERO SECTION ── */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroInner}>
                        <SectionHeader
                            centered
                            className={styles.heroHeader}
                            tag="Alumni Advice Network"
                            title={<>Real Journeys. Tactical <span className={styles.highlightText}>Career Advice.</span></>}
                            description="Access battle-tested playbooks, resilience roadmaps, and hourly breakdowns compiled directly from alumni at market-leading organizations."
                        />
                    </div>
                </div>
            </section>

            {/* ── INTERACTIVE ALUMNI HUB ── */}
            <section className={styles.hubSection}>
                <div className="premium-container">
                    {/* Category Filter Pills */}
                    <div className={styles.filtersContainer}>
                        {(['All', 'Technology', 'Creative', 'Finance'] as const).map(cat => (
                            <button
                                key={cat}
                                className={`${styles.filterPill} ${activeCategory === cat ? styles.filterPillActive : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sector Hub Cards Grid */}
                    <div className={styles.gridSectionHeaderWrap}>
                        <h2 className={styles.gridSectionTitle}>
                            <Sparkles className={styles.columnIcon} />
                            Explore Sector <span className={styles.highlightText}>Career Hubs</span>
                        </h2>
                    </div>

                    <div className={styles.sectorsGrid}>
                        {filteredSectors.map(sector => {
                            const activeTab = sectorTabs[sector.id] || 'roadmap';
                            return (
                                <div key={sector.id} className={`${styles.glassCard} ${styles.sectorCard}`}>
                                    {/* Sector Header */}
                                    <div className={styles.sectorHeader}>
                                        <div className={styles.sectorIconBox}>
                                            {sector.icon}
                                        </div>
                                        <div>
                                            <h3 className={styles.sectorTitle}>{sector.title}</h3>
                                            <p className={styles.sectorDesc}>{sector.description}</p>
                                        </div>
                                    </div>

                                    {/* Card Tab Selectors */}
                                    <div className={styles.tabTriggers}>
                                        <button
                                            type="button"
                                            className={`${styles.tabTrigger} ${activeTab === 'roadmap' ? styles.tabTriggerActive : ''}`}
                                            onClick={() => setSectorTabs(p => ({ ...p, [sector.id]: 'roadmap' }))}
                                        >
                                            Career Roadmap
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.tabTrigger} ${activeTab === 'playbook' ? styles.tabTriggerActive : ''}`}
                                            onClick={() => setSectorTabs(p => ({ ...p, [sector.id]: 'playbook' }))}
                                        >
                                            Recruiting Playbook
                                        </button>
                                    </div>

                                    {/* Tab Contents */}
                                    <div className={styles.tabContent}>
                                        {activeTab === 'roadmap' ? (
                                            <div className={styles.tabPanel}>
                                                <div className={styles.navSection}>
                                                    <h4 className={styles.navSubTitle}>Core Skills Required:</h4>
                                                    <div className={styles.skillsContainer}>
                                                        {sector.skills.map((skill, idx) => (
                                                            <span key={idx} className={styles.skillPill}>{skill}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className={styles.navSection} style={{ marginTop: '20px' }}>
                                                    <h4 className={styles.navSubTitle}>Milestone Roadmap to Land Job:</h4>
                                                    <ol className={styles.roadmapList}>
                                                        {sector.roadmap.map((step, idx) => (
                                                            <li key={idx} className={styles.roadmapStep}>
                                                                <span className={styles.stepNum}>{idx + 1}</span>
                                                                <span className={styles.stepText}>{step}</span>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.tabPanel}>
                                                <div className={styles.playbookSection}>
                                                    <h4 className={styles.playbookTitle}>{sector.playbookTitle}</h4>
                                                    <span className={styles.playbookSecLabel}>Tactical Strategy:</span>
                                                    <ul className={styles.playbookBullets}>
                                                        {sector.playbookTips.map((tip, idx) => (
                                                            <li key={idx} className={styles.playbookBullet}>
                                                                <Check size={14} className={styles.checkIcon} />
                                                                <span>{tip}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── FULL-WIDTH RESOURCES & PREP BANNER ── */}
                    <div className={`${styles.glassCard} ${styles.resourcesBannerCard}`}>
                        <h2 className={styles.bannerSectionTitle}>
                            <BookOpen className={styles.columnIcon} />
                            Prep & Download <span className={styles.highlightText}>Resources</span>
                        </h2>
                        <div className={styles.bannerDivider} />
                        
                        <div className={styles.bannerLayout}>
                            {/* Left Column: Download Form */}
                            <div className={styles.bannerDownloadCol}>
                                <div className={styles.downloadHeader}>
                                    <div className={styles.downloadIconBox}>
                                        <Download size={24} />
                                    </div>
                                    <div>
                                        <h3 className={styles.downloadTitle}>Download Tip Book</h3>
                                        <p className={styles.downloadSubtitle}>Compiled checklist of top 10 alumni tips</p>
                                    </div>
                                </div>
                                <p className={styles.downloadText}>
                                    Get our complete 25-page compiled PDF guide containing resume templates, salary negotiation scripts, and portfolio checklists.
                                </p>
                                
                                {downloaded ? (
                                    <div className={styles.downloadSuccessBox}>
                                        <Check size={18} />
                                        <span>Check your inbox for the download link!</span>
                                    </div>
                                ) : (
                                    <form onSubmit={handleDownloadSubmit} className={styles.downloadForm}>
                                        <input
                                            type="email"
                                            required
                                            placeholder="Enter your email address"
                                            className={styles.downloadInput}
                                            value={downloadEmail}
                                            onChange={e => setDownloadEmail(e.target.value)}
                                        />
                                        <button type="submit" className={styles.downloadBtn}>
                                            Send Me PDF <ArrowRight size={16} />
                                        </button>
                                    </form>
                                )}
                            </div>

                            <div className={styles.bannerColumnDivider} />

                            {/* Right Column: Pre-Interview Checklist */}
                            <div className={styles.bannerChecklistCol}>
                                <div className={styles.checklistHeader}>
                                    <div className={styles.checklistIconBox}>
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <h3 className={styles.checklistTitle}>Pre-Interview Checklist</h3>
                                        <p className={styles.checklistSubtitle}>Essential steps before your next interview round</p>
                                    </div>
                                </div>
                                <div className={styles.checklistGrid}>
                                    {[
                                        { title: "Company Research", desc: "Understand their product, values, culture, and recent news announcements." },
                                        { title: "STAR Stories", desc: "Prepare 3-4 stories highlighting problem-solving and collaboration skills." },
                                        { title: "Smart Questions", desc: "Formulate 3 strategic questions for the team about their current bottlenecks." },
                                        { title: "Technical Prep", desc: "Double check your IDE, camera, microphone, and internet connection reliability." }
                                    ].map((item, idx) => (
                                        <div key={idx} className={styles.checklistItem}>
                                            <div className={styles.bulletCheck}><Check size={14} /></div>
                                            <div>
                                                <strong className={styles.checklistStepTitle}>{item.title}</strong>
                                                <p className={styles.checklistStepDesc}>{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ── 1-ON-1 CONSULTATION SECTION ── */}
            <section id="consultation-form" className={styles.consultationSection}>
                <div className="premium-container">
                    <div className={styles.formLayout}>
                        {/* Glassmorphic styled form card */}
                        <div className={`${styles.glassCard} ${styles.formCard}`}>
                            {submitted ? (
                                <div className={styles.successState}>
                                    <div className={styles.successIco}>
                                        <Check size={28} />
                                    </div>
                                    <h2 className={styles.successTitle}>Request Received!</h2>
                                    <p className={styles.successDesc}>
                                        Thank you, <strong>{form.fullName || 'there'}</strong>. A TalentMesh career specialist will reach out to you within 24–48 hours.
                                    </p>
                                    <div className={styles.successBadge}>
                                        <Clock size={16} /> <span>24–48 hr response</span>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                                    <h2 className={styles.formTitle}>Request My <span className={styles.highlightText}>Career Consultation</span></h2>
                                    <p className={styles.formNote}>All fields required unless marked <em>(optional)</em></p>

                                    <div className={styles.formTrustNote}>
                                        <Clock size={16} />
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
                                                placeholder="Select status"
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
                                            <input required className={styles.input} type="text" placeholder="e.g. FinTech, Creative" value={form.industry} onChange={e => set('industry', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* SECTION 3: CONSULTATION DETAILS */}
                                    <div className={styles.formSectionHeader}>
                                        <span className={styles.formSectionNumber}>03</span>
                                        <h3 className={styles.formSectionTitle}>Consultation Details</h3>
                                    </div>
                                    <div className={styles.formSectionDivider} />

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

                        {/* Glassmorphic styled sidebar */}
                        <div className={styles.minimalAside}>
                            <div className={`${styles.glassCard} ${styles.asideInfoCard}`}>
                                <h3 className={styles.asideTitle}>What you get</h3>
                                {['Personalised career roadmap', '1-on-1 specialist call', 'Tailored job search strategy', 'Resume & LinkedIn review tips', 'Salary benchmarking insights'].map(item => (
                                    <div key={item} className={styles.asideItem}>
                                        <span className={styles.asideCheck}><Check size={14} /></span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={`${styles.glassCard} ${styles.asideStatsCard}`}>
                                <div className={styles.asideStatItem}>
                                    <div className={styles.asideStatVal}>500+</div>
                                    <div className={styles.asideStatLabel}>GUIDED</div>
                                </div>
                                <div className={styles.asideStatItem}>
                                    <div className={styles.asideStatVal}>94%</div>
                                    <div className={styles.asideStatLabel}>SUCCESS</div>
                                </div>
                                <div className={styles.asideStatItem}>
                                    <div className={styles.asideStatVal}>48hr</div>
                                    <div className={styles.asideStatLabel}>RESPONSE</div>
                                </div>
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
                            tag="Process"
                            title={<>How It <span className={styles.highlightText}>Works</span></>}
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
                            tag="Testimonials"
                            title={<>What Candidates <span className={styles.highlightText}>Say</span></>}
                            description="Trusted by hundreds of professionals seeking their next career milestone."
                        />
                        <div className={styles.testiGrid}>
                            {TESTIMONIALS.map((t, i) => (
                                <div key={i} className={`${styles.glassCard} ${styles.testiCard}`}>
                                    <p className={styles.quote}>&ldquo;{t.quote}&rdquo;</p>
                                    <div className={styles.author}>
                                        <div className={styles.authorAvatar}>
                                            {t.name.split(' ').map(w => w[0]).join('')}
                                        </div>
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
            <AnimateOnScroll animation="scaleUp">
                <CTA 
                    glass
                    title={<>Ready to Level Up Your <span className="text-gradient">Career?</span></>}
                    description="Connect with our industry mentors and land your dream tech role faster."
                    buttonText="Request a Consultation"
                    buttonLink="#consultation-form"
                />
            </AnimateOnScroll>
        </main>
    );
}
