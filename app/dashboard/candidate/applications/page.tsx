"use client";
import React from 'react';
import styles from '../candidate.module.css';

/* ─── Icons ─── */
const IC = {
    filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    list: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    extLink: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
    mic: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>,
    moreV: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>,
};

export default function ApplicationsPage() {
    return (
        <div className={styles.pipelinePage}>
            <div className={styles.pipelineHead}>
                <div>
                    <h1 className={styles.pipelineTitle}>Application Pipeline</h1>
                    <p className={styles.pipelineSub}>Manage your candidate applications across different stages.</p>
                </div>
                <div className={styles.pipelineActions}>
                    <button className={styles.pipelineViewBtn}>{IC.list}</button>
                    <button className={`${styles.pipelineViewBtn} ${styles.pipelineViewBtnActive}`}>{IC.grid}</button>
                    <button className={styles.filterBtn}>{IC.filter} Filter</button>
                    <button className={styles.addAppBtn}>{IC.plus} Add Application</button>
                </div>
            </div>

            <div className={styles.kanban}>
                {/* APPLIED */}
                <div className={styles.kanbanCol}>
                    <div className={styles.kanbanHeader}>
                        <span className={styles.kanbanCount} style={{ background: 'var(--primary-blue)' }}>5</span>
                        APPLIED
                        <span style={{ marginLeft: 'auto', cursor: 'pointer' }}>{IC.moreV}</span>
                    </div>
                    {[
                        { company: 'Netflix', role: 'Senior Designer', logo: 'N', time: 'Applied 2d ago', color: '#e50914', dot: true },
                        { company: 'Spotify', role: 'Product Manager', logo: 'S', time: 'Applied 1d ago', color: '#1db954' },
                    ].map((c, i) => (
                        <div key={i} className={styles.kanbanCard}>
                            <div className={styles.kanbanCardHead}>
                                <div className={styles.kanbanLogo} style={{ background: c.color + '15', color: c.color }}>{c.logo}</div>
                                <div>
                                    <div className={styles.kanbanCompany}>{c.company}</div>
                                    <div className={styles.kanbanRole}>{c.role}</div>
                                </div>
                                <span style={{ marginLeft: 'auto', color: '#94a3b8', cursor: 'pointer' }}>{IC.moreV}</span>
                            </div>
                            <div className={styles.kanbanExtra}>{c.time} {c.dot && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginLeft: 4 }} />}</div>
                        </div>
                    ))}
                </div>

                {/* IN REVIEW */}
                <div className={styles.kanbanCol}>
                    <div className={styles.kanbanHeader}>
                        <span className={styles.kanbanCount} style={{ background: '#f59e0b' }}>3</span>
                        IN REVIEW
                        <span style={{ marginLeft: 'auto', cursor: 'pointer' }}>{IC.moreV}</span>
                    </div>
                    {[
                        { company: 'Google', role: 'Interaction Designer', logo: 'G', tag: 'Portfolio Check', tagBg: '#eff6ff', tagColor: 'var(--primary-blue)', time: 'Updated 4h ago', pending: true },
                        { company: 'Asana', role: 'Frontend Engineer', logo: 'A', time: 'Updated 3d ago' },
                    ].map((c, i) => (
                        <div key={i} className={styles.kanbanCard}>
                            <div className={styles.kanbanCardHead}>
                                <div className={styles.kanbanLogo}>{c.logo}</div>
                                <div>
                                    <div className={styles.kanbanCompany}>{c.company}</div>
                                    <div className={styles.kanbanRole}>{c.role}</div>
                                </div>
                                <span style={{ marginLeft: 'auto', color: '#94a3b8', cursor: 'pointer' }}>{IC.moreV}</span>
                            </div>
                            {c.tag && <span className={styles.kanbanTag} style={{ background: c.tagBg, color: c.tagColor }}>{c.tag}</span>}
                            <div className={styles.kanbanExtra}>
                                {c.time}
                                {c.pending && <span style={{ color: '#f59e0b', fontWeight: 600, marginLeft: 6 }}>Pending</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* INTERVIEW */}
                <div className={styles.kanbanCol}>
                    <div className={styles.kanbanHeader}>
                        <span className={styles.kanbanCount} style={{ background: '#7c3aed' }}>2</span>
                        INTERVIEW
                        <span style={{ marginLeft: 'auto', cursor: 'pointer' }}>{IC.moreV}</span>
                    </div>
                    <div className={styles.kanbanCard}>
                        <div className={styles.kanbanCardHead}>
                            <div className={styles.kanbanLogo} style={{ background: '#7c3aed15', color: '#7c3aed' }}>S</div>
                            <div>
                                <div className={styles.kanbanCompany}>Slack</div>
                                <div className={styles.kanbanRole}>Staff Designer</div>
                            </div>
                            <span style={{ marginLeft: 'auto', color: '#94a3b8', cursor: 'pointer' }}>{IC.moreV}</span>
                        </div>
                        <span className={styles.kanbanTag} style={{ background: '#f5f3ff', color: '#7c3aed' }}>{IC.mic} Technical Round</span>
                        <div className={styles.kanbanExtra}>Tomorrow at 10:00 AM</div>
                        <div className={styles.kanbanExtra}>Updated 2h ago</div>
                        <a href="#" className={styles.kanbanLink}>Prep Notes {IC.extLink}</a>
                    </div>
                    <div className={styles.kanbanCard}>
                        <div className={styles.kanbanCardHead}>
                            <div className={styles.kanbanLogo}>A</div>
                            <div>
                                <div className={styles.kanbanCompany}>Amazon</div>
                                <div className={styles.kanbanRole}>Product Designer II</div>
                            </div>
                        </div>
                        <div className={styles.kanbanExtra}>Awaiting Feedback</div>
                    </div>
                </div>

                {/* OFFER */}
                <div className={styles.kanbanCol}>
                    <div className={styles.kanbanHeader}>
                        <span className={styles.kanbanCount} style={{ background: '#10b981' }}>1</span>
                        OFFER
                        <span style={{ marginLeft: 'auto', cursor: 'pointer' }}>{IC.moreV}</span>
                    </div>
                    <div className={styles.kanbanCard}>
                        <div className={styles.kanbanCardHead}>
                            <div className={styles.kanbanLogo} style={{ background: '#0f172a', color: '#fff' }}>L</div>
                            <div>
                                <div className={styles.kanbanCompany}>Linear</div>
                                <div className={styles.kanbanRole}>Senior Designer</div>
                            </div>
                        </div>
                        <div className={styles.offerBanner}>
                            <div>
                                <div className={styles.offerLabel}>Offer Received!</div>
                                <div className={styles.offerExpiry}>Expires in 3 days</div>
                            </div>
                            <span className={styles.offerAmount}>$165k</span>
                        </div>
                        <a href="#" className={styles.kanbanLink}>Review Offer</a>
                    </div>
                    <button className={styles.editProfileBtn} style={{ borderStyle: 'dashed', color: '#94a3b8' }}>{IC.plus} Add to Offer</button>
                </div>
            </div>
        </div>
    );
}
