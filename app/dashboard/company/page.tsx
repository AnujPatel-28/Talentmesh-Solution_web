'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchCompanyDashboard, confirmInterview } from '@/lib/api/dashboard';
import type { CompanyDashboardData } from '@/types/dashboard';
import styles from './company.module.css';

// ─── Icons ───────────────────────────────────────────────────────────────────
const Ico = {
    Refresh: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
    Sparkle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915Z" /></svg>,
    Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    Pie: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>,
    Brief: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    Video: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>,
    Trend: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    Warn: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    Dot: () => <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor" /></svg>,
};

// ─── Small Helpers ────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 70 }: { score: number; size?: number }) {
    const r = (size / 2) - 7; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`AI score ${score}%`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--alice-blue)" strokeWidth="6" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary-blue)" strokeWidth="6"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
                fontSize={size * 0.2} fontWeight="800" fill="var(--cobalt-blue)">{score}</text>
        </svg>
    );
}

function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={styles.skillBar}>
            <div className={styles.skillBarTop}><span>{label}</span><span style={{ color, fontWeight: 800 }}>{value}%</span></div>
            <div className={styles.skillBarTrack}><div className={styles.skillBarFill} style={{ width: `${value}%`, background: color }} /></div>
        </div>
    );
}

function Skeleton({ h = 120 }: { h?: number }) {
    return <div className={styles.skeleton} style={{ height: `${h}px` }} aria-hidden="true" />;
}

const COLOR_MAP: Record<string, string> = {
    'var(--dodger-blue)': '#2196F3', 'var(--ocean-deep)': '#1565C0', 'var(--cool-sky-2)': '#42A5F5',
    'var(--brilliant-azure)': '#1E88E5', 'var(--cobalt-blue)': '#0D47A1', 'var(--sky-blue)': '#90CAF9',
};

