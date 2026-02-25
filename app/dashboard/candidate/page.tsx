'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchCandidateDashboard, saveJob } from '@/lib/api/dashboard';
import type { CandidateDashboardData, Application, JobRecommendation, SkillGap } from '@/types/dashboard';
import styles from './candidate.module.css';

// ─── Icons ───────────────────────────────────────────────────────────────────
const Ico = {
    Refresh: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
    Sparkle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915Z" /></svg>,
    Calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    Brief: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    Chart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    Trend: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    Heart: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    HeartO: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    Video: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
    Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    Dot: () => <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor" /></svg>,
    Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Skeleton({ h = 100 }: { h?: number }) {
    return <div className={styles.skeleton} style={{ height: `${h}px` }} aria-hidden="true" />;
}

function MatchRing({ score, size = 50 }: { score: number; size?: number }) {
    const r = (size / 2) - 5; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
    const color = score >= 90 ? '#10b981' : score >= 75 ? 'var(--primary-blue)' : 'var(--medium-grey)';
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Match score ${score}%`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--alice-blue)" strokeWidth="5" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
                fontSize={size * 0.23} fontWeight="800" fill={color}>{score}</text>
        </svg>
    );
}

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

function AppPipeline({ stageIndex, status }: { stageIndex: number; status: string }) {
    if (status === 'rejected') return <div className={styles.rejectedTrack}>Application closed</div>;
    if (status === 'withdrawn') return <div className={styles.rejectedTrack}>Withdrawn</div>;
    return (
        <div className={styles.appPipeline} aria-label={`Application stage: ${STAGES[stageIndex]}`}>
            {STAGES.map((s, i) => (
                <React.Fragment key={s}>
                    <div className={`${styles.pipeNode} ${i < stageIndex ? styles.pipeNodeDone : i === stageIndex ? styles.pipeNodeActive : styles.pipeNodeFuture}`}
                        title={s}>
                        {i < stageIndex ? <Ico.Check /> : i === stageIndex ? <Ico.Dot /> : null}
                    </div>
                    {i < STAGES.length - 1 && <div className={`${styles.pipeEdge} ${i < stageIndex ? styles.pipeEdgeDone : ''}`} />}
                </React.Fragment>
            ))}
        </div>
    );
}

// ─── CANDIDATE DASHBOARD ──────────────────────────────────────────────────────
const CANDIDATE_ID = 'candidate-001';

export default function CandidateDashboard() {
    const [data, setData] = useState<CandidateDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
    const [appTab, setAppTab] = useState<'active' | 'all'>('active');
    const [gapFilter, setGapFilter] = useState<'all' | 'critical' | 'high'>('all');

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const d = await fetchCandidateDashboard(CANDIDATE_ID);
            setData(d);
            setLastUpdated(new Date());
            const initSaved = new Set(d.recommendations.filter(r => r.saved).map(r => r.id));
            setSavedJobs(initSaved);
        } catch (e) { setError(e instanceof Error ? e.message : 'Load failed.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const displayApps = useMemo(() =>
        appTab === 'active'
            ? (data?.applications ?? []).filter(a => a.status === 'active' || a.status === 'offered')
            : data?.applications ?? [],
        [data, appTab]);

    const displayGaps = useMemo(() =>
        gapFilter === 'all' ? data?.skillGaps ?? []
            : (data?.skillGaps ?? []).filter(g => g.priority === gapFilter),
        [data, gapFilter]);

    const toggleSave = useCallback(async (id: string) => {
        setSavedJobs(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
        await saveJob(id, !savedJobs.has(id));
    }, [savedJobs]);

    const PRIORITY_COLOR: Record<string, string> = {
        critical: '#dc2626', high: '#d97706', medium: 'var(--primary-blue)', low: 'var(--medium-grey)',
    };

    const STAGE_COLOR: Record<string, string> = {
        active: 'var(--primary-blue)', offered: '#10b981', rejected: '#dc2626',
        withdrawn: 'var(--medium-grey)', accepted: '#10b981',
    };

    if (error) return (
        <div className={styles.errorState} role="alert">
            <span>⚠ {error}</span>
            <button onClick={load} className={styles.retryBtn}>Retry</button>
        </div>
    );

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>My Career Dashboard</h1>
                    <p className={styles.pageSub}>{lastUpdated ? `Synced ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}</p>
                </div>
                <div className={styles.pageActions}>
                    <button className={styles.refreshBtn} onClick={load} disabled={loading}><Ico.Refresh />{loading ? 'Loading…' : 'Refresh'}</button>
                    <button className={styles.primaryBtn}>Browse Jobs</button>
                </div>
            </div>

            {/* Top row: Profile Card + KPI Strip */}
            <div className={styles.topRow}>
                {/* Profile Card */}
                {loading ? <div className={styles.profileCard}><Skeleton h={100} /></div> : (
                    <div className={styles.profileCard}>
                        <div className={styles.profileTop}>
                            <div className={styles.profileAvatar}>{data!.profile.avatar}</div>
                            <div className={styles.profileInfo}>
                                <div className={styles.profileName}>{data!.profile.name}</div>
                                <div className={styles.profileRole}>{data!.profile.role}</div>
                            </div>
                            <div className={styles.profileViews}><Ico.Eye />{data!.profile.views7d} profile views</div>
                        </div>
                        <div className={styles.profileStrengthWrap}>
                            <div className={styles.pStrengthHdr}>
                                <span className={styles.pStrengthLabel}>Profile Strength</span>
                                <span className={styles.pStrengthPct}>{data!.profile.profileStrength}%</span>
                            </div>
                            <div className={styles.pStrengthTrack}>
                                <div className={styles.pStrengthFill} style={{ width: `${data!.profile.profileStrength}%` }} />
                            </div>
                            <div className={styles.pCompletionList}>
                                {data!.profile.completionItems.map(item => (
                                    <div key={item.label} className={`${styles.pCompItem} ${item.done ? styles.pCompItemDone : ''}`}>
                                        <span className={styles.pCompIcon}>{item.done ? '✓' : '○'}</span>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* KPI Strip */}
                <div className={styles.kpiGrid}>
                    {loading ? [1, 2, 3, 4, 5, 6].map(i => <div key={i} className={styles.kpiCard}><Skeleton h={60} /></div>) : [
                        { label: 'Applications', value: data!.kpis.totalApplications, trend: '+6', up: true, icon: '📋' },
                        { label: 'Interviews', value: data!.kpis.interviewsScheduled, trend: '+2', up: true, icon: '🤝' },
                        { label: 'Profile Views (7d)', value: data!.kpis.profileViews, trend: '+23', up: true, icon: '👁' },
                        { label: 'Response Rate', value: `${data!.kpis.responseRate}%`, trend: '+8%', up: true, icon: '%' },
                        { label: 'Saved Jobs', value: data!.kpis.savedJobs, trend: '+4', up: true, icon: '♡' },
                        { label: 'Offers', value: data!.kpis.offersReceived, trend: '+1', up: true, icon: '🎉' },
                    ].map(k => (
                        <div key={k.label} className={styles.kpiCard}>
                            <div className={styles.kpiEmoji}>{k.icon}</div>
                            <div className={styles.kpiValue}>{k.value}</div>
                            <div className={styles.kpiLabel}>{k.label}</div>
                            <div className={`${styles.kpiTrend} ${k.up ? styles.trendUp : styles.trendDown}`}><Ico.Trend />{k.trend}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main 2-col grid */}
            <div className={styles.mainGrid}>
                {/* COL A */}
                <div className={styles.colA}>

                    {/* Applications */}
                    <section className={styles.panel} aria-labelledby="apps-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="apps-h"><Ico.Brief /> My Applications</h2>
                            <div className={styles.tabRow}>
                                {(['active', 'all'] as const).map(t => (
                                    <button key={t} className={`${styles.tab} ${appTab === t ? styles.tabActive : ''}`} onClick={() => setAppTab(t)}>
                                        {t === 'active' ? 'Active' : 'All'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {loading ? <Skeleton h={200} /> : (
                            <div className={styles.appList}>
                                {displayApps.map(a => (
                                    <div key={a.id} className={`${styles.appCard} ${a.status === 'offered' ? styles.appCardOffer : ''}`}>
                                        {a.status === 'offered' && <div className={styles.offerBanner}>🎉 Offer Received!</div>}
                                        <div className={styles.appCardTop}>
                                            <div className={styles.appCompLogo} style={{ background: a.companyColor }}>{a.companyInitials}</div>
                                            <div className={styles.appInfo}>
                                                <div className={styles.appJobTitle}>{a.jobTitle}</div>
                                                <div className={styles.appCompany}>{a.company} · {a.location} · {a.type}</div>
                                            </div>
                                            <div className={styles.appMeta}>
                                                <div className={styles.appSalary}>{a.salary}</div>
                                                <div className={styles.appUpdated}>Updated {a.lastUpdate}</div>
                                            </div>
                                            <MatchRing score={a.aiMatchScore} size={52} />
                                        </div>
                                        <AppPipeline stageIndex={a.stageIndex} status={a.status} />
                                        <div className={styles.appStageLabel}>
                                            <span>Stage: <strong style={{ color: STAGE_COLOR[a.status] }}>{a.stage}</strong></span>
                                            <span className={styles.nextAction}>→ {a.nextAction}</span>
                                        </div>
                                    </div>
                                ))}
                                {displayApps.length === 0 && <div className={styles.emptyMsg}>No applications to show.</div>}
                            </div>
                        )}
                    </section>

                    {/* Skill Gap Analyser */}
                    <section className={styles.panel} aria-labelledby="gap-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="gap-h"><Ico.Chart /> Skill Gap Analyser</h2>
                            <div className={styles.tabRow}>
                                {(['all', 'critical', 'high'] as const).map(t => (
                                    <button key={t} className={`${styles.tab} ${gapFilter === t ? styles.tabActive : ''}`} onClick={() => setGapFilter(t)}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.aiNudge}><Ico.Sparkle /><span>AI identified <strong>{data?.skillGaps.filter(g => g.priority === 'critical').length ?? '-'} critical gaps</strong> for your target roles</span></div>
                        {loading ? <Skeleton h={180} /> : (
                            <div className={styles.gapList}>
                                {displayGaps.map(g => (
                                    <div key={g.skill} className={styles.gapRow}>
                                        <div className={styles.gapTop}>
                                            <span className={styles.gapSkill}>{g.skill}</span>
                                            <span className={styles.gapCat}>{g.category}</span>
                                            <span className={styles.gapPriority} style={{ color: PRIORITY_COLOR[g.priority], background: `${PRIORITY_COLOR[g.priority]}12` }}>
                                                {g.priority}
                                            </span>
                                        </div>
                                        <div className={styles.gapBars}>
                                            <div className={styles.gapBarWrap}>
                                                <div className={styles.gapBarFill} style={{ width: `${g.current}%`, background: PRIORITY_COLOR[g.priority] }} />
                                                <div className={styles.gapBarTarget} style={{ left: `${g.required}%` }} />
                                            </div>
                                            <div className={styles.gapBarLegend}>
                                                <span>You: {g.current}%</span>
                                                <span>Required: {g.required}%</span>
                                            </div>
                                        </div>
                                        {g.resources && (
                                            <div className={styles.gapResource}>
                                                <Ico.Search /> Recommended: <strong>{g.resources}</strong>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* COL B */}
                <div className={styles.colB}>

                    {/* AI Job Recommendations */}
                    <section className={styles.panel} aria-labelledby="reco-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="reco-h"><Ico.Sparkle /> AI Job Matches</h2>
                            <span className={styles.aiBadge}><Ico.Sparkle />Aura v3</span>
                        </div>
                        {loading ? <Skeleton h={260} /> : (
                            <div className={styles.recoList}>
                                {data?.recommendations.map(r => (
                                    <div key={r.id} className={`${styles.recoCard} ${r.matchScore >= 90 ? styles.recoCardTop : ''}`}>
                                        <div className={styles.recoTop}>
                                            <div className={styles.recoLogo} style={{ background: r.companyColor }}>{r.companyInitials}</div>
                                            <div className={styles.recoInfo}>
                                                <div className={styles.recoTitle}>{r.title}</div>
                                                <div className={styles.recoCompany}>{r.company} · {r.location}</div>
                                            </div>
                                            <div className={styles.recoRight}>
                                                <MatchRing score={r.matchScore} size={46} />
                                                <button
                                                    className={`${styles.saveBtn} ${savedJobs.has(r.id) ? styles.saveBtnActive : ''}`}
                                                    onClick={() => toggleSave(r.id)}
                                                    aria-pressed={savedJobs.has(r.id)}
                                                    aria-label={savedJobs.has(r.id) ? 'Unsave job' : 'Save job'}>
                                                    {savedJobs.has(r.id) ? <Ico.Heart /> : <Ico.HeartO />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.recoMeta}>
                                            <span className={styles.recoSalary}>{r.salary}</span>
                                            <span className={styles.recoType}>{r.type}</span>
                                            <span className={styles.recoPosted}>{r.postedDays}d ago</span>
                                        </div>
                                        <div className={styles.recoSkills}>
                                            {r.skills.map(s => <span key={s} className={styles.recoSkill}>{s}</span>)}
                                        </div>
                                        <div className={styles.recoReason}><Ico.Sparkle />{r.reason}</div>
                                        <button className={styles.applyBtn}>Apply Now</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Upcoming Interviews */}
                    <section className={styles.panel} aria-labelledby="ivs-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="ivs-h"><Ico.Calendar /> Upcoming Interviews</h2>
                            <span className={styles.countBadge}>{data?.interviews.length ?? 0}</span>
                        </div>
                        {loading ? <Skeleton h={160} /> : (
                            <div className={styles.ivList}>
                                {data?.interviews.map(iv => (
                                    <div key={iv.id} className={styles.ivCard}>
                                        <div className={styles.ivDate}>
                                            <div className={styles.ivMon}>{iv.date.split(' ')[1]}</div>
                                            <div className={styles.ivDay}>{iv.date.split(' ')[2]}</div>
                                        </div>
                                        <div className={styles.ivBody}>
                                            <div className={styles.ivRole}>{iv.role}</div>
                                            <div className={styles.ivTime}>{iv.time} · {iv.duration}</div>
                                            <div className={styles.ivTags}>
                                                <span className={styles.ivType}><Ico.Video />{iv.type}</span>
                                                {iv.aiSuggested && <span className={styles.aiTag}><Ico.Sparkle />AI Slot</span>}
                                            </div>
                                        </div>
                                        <div className={styles.ivRight}>
                                            {iv.meetingLink
                                                ? <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className={styles.joinBtn}>Join Meeting</a>
                                                : <span className={styles.pendingBtn}>Link Pending</span>}
                                        </div>
                                    </div>
                                ))}
                                {(data?.interviews?.length ?? 0) === 0 && <div className={styles.emptyMsg}>No interviews scheduled.</div>}
                            </div>
                        )}
                    </section>

                    {/* Activity Timeline */}
                    <section className={styles.panel} aria-labelledby="feed-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="feed-h"><Ico.Activity /> Recent Activity</h2>
                            <span className={styles.liveTag}><Ico.Dot />Live</span>
                        </div>
                        {loading ? <Skeleton h={180} /> : (
                            <div className={styles.actList}>
                                {data?.activity.map(a => (
                                    <div key={a.id} className={styles.actItem}>
                                        <div className={`${styles.actAvatar} ${styles[`actT_${a.type}`]}`}>{a.actorAvatar}</div>
                                        <div className={styles.actBody}>
                                            <div className={styles.actTitle}>{a.title}</div>
                                            <div className={styles.actDesc}>{a.description}</div>
                                            {a.meta && <div className={styles.actMeta}>{a.meta}</div>}
                                        </div>
                                        <div className={styles.actTime}>{a.timeAgo}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
