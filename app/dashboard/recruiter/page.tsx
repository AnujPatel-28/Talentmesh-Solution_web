"use client";
import React, { useState } from 'react';
import styles from './dashboard.module.css';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconUsers = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const IconSparkle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" />
    </svg>
);
const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const IconPieChart = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
);
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const IconClock = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
const IconTrend = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
);
const IconBell = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);
const IconGrid = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);
const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
);
const IconChevronDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const IconVideo = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

// ─── Data ──────────────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
    { id: 'applied', label: 'Applied', count: 84, color: 'var(--medium-grey)', bg: '#f1f5f9' },
    { id: 'screening', label: 'Screening', count: 31, color: 'var(--dodger-blue)', bg: 'var(--alice-blue)' },
    { id: 'interview', label: 'Interview', count: 14, color: 'var(--brilliant-azure)', bg: '#dbeafe' },
    { id: 'offer', label: 'Offer', count: 5, color: 'var(--ocean-deep)', bg: 'var(--icy-blue)' },
    { id: 'hired', label: 'Hired', count: 3, color: '#10b981', bg: '#d1fae5' },
];

const CANDIDATES_PIPELINE = [
    { id: 1, name: 'Priya Sharma', role: 'Senior Product Designer', stage: 'interview', avatar: 'PS', score: 94, since: '2d ago', urgent: true },
    { id: 2, name: 'James Okafor', role: 'Full-Stack Engineer', stage: 'offer', avatar: 'JO', score: 91, since: '1d ago', urgent: true },
    { id: 3, name: 'Lin Wei', role: 'Data Scientist', stage: 'screening', avatar: 'LW', score: 87, since: '4d ago', urgent: false },
    { id: 4, name: 'Amara Diallo', role: 'Marketing Lead', stage: 'applied', avatar: 'AD', score: 82, since: '6h ago', urgent: false },
    { id: 5, name: 'Carlos Rivera', role: 'DevOps Engineer', stage: 'interview', avatar: 'CR', score: 89, since: '3d ago', urgent: false },
    { id: 6, name: 'Sophie Müller', role: 'Finance Analyst', stage: 'hired', avatar: 'SM', score: 96, since: '1wk ago', urgent: false },
];

const TOP_CANDIDATES = [
    {
        name: 'Priya Sharma', avatar: 'PS', role: 'Senior Product Designer',
        overall: 94,
        skills: 97, experience: 91, cultural: 94,
        skills_detail: ['Figma', 'UX Research', 'Design Systems'],
        yoe: 6, location: 'London, UK', recommended: true,
    },
    {
        name: 'James Okafor', avatar: 'JO', role: 'Full-Stack Engineer',
        overall: 91,
        skills: 89, experience: 95, cultural: 88,
        skills_detail: ['React', 'Node.js', 'PostgreSQL'],
        yoe: 8, location: 'Lagos, NG', recommended: false,
    },
    {
        name: 'Carlos Rivera', avatar: 'CR', role: 'DevOps Engineer',
        overall: 89,
        skills: 93, experience: 84, cultural: 90,
        skills_detail: ['Kubernetes', 'AWS', 'Terraform'],
        yoe: 5, location: 'Madrid, ES', recommended: false,
    },
];

const CALENDAR_SLOTS = [
    { id: 1, candidate: 'Priya Sharma', role: 'Product Designer', time: 'Mon Feb 25, 10:00 AM', duration: '45 min', type: 'Video Call', ai: true, conflict: false },
    { id: 2, candidate: 'James Okafor', role: 'Full-Stack Engineer', time: 'Mon Feb 25, 2:00 PM', duration: '60 min', type: 'Technical Screen', ai: true, conflict: false },
    { id: 3, candidate: 'Carlos Rivera', role: 'DevOps Engineer', time: 'Tue Feb 26, 11:00 AM', duration: '45 min', type: 'Video Call', ai: false, conflict: true },
    { id: 4, candidate: 'Lin Wei', role: 'Data Scientist', time: 'Wed Feb 27, 3:30 PM', duration: '60 min', type: 'Panel Interview', ai: true, conflict: false },
];

