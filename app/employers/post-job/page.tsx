'use client';
import React, { useState } from 'react';
import styles from './post-job.module.css';
import { CustomSelect } from '@/components/ui/CustomSelect';

const SparkleIco = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915Z" /></svg>;
const CheckIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;

const JOB_TYPES = ['Full-Time', 'Part-Time', 'Remote', 'Hybrid', 'Contract'];
const INDUSTRIES = ['Technology', 'Product', 'Design', 'Finance', 'Sales & Marketing', 'HR & People', 'Operations', 'Customer Success'];
const EXP_LEVELS = ['Entry Level', 'Mid Level', 'Senior', 'Lead / Manager', 'Director+'];
const VALUE_PROPS = [
    { icon: '🎯', stat: '10,000+', label: 'Active Candidates', desc: 'Reach pre-qualified talent instantly' },
    { icon: '🤖', stat: 'AI', label: 'Smart Matching', desc: 'AI matches jobs to the most relevant talent' },
    { icon: '✅', stat: 'Free', label: 'Free to Post', desc: 'Premium boosting available when needed' },
    { icon: '📋', stat: 'All-in-1', label: 'Application Dashboard', desc: 'Manage all applicants in one place' },
];

const PREVIEW_DEFAULTS = {
    title: 'Your Job Title', company: 'Your Company', location: 'Remote', type: 'Full-Time',
    salary: '$80k–$120k', skills: [] as string[], exp: 'Mid Level',
};

