"use client";
import React from 'react';
import styles from '../candidate.module.css';

/* ─── Icons ─── */
const IC = {
    mapPin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    graduationCap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    extLink: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
    file: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    monitor: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
    link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
};

export default function ProfilePage() {
    return (
        <div className={styles.profilePage}>
            {/* Left Sidebar */}
            <div className={styles.profileSidebar}>
                <div className={styles.profileCard}>
                    <div className={styles.profileAvatar}>
                        SJ
                        <span className={styles.onlineDot} />
                    </div>
                    <span className={styles.profileName}>Sarah Jenkins</span>
                    <span className={styles.profileRole}>Senior UX Designer</span>
                    <span className={styles.profileLoc}>{IC.mapPin} San Francisco, CA</span>
                    <div className={styles.profileTags}>
                        <span className={styles.tag}>Figma</span>
                        <span className={styles.tag}>Prototyping</span>
                        <span className={styles.tag}>User Research</span>
                    </div>
                    <button className={styles.editProfileBtn}>{IC.edit} Edit Profile</button>
                </div>

                <div className={styles.scoreCard}>
                    <div className={styles.scoreHeader}>
                        <span className={styles.scoreTitle}>AI Profile Score</span>
                        <span className={styles.scoreBadge}>Top 5%</span>
                    </div>
                    <div className={styles.scoreRing}>
                        <div className={styles.scoreRingFill} />
                        <span className={styles.scoreNum}>85</span>
                        <span className={styles.scoreSub}>SCORE</span>
                    </div>
                    <span className={styles.scoreText}>Your profile is highly optimized for UX design roles.</span>
                    <div className={styles.openToggle}>
                        <div>
                            <span className={styles.openLabel}>Open to Work</span>
                            <span className={styles.openHint}>Visible to recruiters</span>
                        </div>
                        <button className={styles.toggleSwitch}>
                            <span className={styles.toggleDot} />
                        </button>
                    </div>
                </div>

                <div className={styles.contactCard}>
                    <span className={styles.contactTitle}>Contact Information</span>
                    <div className={styles.contactItem}>
                        <span className={styles.contactIcon}>{IC.mail}</span>
                        <div className={styles.contactMeta}>
                            <span className={styles.contactLabel}>Email</span>
                            <span className={styles.contactValue}>sarah.j@example.com</span>
                        </div>
                    </div>
                    <div className={styles.contactItem}>
                        <span className={styles.contactIcon}>{IC.phone}</span>
                        <div className={styles.contactMeta}>
                            <span className={styles.contactLabel}>Phone</span>
                            <span className={styles.contactValue}>+1 (555) 123-4567</span>
                        </div>
                    </div>
                    <div className={styles.contactItem}>
                        <span className={styles.contactIcon}>{IC.link}</span>
                        <div className={styles.contactMeta}>
                            <span className={styles.contactLabel}>Website</span>
                            <a href="#" className={styles.contactLink}>sarahux.design</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.profileMain}>
                <div className={styles.profileActions}>
                    <div className={styles.profileActionCard}>
                        <div>
                            <div className={styles.profileActionLabel}>{IC.file} Resume</div>
                            <div className={styles.profileActionHint}>Last updated 2 days ago</div>
                        </div>
                        <span style={{ color: 'var(--primary-blue)' }}>{IC.download}</span>
                    </div>
                    <div className={styles.profileActionCard}>
                        <div>
                            <div className={styles.profileActionLabel}>{IC.monitor} Portfolio</div>
                            <div className={styles.profileActionHint}>View case studies</div>
                        </div>
                        <span style={{ color: 'var(--primary-blue)' }}>{IC.extLink}</span>
                    </div>
                </div>

                {/* Experience */}
                <div className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{IC.briefcase} Experience</h2>
                        <button className={styles.addBtn}>+ Add</button>
                    </div>
                    {[
                        { title: 'Senior Product Designer', company: 'TechFlow Systems', period: 'Jan 2021 - Present · 3 yrs 2 mos', desc: 'Leading the design system initiative and overseeing product design for the enterprise dashboard. Collaborated with PMs and engineering to reduce user churn by 15%.', tags: ['Design Systems', 'Leadership'] },
                        { title: 'UX Designer', company: 'Creative Pulse Agency', period: 'Jun 2018 - Dec 2020 · 2 yrs 7 mos', desc: 'Designed mobile and web applications for fintech clients. Conducted user research and usability testing sessions.', tags: ['Mobile Design', 'Wireframing'] },
                    ].map((exp, i) => (
                        <div key={i} className={styles.expItem}>
                            <div className={styles.expIcon}>{exp.company[0]}</div>
                            <div className={styles.expBody}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className={styles.expTitle}>{exp.title}</span>
                                    <span style={{ color: '#94a3b8', cursor: 'pointer' }}>{IC.edit}</span>
                                </div>
                                <span className={styles.expCompany}>{exp.company}</span>
                                <span className={styles.kanbanExtra}>{exp.period}</span>
                                <p className={styles.expDesc}>{exp.desc}</p>
                                <div className={styles.expTags}>
                                    {exp.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Education */}
                <div className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{IC.graduationCap} Education</h2>
                        <button className={styles.addBtn}>+ Add</button>
                    </div>
                    <div className={styles.expItem}>
                        <div className={styles.expIcon} style={{ fontSize: '0.9rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                        </div>
                        <div className={styles.expBody}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className={styles.expTitle}>California College of the Arts</span>
                                <span style={{ color: '#94a3b8', cursor: 'pointer' }}>{IC.edit}</span>
                            </div>
                            <span className={styles.expCompany}>Bachelor of Fine Arts - Interaction Design</span>
                            <span className={styles.kanbanExtra}>2014 - 2018</span>
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className={styles.profileSection}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{IC.target} Skills</h2>
                        <button className={styles.addBtn}>+ Add</button>
                    </div>
                    <div className={styles.skillsGrid}>
                        <div className={styles.skillGroup}>
                            <span className={styles.skillGroupTitle}>TOP SKILLS</span>
                            <div className={styles.skillTags}>
                                {['UI/UX Design', 'Prototyping', 'Wireframing', 'Figma'].map(s => (
                                    <span key={s} className={styles.skillTag}>{s} {IC.check}</span>
                                ))}
                            </div>
                        </div>
                        <div className={styles.skillGroup}>
                            <span className={styles.skillGroupTitle}>TOOLS & TECHNOLOGIES</span>
                            <div className={styles.skillTags}>
                                {['Adobe XD', 'Sketch', 'HTML/CSS', 'Jira', 'Notion'].map(s => (
                                    <span key={s} className={styles.toolTag}>{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