const DIVERSITY_DATA = {
    gender: [
        { label: 'Women', pct: 44, color: 'var(--dodger-blue)' },
        { label: 'Men', pct: 51, color: 'var(--ocean-deep)' },
        { label: 'Non-binary', pct: 5, color: 'var(--cool-sky-2)' },
    ],
    ethnicity: [
        { label: 'Asian', pct: 31, color: 'var(--dodger-blue)' },
        { label: 'Black / African', pct: 22, color: 'var(--brilliant-azure)' },
        { label: 'Hispanic / Latino', pct: 18, color: 'var(--cobalt-blue)' },
        { label: 'White', pct: 24, color: 'var(--ocean-deep)' },
        { label: 'Other', pct: 5, color: 'var(--sky-blue)' },
    ],
    education: [
        { label: "Bachelor's", pct: 48 },
        { label: "Master's", pct: 36 },
        { label: 'PhD', pct: 9 },
        { label: 'Self-taught', pct: 7 },
    ],
};

const NAV_ITEMS = ['Dashboard', 'Pipeline', 'Candidates', 'Jobs', 'Analytics', 'Settings'];

// ─── Skill Bar ─────────────────────────────────────────────────────────────────
function SkillBar({ label, value, color = 'var(--primary-blue)' }: { label: string; value: number; color?: string }) {
    return (
        <div className={styles.skillBar}>
            <div className={styles.skillBarTop}>
                <span className={styles.skillBarLabel}>{label}</span>
                <span className={styles.skillBarValue} style={{ color }}>{value}%</span>
            </div>
            <div className={styles.skillBarTrack}>
                <div className={styles.skillBarFill} style={{ width: `${value}%`, background: color }} />
            </div>
        </div>
    );
}