export default function PostJobPage() {
    const [step, setStep] = useState(0);
    const [remote, setRemote] = useState(true);
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiGenerated, setAiGenerated] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        title: '', company: '', industry: '', location: '', salary: '', exp: '', description: '', deadline: ''
    });

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !skills.includes(s)) setSkills(p => [...p, s]);
        setSkillInput('');
    };

    const handleAiGenerate = () => {
        setAiLoading(true);
        setTimeout(() => {
            setForm(p => ({
                ...p, description:
                    `We are looking for a talented ${form.title || 'professional'} to join our growing team at ${form.company || 'our company'}.\n\nResponsibilities:\n• Design, develop and maintain robust solutions\n• Collaborate cross-functionally with product and design teams\n• Champion best practices and mentor junior team members\n• Drive outcomes through data-informed decision making\n\nRequirements:\n${skills.length ? skills.map(s => `• ${s}`).join('\n') : '• Relevant skills and experience'}\n• Strong communication and problem-solving skills\n• Passion for building impactful products\n\nWhat we offer:\n• Competitive compensation ${form.salary ? `(${form.salary})` : ''}\n• Flexible remote-first culture\n• Professional growth budget\n• Collaborative and inclusive team`
            }));
            setAiLoading(false); setAiGenerated(true);
        }, 1800);
    };

    const preview = {
        title: form.title || PREVIEW_DEFAULTS.title,
        company: form.company || PREVIEW_DEFAULTS.company,
        location: remote ? 'Remote' : form.location || PREVIEW_DEFAULTS.location,
        type: form.exp || JOB_TYPES[0],
        salary: form.salary || PREVIEW_DEFAULTS.salary,
        skills,
        exp: form.exp || PREVIEW_DEFAULTS.exp,
    };

    const STEPS = ['Details', 'Description', 'Preview'];

    return (
        <main className={styles.page}>
            {/* ── HERO ── */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroLayout}>
                        <div className={styles.heroLeft}>
                            <div className={styles.heroBadge}><SparkleIco /> AI-Powered</div>
                            <h1 className={styles.heroTitle}>Post a Job.<br />Let AI Find Your Perfect Hire.</h1>
                            <p className={styles.heroSub}>Create a high-quality job listing in under 2 minutes. Our AI generates the description — you just fill in the basics.</p>
                            <button className={styles.heroCta} onClick={() => document.getElementById('post-form')?.scrollIntoView({ behavior: 'smooth' })}>
                                Post a Job for Free <span className={styles.freeBadge}>FREE</span>
                            </button>
                        </div>
                        {/* Live preview card */}
                        <div className={`${styles.previewCard} glass-card`}>
                            <div className={styles.previewHead}>
                                <div className={styles.previewLogo}>{preview.company.slice(0, 2).toUpperCase()}</div>
                                <div>
                                    <div className={styles.previewTitle}>{preview.title}</div>
                                    <div className={styles.previewCompany}>{preview.company}</div>
                                </div>
                            </div>
                            <div className={styles.previewMeta}>
                                <span>📍 {preview.location}</span>
                                <span>💼 {preview.exp}</span>
                            </div>
                            <div className={styles.previewTags}>
                                <span className={styles.previewTag}>{preview.salary}</span>
                                {skills.slice(0, 3).map(s => <span key={s} className={styles.previewSkill}>{s}</span>)}
                            </div>
                            <div className={styles.previewLabel}>Live Preview</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FORM ── */}
            <section className={styles.formSection} id="post-form">
                <div className="premium-container">
                    <div className={styles.formWrap}>

                        {/* Progress */}
                        <div className={styles.progressBar}>
                            {STEPS.map((s, i) => (
                                <React.Fragment key={s}>
                                    <div className={`${styles.progressStep} ${i <= step ? styles.progressStepActive : ''}`} onClick={() => i < step && setStep(i)}>
                                        <div className={styles.progressDot}>{i < step ? <CheckIco /> : i + 1}</div>
                                        <span className={styles.progressLabel}>{s}</span>
                                    </div>
                                    {i < STEPS.length - 1 && <div className={`${styles.progressLine} ${i < step ? styles.progressLineFill : ''}`} />}
                                </React.Fragment>
                            ))}
                        </div>

                        {submitted ? (
                            <div className={styles.success}>
                                <div className={styles.successIco}><CheckIco /></div>
                                <h2 className={styles.successTitle}>Job Posted Successfully!</h2>
                                <p className={styles.successDesc}>Your listing is now live. Our AI is already matching candidates to your role.</p>
                                <button className={styles.successBtn} onClick={() => { setSubmitted(false); setStep(0); }}>Post Another Job</button>
                            </div>
                        ) : (
                            <>
                                {/* STEP 0 — Details */}
                                {step === 0 && (
                                    <div className={styles.formStep}>
                                        <h2 className={styles.stepHdr}>Job Details</h2>
                                        <div className={styles.fieldRow}>
                                            <div className={styles.field}>
                                                <label className={styles.lbl}>Job Title *</label>
                                                <input className={styles.input} placeholder="e.g. Senior Product Designer" value={form.title} onChange={e => set('title', e.target.value)} />
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.lbl}>Company Name *</label>
                                                <input className={styles.input} placeholder="Your Company" value={form.company} onChange={e => set('company', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className={styles.field}>
                                                <label className={styles.lbl}>Industry / Department</label>
                                                <CustomSelect
                                                    className={styles.select}
                                                    value={form.industry || ''}
                                                    onChange={e => set('industry', e.target.value)}
                                                    options={INDUSTRIES}
                                                    placeholder="Select industry"
                                                />
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.lbl}>Experience Level</label>
                                                <CustomSelect
                                                    className={styles.select}
                                                    value={form.exp || ''}
                                                    onChange={e => set('exp', e.target.value)}
                                                    options={EXP_LEVELS}
                                                    placeholder="Select level"
                                                />
                                            </div>
                                        </div>

                                        {/* Location toggle */}
                                        <div className={styles.field}>
                                            <label className={styles.lbl}>Location</label>
                                            <div className={styles.locationToggle}>
                                                <button className={`${styles.toggleBtn} ${remote ? styles.toggleActive : ''}`} onClick={() => setRemote(true)}>Remote</button>
                                                <button className={`${styles.toggleBtn} ${!remote ? styles.toggleActive : ''}`} onClick={() => setRemote(false)}>Specific City</button>
                                            </div>
                                            {!remote && <input className={`${styles.input} ${styles.mt8}`} placeholder="e.g. Bangalore, KA" value={form.location} onChange={e => set('location', e.target.value)} />}
                                        </div>

                                        <div className={styles.fieldRow}>
                                            <div className={styles.field}>
                                                <label className={styles.lbl}>Salary Range <em className={styles.opt}>(optional)</em></label>
                                                <input className={styles.input} placeholder="e.g. $80k–$120k" value={form.salary} onChange={e => set('salary', e.target.value)} />
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.lbl}>Application Deadline</label>
                                                <input className={styles.input} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
                                            </div>
                                        </div>

                                        {/* Skills tag input */}
                                        <div className={styles.field}>
                                            <label className={styles.lbl}>Required Skills</label>
                                            <div className={styles.skillsWrap}>
                                                {skills.map(s => (
                                                    <span key={s} className={styles.skillTag}>{s}<button onClick={() => setSkills(p => p.filter(x => x !== s))}>×</button></span>
                                                ))}
                                                <input className={styles.skillInput} placeholder="Type skill + Enter"
                                                    value={skillInput} onChange={e => setSkillInput(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                                            </div>
                                        </div>

                                        <button className={styles.nextBtn} onClick={() => setStep(1)}>Continue to Description →</button>
                                    </div>
                                )}

                                {/* STEP 1 — Description */}
                                {step === 1 && (
                                    <div className={styles.formStep}>
                                        <h2 className={styles.stepHdr}>Job Description</h2>
                                        <div className={styles.aiRow}>
                                            <p className={styles.aiHint}>Let AI write your job description based on the details you filled in.</p>
                                            <button className={styles.aiBtn} onClick={handleAiGenerate} disabled={aiLoading}>
                                                {aiLoading ? <span className={styles.aiSpinner} /> : <SparkleIco />}
                                                {aiLoading ? 'Generating...' : '✦ AI Generate Description'}
                                            </button>
                                        </div>
                                        <textarea className={`${styles.textarea} ${aiGenerated ? styles.textareaAi : ''}`}
                                            rows={14} placeholder="Or write your job description here..."
                                            value={form.description} onChange={e => set('description', e.target.value)} />
                                        {aiGenerated && <div className={styles.aiNote}><SparkleIco /> AI-generated — review and edit before posting</div>}
                                        <div className={styles.stepBtns}>
                                            <button className={styles.backBtn} onClick={() => setStep(0)}>← Back</button>
                                            <button className={styles.nextBtn} onClick={() => setStep(2)}>Preview Job →</button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2 — Preview */}
                                {step === 2 && (
                                    <div className={styles.formStep}>
                                        <h2 className={styles.stepHdr}>Preview Your Listing</h2>
                                        <div className={styles.finalPreview}>
                                            <div className={styles.fpHead}>
                                                <div className={styles.fpLogo}>{preview.company.slice(0, 2).toUpperCase()}</div>
                                                <div>
                                                    <div className={styles.fpTitle}>{preview.title}</div>
                                                    <div className={styles.fpMeta}>{preview.company} · {preview.location}</div>
                                                </div>
                                            </div>
                                            <div className={styles.fpBadges}>
                                                <span className={styles.fpBadge}>{preview.exp}</span>
                                                {preview.salary && <span className={styles.fpBadge}>{preview.salary}</span>}
                                                {skills.slice(0, 4).map(s => <span key={s} className={styles.fpSkill}>{s}</span>)}
                                            </div>
                                            <div className={styles.fpDesc}>{form.description || 'No description yet.'}</div>
                                        </div>
                                        <div className={styles.stepBtns}>
                                            <button className={styles.backBtn} onClick={() => setStep(1)}>← Edit</button>
                                            <button className={styles.postBtn} onClick={() => setSubmitted(true)}>🚀 Post This Job</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ── VALUE PROPS ── */}
            <section className={styles.valueSection}>
                <div className="premium-container">
                    <h2 className={styles.valueSectionTitle}>Why Post on TalentMesh?</h2>
                    <div className={styles.valueGrid}>
                        {VALUE_PROPS.map(vp => (
                            <div key={vp.label} className={styles.valueProp}>
                                <div className={styles.valuePropIcoBg}><span className={styles.valuePropIco}>{vp.icon}</span></div>
                                <div className={styles.valueStat}>{vp.stat}</div>
                                <div className={styles.valueLabel}>{vp.label}</div>
                                <div className={styles.valueDesc}>{vp.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