function DonutChart({ data }: { data: { label: string; pct: number; color: string }[] }) {
    const size = 148; const r = 55; const circ = 2 * Math.PI * r; let cum = 0;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Diversity chart">
            {data.map(d => {
                const dash = (d.pct / 100) * circ; const offset = -(cum / 100) * circ; cum += d.pct;
                return <circle key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={COLOR_MAP[d.color] || d.color} strokeWidth="21"
                    strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
            })}
            <circle cx={size / 2} cy={size / 2} r={r - 11} fill="white" />
            <text x="50%" y="46%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--cobalt-blue)">{data.length}</text>
            <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fill="#94a3b8">groups</text>
        </svg>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const COMPANY_ID = 'company-001';

export default function CompanyDashboard() {
    const [data, setData] = useState<CompanyDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [filterStage, setFilterStage] = useState<string | null>(null);
    const [divTab, setDivTab] = useState<'gender' | 'ethnicity' | 'education'>('gender');
    const [confirmedIvs, setConfirmedIvs] = useState<Set<string>>(new Set());
    const [jobTab, setJobTab] = useState<'active' | 'all'>('active');

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const d = await fetchCompanyDashboard(COMPANY_ID);
            setData(d); setLastUpdated(new Date());
        } catch (e) { setError(e instanceof Error ? e.message : 'Load failed.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filteredCandidates = useMemo(() =>
        filterStage ? (data?.pipeline.candidates ?? []).filter(c => c.stage === filterStage)
            : data?.pipeline.candidates ?? [],
        [data, filterStage]);

    const displayedJobs = useMemo(() =>
        jobTab === 'active' ? (data?.jobs ?? []).filter(j => j.status === 'active') : data?.jobs ?? [],
        [data, jobTab]);

    const confirmIv = useCallback(async (id: string) => {
        setConfirmedIvs(prev => new Set(prev).add(id));
        await confirmInterview(id);
    }, []);

    const STAGE_COLOR: Record<string, string> = {
        applied: '#94a3b8', screening: 'var(--dodger-blue)', interview: 'var(--brilliant-azure)',
        offer: 'var(--ocean-deep)', hired: '#10b981',
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
                    <h1 className={styles.pageTitle}>Company Recruiting Hub</h1>
                    <p className={styles.pageSub}>{lastUpdated ? `Synced ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}</p>
                </div>
                <div className={styles.pageActions}>
                    <button className={styles.refreshBtn} onClick={load} disabled={loading}><Ico.Refresh />{loading ? 'Loading…' : 'Refresh'}</button>
                    <button className={styles.primaryBtn}>+ Post Job</button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className={styles.kpiStrip}>
                {loading ? [1, 2, 3, 4, 5, 6].map(i => <div key={i} className={styles.kpiCard}><Skeleton h={60} /></div>) : [
                    { label: 'Active Jobs', value: data!.kpis.activeJobs, trend: '+2', up: true },
                    { label: 'Applicants', value: data!.kpis.totalApplicants, trend: '+18', up: true },
                    { label: 'Today Intervs.', value: data!.kpis.interviewsToday, trend: '+3', up: true },
                    { label: 'Avg Time→Hire', value: `${data!.kpis.avgTimeToHire}d`, trend: '-3d', up: true },
                    { label: 'Offer Accept', value: `${data!.kpis.offerAcceptRate}%`, trend: '+4%', up: true },
                    { label: 'Open Offers', value: data!.kpis.openOffers, trend: '+1', up: true },
                ].map(k => (
                    <div key={k.label} className={styles.kpiCard}>
                        <div className={styles.kpiValue}>{k.value}</div>
                        <div className={styles.kpiLabel}>{k.label}</div>
                        <div className={`${styles.kpiTrend} ${k.up ? styles.trendUp : styles.trendDown}`}><Ico.Trend />{k.trend}</div>
                    </div>
                ))}
            </div>

            {/* Main 2-col grid */}
            <div className={styles.mainGrid}>
                {/* COL A */}
                <div className={styles.colA}>

                    {/* Pipeline */}
                    <section className={styles.panel} aria-labelledby="pipeline-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="pipeline-h"><Ico.Users /> Candidate Pipeline</h2>
                            <button className={styles.ghostBtn} onClick={() => setFilterStage(null)}>
                                {filterStage ? 'Clear' : 'View all'}
                            </button>
                        </div>
                        {loading ? <Skeleton h={160} /> : (
                            <>
                                <div className={styles.funnel}>
                                    {data?.pipeline.stages.map((st, i) => {
                                        const max = data.pipeline.stages[0].count;
                                        const w = Math.max((st.count / max) * 100, 8);
                                        const next = data.pipeline.stages[i + 1];
                                        return (
                                            <button key={st.id}
                                                className={`${styles.funnelRow} ${filterStage === st.id ? styles.funnelActive : ''}`}
                                                onClick={() => setFilterStage(p => p === st.id ? null : st.id)}
                                                aria-pressed={filterStage === st.id}>
                                                <span className={styles.funnelLabel}>{st.label}</span>
                                                <div className={styles.funnelBarWrap}>
                                                    <div className={styles.funnelBarBg}>
                                                        <div className={styles.funnelBarFill} style={{ width: `${w}%`, background: st.color }} />
                                                    </div>
                                                </div>
                                                <span className={styles.funnelCount} style={{ color: st.color }}>{st.count}</span>
                                                {next && <span className={styles.funnelCvr}>{Math.round((next.count / st.count) * 100)}%→</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className={styles.candList}>
                                    {filteredCandidates.map(c => (
                                        <div key={c.id} className={styles.candRow}>
                                            <div className={styles.candAvatar}>{c.avatar}</div>
                                            <div className={styles.candInfo}>
                                                <div className={styles.candName}>
                                                    {c.name}
                                                    {c.urgent && <span className={styles.urgentTag}>Action needed</span>}
                                                </div>
                                                <div className={styles.candRole}>{c.role} · {c.location}</div>
                                            </div>
                                            <div className={styles.candMeta}>
                                                <span className={styles.stagePill} style={{ background: `${STAGE_COLOR[c.stage]}18`, color: STAGE_COLOR[c.stage] }}>{c.stage}</span>
                                                <span className={styles.aiScore}><Ico.Sparkle />{c.aiScore}%</span>
                                                <span className={styles.yoeTag}>{c.yearsExp}yr</span>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredCandidates.length === 0 && <div className={styles.emptyMsg}>No candidates in this stage.</div>}
                                </div>
                            </>
                        )}
                    </section>

                    {/* Jobs Table */}
                    <section className={styles.panel} aria-labelledby="jobs-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="jobs-h"><Ico.Brief /> Job Postings</h2>
                            <div className={styles.tabRow}>
                                {(['active', 'all'] as const).map(t => (
                                    <button key={t} className={`${styles.tab} ${jobTab === t ? styles.tabActive : ''}`} onClick={() => setJobTab(t)}>
                                        {t === 'active' ? 'Active' : 'All'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {loading ? <Skeleton h={180} /> : (
                            <div className={styles.jobsTable}>
                                <div className={styles.jobsTh}>
                                    <span>Role</span><span>Type</span><span>Applicants</span><span>AI Match</span><span>Status</span>
                                </div>
                                {displayedJobs.map(j => (
                                    <div key={j.id} className={styles.jobRow}>
                                        <div>
                                            <div className={styles.jobTitle}>{j.title}</div>
                                            <div className={styles.jobMeta}>{j.department} · {j.location}</div>
                                        </div>
                                        <span className={styles.jobType}>{j.type}</span>
                                        <div className={styles.jobApps}>
                                            <span>{j.applicants}</span>
                                            {j.newApplicants > 0 && <span className={styles.newTag}>+{j.newApplicants}</span>}
                                        </div>
                                        <div className={styles.matchCell}>
                                            <div className={styles.matchBar}><div className={styles.matchFill} style={{ width: `${j.aiMatchRate}%` }} /></div>
                                            <span className={styles.matchPct}>{j.aiMatchRate}%</span>
                                        </div>
                                        <span className={`${styles.statusPill} ${styles[`st_${j.status}`]}`}>{j.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* COL B */}
                <div className={styles.colB}>

                    {/* Interview Scheduler */}
                    <section className={styles.panel} aria-labelledby="sched-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="sched-h"><Ico.Calendar /> Interview Schedule</h2>
                            <button className={styles.ghostBtn}>+ New</button>
                        </div>
                        <div className={styles.weekStrip}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
                                <div key={d} className={`${styles.dayCell} ${i === 0 ? styles.dayCellActive : ''}`}>
                                    <div className={styles.dayName}>{d}</div>
                                    <div className={styles.dayNum}>{25 + i}</div>
                                    {i === 0 && <div className={styles.dayCellDot} />}
                                </div>
                            ))}
                        </div>
                        {loading ? <Skeleton h={220} /> : (
                            <div className={styles.slotList}>
                                {data?.interviews.map(s => (
                                    <div key={s.id} className={`${styles.slotCard} ${s.hasConflict ? styles.slotConflict : ''}`}>
                                        <div className={styles.slotLeft}>
                                            <div className={styles.slotTime}>{s.time}</div>
                                            <div className={styles.slotDate}>{s.date.split(' ').slice(0, 2).join(' ')}</div>
                                        </div>
                                        <div className={styles.slotCenter}>
                                            <div className={styles.slotName}>{s.candidateName}</div>
                                            <div className={styles.slotRole}>{s.role}</div>
                                            <div className={styles.slotTags}>
                                                <span className={styles.slotType}><Ico.Video />{s.type}</span>
                                                <span>{s.duration}</span>
                                                {s.aiSuggested && <span className={styles.aiTag}><Ico.Sparkle />AI</span>}
                                                {s.hasConflict && <span className={styles.conflictTag}><Ico.Warn />Conflict</span>}
                                            </div>
                                        </div>
                                        <div className={styles.slotRight}>
                                            {confirmedIvs.has(s.id)
                                                ? <div className={styles.confirmedBadge}><Ico.Check />Done</div>
                                                : <button className={s.hasConflict ? styles.rescheduleBtn : styles.confirmBtn}
                                                    onClick={() => !s.hasConflict && confirmIv(s.id)} disabled={s.hasConflict}>
                                                    {s.hasConflict ? 'Reschedule' : 'Confirm'}
                                                </button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className={styles.aiNudge}>
                            <Ico.Sparkle />
                            <span>AI found <strong>3 conflict-free</strong> slots tomorrow.</span>
                            <button className={styles.aiNudgeBtn}>Auto-schedule</button>
                        </div>
                    </section>

                    {/* Activity Feed */}
                    <section className={styles.panel} aria-labelledby="feed-h">
                        <div className={styles.panelHdr}>
                            <h2 className={styles.panelTitle} id="feed-h"><Ico.Activity /> Activity Feed</h2>
                            <span className={styles.liveTag}><Ico.Dot />Live</span>
                        </div>
                        {loading ? <Skeleton h={200} /> : (
                            <div className={styles.actList}>
                                {data?.activity.map(a => (
                                    <div key={a.id} className={styles.actItem}>
                                        <div className={`${styles.actAvatar} ${styles[`act_${a.type}`]}`}>{a.actorAvatar}</div>
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

            {/* AI Match Scorecard */}
            <section className={styles.panel} aria-labelledby="scorecard-h">
                <div className={styles.panelHdr}>
                    <h2 className={styles.panelTitle} id="scorecard-h"><Ico.Sparkle /> AI Match Scorecard — Top Candidates</h2>
                    <span className={styles.aiBadge}><Ico.Sparkle />AI Ranked · Aura v3</span>
                </div>
                {loading ? <Skeleton h={220} /> : (
                    <div className={styles.scorecardGrid}>
                        {data?.topCandidates.map((c, i) => (
                            <div key={c.id} className={`${styles.scCard} ${i === 0 ? styles.scCardTop : ''}`}>
                                {i === 0 && <div className={styles.topPickBanner}><Ico.Sparkle /> #1 AI Pick</div>}
                                {i > 0 && <div className={styles.rankTag}>#{i + 1}</div>}
                                <div className={styles.scTop}><ScoreRing score={c.aiScore} size={70} /><div>
                                    <div className={styles.scName}>{c.name}</div>
                                    <div className={styles.scRole}>{c.role}</div>
                                    <div className={styles.scMeta}>{c.yearsExp}yr · {c.location} · {c.salary}</div>
                                </div></div>
                                <SkillBar label="Skill Alignment" value={c.skillAlignment} color="var(--dodger-blue)" />
                                <SkillBar label="Experience Fit" value={c.experienceFit} color="var(--ocean-deep)" />
                                <SkillBar label="Cultural Match" value={c.culturalMatch} color="var(--brilliant-azure)" />
                                <div className={styles.scChips}>{c.skills.map(s => <span key={s} className={styles.scChip}>{s}</span>)}</div>
                                <button className={i === 0 ? styles.scBtnPrimary : styles.scBtnSecondary}>
                                    {i === 0 ? '⚡ Schedule Now' : 'Schedule Interview'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Diversity Analytics */}
            <section className={styles.panel} aria-labelledby="div-h">
                <div className={styles.panelHdr}>
                    <h2 className={styles.panelTitle} id="div-h"><Ico.Pie /> Diversity & Inclusion Analytics</h2>
                    <div className={styles.tabRow}>
                        {(['gender', 'ethnicity', 'education'] as const).map(t => (
                            <button key={t} className={`${styles.tab} ${divTab === t ? styles.tabActive : ''}`} onClick={() => setDivTab(t)}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                {loading ? <Skeleton h={180} /> : (
                    <div className={styles.divGrid}>
                        <div className={styles.divLeft}>
                            {divTab !== 'education'
                                ? <><DonutChart data={data?.diversity[divTab] ?? []} />
                                    <div className={styles.divLegend}>
                                        {(data?.diversity[divTab] ?? []).map(d => (
                                            <div key={d.label} className={styles.legendRow}>
                                                <div className={styles.legendDot} style={{ background: COLOR_MAP[d.color] || d.color }} />
                                                <span className={styles.legendLabel}>{d.label}</span>
                                                <span className={styles.legendPct}>{d.pct}%</span>
                                                <span className={styles.legendCount}>({d.count})</span>
                                            </div>
                                        ))}
                                    </div></>
                                : <div className={styles.eduBars}>
                                    {(data?.diversity.education ?? []).map(d => (
                                        <div key={d.label} className={styles.eduRow}>
                                            <span className={styles.eduLabel}>{d.label}</span>
                                            <div className={styles.eduBarWrap}><div className={styles.eduBarFill} style={{ width: `${d.pct}%` }} /></div>
                                            <span className={styles.eduPct}>{d.pct}%</span>
                                        </div>
                                    ))}
                                </div>}
                        </div>
                        <div className={styles.divRight}>
                            <div className={styles.incScore}>
                                <div className={styles.incVal}>{data?.diversity.inclusionScore}</div>
                                <div className={styles.incLabel}>Inclusion Score</div>
                                <div className={styles.incSub}>/100</div>
                            </div>
                            <div className={styles.goalArea}>
                                <div className={styles.goalLabel}>D&I Goal Progress</div>
                                <div className={styles.goalTrack}>
                                    <div className={styles.goalFill} style={{ width: `${data?.diversity.goalAchieved}%` }} />
                                    <div className={styles.goalMarker} style={{ left: `${data?.diversity.goalTarget}%` }} />
                                </div>
                                <div className={styles.goalMeta}>
                                    <span style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>{data?.diversity.goalAchieved}% achieved</span>
                                    <span style={{ color: 'var(--medium-grey)' }}>Goal: {data?.diversity.goalTarget}%</span>
                                </div>
                            </div>
                            <div className={styles.insightBox}>
                                <div className={styles.insightTitle}><Ico.Sparkle /> AI Inclusion Insights</div>
                                {(data?.diversity.insight ?? []).map((ins, i) => (
                                    <div key={i} className={styles.insightRow}>
                                        <div className={styles.insightDot} style={{ background: i === 1 ? '#f59e0b' : i === 2 ? '#10b981' : 'var(--dodger-blue)' }} />
                                        <span>{ins}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