// ─── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
    const r = (size / 2) - 7;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--alice-blue)" strokeWidth="6" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="var(--primary-blue)" strokeWidth="6"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill="var(--cobalt-blue)">{score}</text>
        </svg>
    );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function RecruiterDashboard() {
    const [activeNav, setActiveNav] = useState('Dashboard');
    const [activePipelineStage, setActivePipelineStage] = useState<string | null>(null);
    const [billingToggle] = useState<'monthly' | 'annual'>('monthly');
    const [confirmedSlots, setConfirmedSlots] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<'gender' | 'ethnicity' | 'education'>('gender');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const filteredCandidates = activePipelineStage
        ? CANDIDATES_PIPELINE.filter(c => c.stage === activePipelineStage)
        : CANDIDATES_PIPELINE;

    const stageColorMap: Record<string, string> = {
        applied: '#94a3b8',
        screening: 'var(--dodger-blue)',
        interview: 'var(--brilliant-azure)',
        offer: 'var(--ocean-deep)',
        hired: '#10b981',
    };

    return (
        <div className={styles.root}>
            {/* ── Sidebar ─────────────────────────── */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarLogo}>
                    <div className={styles.logoMark}>TM</div>
                    <span className={styles.logoText}>TalentMesh</span>
                </div>

                <div className={styles.sidebarSearch}>
                    <IconSearch />
                    <input placeholder="Search..." className={styles.sidebarSearchInput} />
                </div>

                <nav className={styles.sidebarNav}>
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item}
                            className={`${styles.navItem} ${activeNav === item ? styles.navItemActive : ''}`}
                            onClick={() => { setActiveNav(item); setSidebarOpen(false); }}
                        >
                            <IconGrid />
                            {item}
                            {item === 'Pipeline' && <span className={styles.navBadge}>7</span>}
                        </button>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userCard}>
                        <div className={styles.userAvatar}>HR</div>
                        <div>
                            <div className={styles.userName}>Harper Reid</div>
                            <div className={styles.userRole}>Lead Recruiter</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Mobile overlay ───────────────────── */}
            {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

            {/* ── Main ────────────────────────────── */}
            <main className={styles.main}>
                {/* Top Bar */}
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <button className={styles.hamburger} onClick={() => setSidebarOpen(true)}>
                            <span /><span /><span />
                        </button>
                        <div>
                            <h1 className={styles.pageTitle}>Recruiter Dashboard</h1>
                            <p className={styles.pageSubtitle}>Wednesday, 25 Feb 2026 · Senior Roles Pipeline</p>
                        </div>
                    </div>
                    <div className={styles.topbarRight}>
                        <div className={styles.aiStatus}>
                            <IconSparkle /> AI Active
                        </div>
                        <button className={styles.iconBtn} aria-label="Notifications">
                            <IconBell />
                            <span className={styles.notifDot} />
                        </button>
                        <div className={styles.topbarAvatar}>HR</div>
                    </div>
                </header>

                {/* KPI Strip */}
                <div className={styles.kpiStrip}>
                    {[
                        { label: 'Open Roles', value: '12', trend: '+2', up: true },
                        { label: 'Total Applicants', value: '137', trend: '+18', up: true },
                        { label: 'Avg. Time to Hire', value: '14d', trend: '-3d', up: true },
                        { label: 'Offer Accept Rate', value: '88%', trend: '+4%', up: true },
                    ].map(k => (
                        <div key={k.label} className={styles.kpiCard}>
                            <div className={styles.kpiValue}>{k.value}</div>
                            <div className={styles.kpiLabel}>{k.label}</div>
                            <div className={`${styles.kpiTrend} ${k.up ? styles.kpiUp : styles.kpiDown}`}>
                                <IconTrend /> {k.trend}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Panel Grid ──────────────────────────────── */}
                <div className={styles.panelGrid}>

                    {/* ══ Panel 1: Candidate Pipeline ══ */}
                    <section className={`${styles.panel} ${styles.panelWide}`}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>
                                <IconUsers />
                                Candidate Pipeline
                            </div>
                            <button className={styles.panelAction} onClick={() => setActivePipelineStage(null)}>
                                {activePipelineStage ? 'Clear filter' : 'View all'}
                            </button>
                        </div>

                        {/* Stage funnel */}
                        <div className={styles.pipelineStages}>
                            {PIPELINE_STAGES.map((stage, i) => {
                                const maxCount = PIPELINE_STAGES[0].count;
                                const barWidth = Math.max((stage.count / maxCount) * 100, 10);
                                return (
                                    <button
                                        key={stage.id}
                                        className={`${styles.stageRow} ${activePipelineStage === stage.id ? styles.stageRowActive : ''}`}
                                        onClick={() => setActivePipelineStage(prev => prev === stage.id ? null : stage.id)}
                                    >
                                        <div className={styles.stageLabel}>{stage.label}</div>
                                        <div className={styles.stageBarWrap}>
                                            <div className={styles.stageBarBg}>
                                                <div
                                                    className={styles.stageBarFill}
                                                    style={{ width: `${barWidth}%`, background: stage.color }}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.stageCount} style={{ color: stage.color }}>
                                            {stage.count}
                                        </div>
                                        {i < PIPELINE_STAGES.length - 1 && (
                                            <div className={styles.stageConvert} style={{ color: stage.color }}>
                                                {Math.round((PIPELINE_STAGES[i + 1].count / stage.count) * 100)}%
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Candidate cards */}
                        <div className={styles.candidateList}>
                            {filteredCandidates.map(c => (
                                <div key={c.id} className={styles.candidateRow}>
                                    <div className={styles.candidateAvatar} style={{ background: 'var(--gradient-primary)' }}>{c.avatar}</div>
                                    <div className={styles.candidateInfo}>
                                        <div className={styles.candidateName}>
                                            {c.name}
                                            {c.urgent && <span className={styles.urgentBadge}>Needs Action</span>}
                                        </div>
                                        <div className={styles.candidateRole}>{c.role}</div>
                                    </div>
                                    <div className={styles.candidateMeta}>
                                        <span
                                            className={styles.stagePill}
                                            style={{ background: `${stageColorMap[c.stage]}18`, color: stageColorMap[c.stage] }}
                                        >
                                            {c.stage}
                                        </span>
                                        <div className={styles.candidateScore}>
                                            <IconSparkle /> {c.score}%
                                        </div>
                                        <div className={styles.candidateTime}><IconClock /> {c.since}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ══ Panel 2: AI Match Scorecard ══ */}
                    <section className={`${styles.panel} ${styles.panelWide}`}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>
                                <IconSparkle />
                                AI Match Scorecard
                            </div>
                            <span className={styles.aiBadge}><IconSparkle /> AI Ranked</span>
                        </div>

                        <div className={styles.scorecardGrid}>
                            {TOP_CANDIDATES.map((c, i) => (
                                <div key={c.name} className={`${styles.scorecardCard} ${c.recommended ? styles.scorecardCardTop : ''}`}>
                                    {c.recommended && (
                                        <div className={styles.topPickBanner}><IconSparkle /> Top Pick</div>
                                    )}
                                    {i > 0 && (
                                        <div className={styles.rankBadge}>#{i + 1}</div>
                                    )}

                                    <div className={styles.scorecardTop}>
                                        <ScoreRing score={c.overall} size={72} />
                                        <div>
                                            <div className={styles.scorecardName}>{c.name}</div>
                                            <div className={styles.scorecardRole}>{c.role}</div>
                                            <div className={styles.scorecardMeta}>
                                                <span>{c.yoe}yr exp</span>
                                                <span>·</span>
                                                <span>{c.location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.skillBars}>
                                        <SkillBar label="Skill Alignment" value={c.skills} color="var(--dodger-blue)" />
                                        <SkillBar label="Experience Fit" value={c.experience} color="var(--ocean-deep)" />
                                        <SkillBar label="Cultural Match" value={c.cultural} color="var(--brilliant-azure)" />
                                    </div>

                                    <div className={styles.skillChips}>
                                        {c.skills_detail.map(s => (
                                            <span key={s} className={styles.skillChip}>{s}</span>
                                        ))}
                                    </div>

                                    <button className={`${styles.scorecardBtn} ${c.recommended ? styles.scorecardBtnPrimary : ''}`}>
                                        Schedule Interview
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ══ Panel 3: Interview Scheduler ══ */}
                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>
                                <IconCalendar />
                                Interview Scheduler
                            </div>
                            <button className={styles.panelAction}>+ New</button>
                        </div>

                        {/* Week strip */}
                        <div className={styles.weekStrip}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
                                <div key={d} className={`${styles.dayCell} ${i === 0 ? styles.dayCellActive : ''}`}>
                                    <div className={styles.dayName}>{d}</div>
                                    <div className={styles.dayNum}>{25 + i}</div>
                                    {i === 0 && <div className={styles.dayDot} />}
                                </div>
                            ))}
                        </div>

                        <div className={styles.slotList}>
                            {CALENDAR_SLOTS.map(slot => (
                                <div key={slot.id} className={`${styles.slotCard} ${slot.conflict ? styles.slotConflict : ''}`}>
                                    <div className={styles.slotLeft}>
                                        <div className={styles.slotTime}>{slot.time.split(', ')[1]}</div>
                                        <div className={styles.slotDate}>{slot.time.split(', ')[0]}</div>
                                    </div>
                                    <div className={styles.slotCenter}>
                                        <div className={styles.slotCandidate}>{slot.candidate}</div>
                                        <div className={styles.slotRole}>{slot.role}</div>
                                        <div className={styles.slotMeta}>
                                            <span className={styles.slotType}><IconVideo /> {slot.type}</span>
                                            <span className={styles.slotDur}>{slot.duration}</span>
                                            {slot.ai && <span className={styles.slotAiTag}><IconSparkle /> AI picked</span>}
                                            {slot.conflict && <span className={styles.slotConflictTag}>⚠ Conflict</span>}
                                        </div>
                                    </div>
                                    <div className={styles.slotRight}>
                                        {confirmedSlots.includes(slot.id) ? (
                                            <div className={styles.slotConfirmed}><IconCheck /> Confirmed</div>
                                        ) : (
                                            <button
                                                className={styles.slotConfirmBtn}
                                                onClick={() => setConfirmedSlots(p => [...p, slot.id])}
                                                disabled={slot.conflict}
                                            >
                                                {slot.conflict ? 'Reschedule' : 'Confirm'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.aiSuggestion}>
                            <IconSparkle />
                            <span>AI detected <strong>3 optimal windows</strong> tomorrow with zero conflicts across all interviewers.</span>
                            <button className={styles.aiSuggestionBtn}>Auto-schedule</button>
                        </div>
                    </section>

                    {/* ══ Panel 4: Diversity Analytics ══ */}
                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>
                                <IconPieChart />
                                Diversity Analytics
                            </div>
                            <div className={styles.tabGroup}>
                                {(['gender', 'ethnicity', 'education'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Donut chart visual */}
                        {activeTab !== 'education' && (
                            <div className={styles.chartArea}>
                                <DonutChart data={DIVERSITY_DATA[activeTab]} />
                                <div className={styles.chartLegend}>
                                    {DIVERSITY_DATA[activeTab].map(d => (
                                        <div key={d.label} className={styles.legendItem}>
                                            <div className={styles.legendDot} style={{ background: d.color }} />
                                            <span className={styles.legendLabel}>{d.label}</span>
                                            <span className={styles.legendPct}>{d.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'education' && (
                            <div className={styles.eduBars}>
                                {DIVERSITY_DATA.education.map(d => (
                                    <div key={d.label} className={styles.eduRow}>
                                        <div className={styles.eduLabel}>{d.label}</div>
                                        <div className={styles.eduBarWrap}>
                                            <div className={styles.eduBarFill} style={{ width: `${d.pct}%` }} />
                                        </div>
                                        <div className={styles.eduPct}>{d.pct}%</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Inclusion Insights */}
                        <div className={styles.insightsBox}>
                            <div className={styles.insightsTitle}><IconSparkle /> AI Inclusion Insights</div>
                            <ul className={styles.insightsList}>
                                <li className={styles.insightItem}>
                                    <span className={styles.insightDot} style={{ background: 'var(--dodger-blue)' }} />
                                    Pipeline gender balance is within industry benchmark (±5%)
                                </li>
                                <li className={styles.insightItem}>
                                    <span className={styles.insightDot} style={{ background: '#f59e0b' }} />
                                    Hispanic/Latino representation is 4% below goal — consider targeted outreach
                                </li>
                                <li className={styles.insightItem}>
                                    <span className={styles.insightDot} style={{ background: '#10b981' }} />
                                    Self-taught candidates perform +12% above avg. retention rate
                                </li>
                            </ul>
                        </div>

                        {/* Goal tracker */}
                        <div className={styles.goalTracker}>
                            <div className={styles.goalLabel}>D&I Hiring Goal Progress</div>
                            <div className={styles.goalBar}>
                                <div className={styles.goalFill} style={{ width: '67%' }} />
                                <div className={styles.goalMarker} style={{ left: '80%' }} />
                            </div>
                            <div className={styles.goalMeta}>
                                <span className={styles.goalCurrent}>67% achieved</span>
                                <span className={styles.goalTarget}>Goal: 80%</span>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; pct: number; color: string }[] }) {
    const size = 160;
    const r = 60;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;
    let cumulative = 0;

    // Resolve CSS var colors to actual hex for SVG (use inline style workaround)
    const colorMap: Record<string, string> = {
        'var(--dodger-blue)': '#2196F3',
        'var(--ocean-deep)': '#1565C0',
        'var(--cool-sky-2)': '#42A5F5',
        'var(--brilliant-azure)': '#1E88E5',
        'var(--cobalt-blue)': '#0D47A1',
        'var(--sky-blue)': '#90CAF9',
    };

    return (
        <div className={styles.donutWrap}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {data.map((d) => {
                    const dash = (d.pct / 100) * circ;
                    const gapDash = circ - dash;
                    const offset = -(cumulative / 100) * circ;
                    cumulative += d.pct;
                    const resolvedColor = colorMap[d.color] || d.color;
                    return (
                        <circle
                            key={d.label}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={resolvedColor}
                            strokeWidth="22"
                            strokeDasharray={`${dash} ${gapDash}`}
                            strokeDashoffset={offset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            strokeLinecap="butt"
                        />
                    );
                })}
                <circle cx={cx} cy={cy} r={r - 12} fill="white" />
                <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--cobalt-blue)">
                    {data.length}
                </text>
                <text x="50%" y="63%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fill="#94a3b8">
                    groups
                </text>
            </svg>
        </div>
    );
}
