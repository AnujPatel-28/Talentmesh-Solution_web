"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge, invokeFunction } from '@/lib/insforge';
import Link from 'next/link';
import styles from './interviews.module.css';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';

/* ─── Types ─── */
interface Interview {
    id: string; job_id: string; candidate_id: string; recruiter_id: string;
    scheduled_at: string; duration_mins: number;
    type: 'video' | 'phone' | 'in_person' | 'technical';
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
    meeting_link: string | null; location: string | null; notes: string | null;
    feedback: string | null; rating: number | null; created_at: string;
    job: { id: string; title: string } | null;
    candidate: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
}

interface ScheduleFormData {
    application_id: string; type: Interview['type']; date: string; time: string;
    duration_minutes: number; meeting_link: string; location: string; notes: string;
}

type StatusFilter = 'all' | 'scheduled' | 'completed' | 'cancelled';
type DateFilter = 'today' | 'week' | 'month' | 'all';

/* ─── Helpers ─── */
function fmt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) +
        ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function groupByDate(list: Interview[]): Record<string, Interview[]> {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const tom = new Date(now); tom.setDate(tom.getDate() + 1);
    const endWeek = new Date(now); endWeek.setDate(endWeek.getDate() + 7);
    const groups: Record<string, Interview[]> = {};
    for (const iv of list) {
        const d = new Date(iv.scheduled_at); d.setHours(0, 0, 0, 0);
        let key: string;
        if (d.getTime() === now.getTime()) key = 'Today';
        else if (d.getTime() === tom.getTime()) key = 'Tomorrow';
        else if (d > now && d <= endWeek) key = 'This Week';
        else if (d < now) key = 'Past';
        else key = 'Upcoming';
        if (!groups[key]) groups[key] = [];
        groups[key].push(iv);
    }
    return groups;
}

function pillClass(s: Interview['status'], mod: Record<string, string>) {
    return `${mod.pill} ${
        s === 'scheduled' ? mod.pillScheduled :
        s === 'completed' ? mod.pillCompleted :
        s === 'cancelled' ? mod.pillCancelled :
        s === 'no_show' ? mod.pillNoShow :
        mod.pillRescheduled
    }`;
}

function typeLabel(t: Interview['type']) {
    return { video: 'Video Call', phone: 'Phone', in_person: 'In Person', technical: 'Technical' }[t];
}

/* ─── Icons ─── */
const IC = {
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    video: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>,
    map: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    code: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>,
    cal: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

function TypeIcon({ t }: { t: Interview['type'] }) {
    if (t === 'video') return IC.video;
    if (t === 'phone') return IC.phone;
    if (t === 'in_person') return IC.map;
    return IC.code;
}

/* ─── Toast ─── */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`${styles.toast} ${type === 'error' ? styles.toastError : styles.toastSuccess}`}>
            {type === 'success' ? IC.check : IC.x} {msg}
        </div>
    );
}

/* ─── Schedule Modal ─── */
function ScheduleModal({ onClose, onSuccess, recruiterId }: {
    onClose: () => void; onSuccess: () => void; recruiterId: string;
}) {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<ScheduleFormData>({
        application_id: '', type: 'video', date: '', time: '',
        duration_minutes: 60, meeting_link: '', location: '', notes: ''
    });

    useEffect(() => {
        insforge.database
            .from('applications')
            .select('id, status, job:jobs(id, title), candidate:profiles!candidate_id(id, full_name:name)')
            .in('status', ['shortlisted', 'interviewing'])
            .then(({ data }) => setApplications(data || []));
    }, []);

    const set = (k: keyof ScheduleFormData, v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.application_id || !form.date || !form.time) return;
        setLoading(true);
        try {
            const app = applications.find(a => a.id === form.application_id);
            if (!app) throw new Error('Application not found');
            const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString();
            const { error } = await insforge.database.from('interviews').insert([{
                job_id: app.job?.id,
                candidate_id: app.candidate?.id,
                recruiter_id: recruiterId,
                scheduled_at,
                duration_mins: form.duration_minutes,
                type: form.type,
                status: 'scheduled',
                meeting_link: form.type === 'video' ? form.meeting_link || null : null,
                location: form.type === 'in_person' ? form.location || null : null,
                notes: form.notes || null,
            }]);
            if (error) throw error;
            const { error: updateErr } = await invokeFunction('update-application', {
                body: { id: form.application_id, status: 'interviewing' }
            });
            if (updateErr) throw updateErr;
            onSuccess();
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const types: { v: Interview['type']; label: string; icon: React.ReactNode }[] = [
        { v: 'video', label: 'Video Call', icon: IC.video },
        { v: 'phone', label: 'Phone Call', icon: IC.phone },
        { v: 'in_person', label: 'In Person', icon: IC.map },
        { v: 'technical', label: 'Technical', icon: IC.code },
    ];

    return (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Schedule Interview</h2>
                    <button className={styles.modalClose} onClick={onClose}>{IC.x}</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formRow}>
                        <label className={styles.label}>Application</label>
                        <CustomSelect 
                            className={styles.select} 
                            value={form.application_id}
                            onChange={e => set('application_id', e.target.value)} 
                            required
                            placeholder="Select candidate & position…"
                            options={applications.map(a => ({
                                value: a.id,
                                label: `${a.candidate?.full_name} — ${a.job?.title}`
                            }))}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label className={styles.label}>Interview Type</label>
                        <div className={styles.typeGrid}>
                            {types.map(t => (
                                <button key={t.v} type="button"
                                    className={`${styles.typeOption} ${form.type === t.v ? styles.typeOptionActive : ''}`}
                                    onClick={() => set('type', t.v)}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.rowTwo}>
                        <div className={styles.formRow}>
                            <label className={styles.label}>Date</label>
                            <input type="date" className={styles.input}
                                value={form.date} onChange={e => set('date', e.target.value)} required />
                        </div>
                        <div className={styles.formRow}>
                            <label className={styles.label}>Time</label>
                            <input type="time" className={styles.input}
                                value={form.time} onChange={e => set('time', e.target.value)} required />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <label className={styles.label}>Duration</label>
                        <CustomSelect 
                            className={styles.select} 
                            value={String(form.duration_minutes)}
                            onChange={e => set('duration_minutes', Number(e.target.value))}
                            options={[30, 45, 60, 90, 120].map(d => ({ value: String(d), label: `${d} min` }))}
                        />
                    </div>
                    {form.type === 'video' && (
                        <div className={styles.formRow}>
                            <label className={styles.label}>Meeting Link</label>
                            <input type="url" className={styles.input} value={form.meeting_link}
                                onChange={e => set('meeting_link', e.target.value)}
                                placeholder="https://meet.google.com/…" />
                        </div>
                    )}
                    {form.type === 'in_person' && (
                        <div className={styles.formRow}>
                            <label className={styles.label}>Location</label>
                            <input type="text" className={styles.input} value={form.location}
                                onChange={e => set('location', e.target.value)}
                                placeholder="Office address or room" />
                        </div>
                    )}
                    <div className={styles.formRow}>
                        <label className={styles.label}>Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                        <textarea className={styles.textarea} rows={3} value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            placeholder="Topics to cover, preparation notes…" />
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Scheduling…' : 'Schedule Interview'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Menu ─── */
function CardMenu({ iv, onRefresh }: { iv: Interview; onRefresh: () => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const cancel = async () => {
        setOpen(false);
        await insforge.database.from('interviews').update({ status: 'cancelled' }).eq('id', iv.id);
        onRefresh();
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button className={styles.menuBtn} onClick={() => setOpen(o => !o)}>{IC.dots}</button>
            {open && (
                <div className={styles.dropdown}>
                    <Link href={`/dashboard/recruiter/${iv.recruiter_id}/interviews/${iv.id}`}
                        className={styles.dropdownItem} onClick={() => setOpen(false)}>
                        View Details
                    </Link>
                    <Link href={`/dashboard/recruiter/${iv.recruiter_id}/interviews/${iv.id}?tab=feedback`}
                        className={styles.dropdownItem} onClick={() => setOpen(false)}>
                        Add Feedback
                    </Link>
                    <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={cancel}>
                        Cancel Interview
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─── Main Page ─── */
export default function InterviewsPage({ params }: { params: Promise<{ role_id: string }> }) {
    const { role_id } = React.use(params);
    const { user: authUser, isLoading: authLoading } = useAuth();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const fetching = useRef(false);

    const fetchInterviews = useCallback(async () => {
        if (!authUser?.id || fetching.current) return;
        fetching.current = true;
        try {
            const { data, error } = await insforge.database
                .from('interviews')
                .select('*, job:jobs(id, title), candidate:profiles!candidate_id(id, full_name:name, email, avatar_url)')
                .eq('recruiter_id', authUser.id)
                .order('scheduled_at', { ascending: true });
            if (!error) setInterviews((data as Interview[]) || []);
        } finally {
            setLoading(false);
            fetching.current = false;
        }
    }, [authUser?.id]);

    useEffect(() => {
        if (!authLoading && authUser) fetchInterviews();
    }, [authLoading, authUser, fetchInterviews]);

    /* ─── Stats ─── */
    const now = new Date();
    const todayStr = now.toDateString();
    const startWeek = new Date(now); startWeek.setDate(now.getDate() - now.getDay());
    const endWeek = new Date(startWeek); endWeek.setDate(startWeek.getDate() + 7);

    const stats = {
        today: interviews.filter(i => new Date(i.scheduled_at).toDateString() === todayStr).length,
        week: interviews.filter(i => { const d = new Date(i.scheduled_at); return d >= startWeek && d < endWeek; }).length,
        pendingFeedback: interviews.filter(i => i.status === 'completed' && !i.feedback).length,
        completionRate: interviews.length
            ? Math.round((interviews.filter(i => i.status === 'completed').length / interviews.length) * 100)
            : 0,
    };

    /* ─── Filter ─── */
    const filtered = interviews.filter(iv => {
        if (statusFilter !== 'all' && iv.status !== statusFilter) return false;
        if (typeFilter !== 'all' && iv.type !== typeFilter) return false;
        if (dateFilter !== 'all') {
            const d = new Date(iv.scheduled_at);
            if (dateFilter === 'today' && d.toDateString() !== todayStr) return false;
            if (dateFilter === 'week' && (d < startWeek || d >= endWeek)) return false;
            if (dateFilter === 'month') {
                const m = new Date(now.getFullYear(), now.getMonth(), 1);
                const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                if (d < m || d >= mEnd) return false;
            }
        }
        if (search) {
            const q = search.toLowerCase();
            return (iv.candidate?.full_name || '').toLowerCase().includes(q) ||
                (iv.job?.title || '').toLowerCase().includes(q);
        }
        return true;
    });

    const grouped = groupByDate(filtered);
    const groupOrder = ['Today', 'Tomorrow', 'This Week', 'Upcoming', 'Past'];

    if (loading || authLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading interviews…</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Interviews</h1>
                    <p className={styles.pageSub}>Manage and track all candidate interviews</p>
                </div>
                <button className={styles.scheduleBtn} onClick={() => setShowModal(true)}>
                    {IC.plus} Schedule Interview
                </button>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Today</span>
                    <span className={styles.statValue}>{stats.today}</span>
                    <span className={styles.statHint}>scheduled for today</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>This Week</span>
                    <span className={styles.statValue}>{stats.week}</span>
                    <span className={styles.statHint}>in current week</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Pending Feedback</span>
                    <span className={styles.statValue}>{stats.pendingFeedback}</span>
                    <span className={styles.statHint}>completed, no feedback</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Completion Rate</span>
                    <span className={styles.statValue}>{stats.completionRate}%</span>
                    <span className={styles.statHint}>of total interviews</span>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filterBar}>
                <div className={styles.tabs}>
                    {(['all', 'scheduled', 'completed', 'cancelled'] as StatusFilter[]).map(s => (
                        <button key={s} className={`${styles.tab} ${statusFilter === s ? styles.tabActive : ''}`}
                            onClick={() => setStatusFilter(s)}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <div className={styles.filterDivider} />
                <div style={{ width: '150px' }}>
                    <CustomSelect 
                        className={styles.filterSelect} 
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value as DateFilter)}
                        options={[
                            { value: 'all', label: 'All Time' },
                            { value: 'today', label: 'Today' },
                            { value: 'week', label: 'This Week' },
                            { value: 'month', label: 'This Month' }
                        ]}
                    />
                </div>
                <div style={{ width: '150px' }}>
                    <CustomSelect 
                        className={styles.filterSelect} 
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Types' },
                            { value: 'video', label: 'Video' },
                            { value: 'phone', label: 'Phone' },
                            { value: 'in_person', label: 'In Person' },
                            { value: 'technical', label: 'Technical' }
                        ]}
                    />
                </div>
                <div className={styles.filterDivider} />
                <input className={styles.searchInput} placeholder="Search by candidate or job…"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>{IC.cal}</span>
                    <h3 className={styles.emptyTitle}>No interviews yet</h3>
                    <p className={styles.emptyDesc}>Schedule your first interview to get started.</p>
                    <button className={styles.emptyBtn} onClick={() => setShowModal(true)}>
                        {IC.plus} Schedule Interview
                    </button>
                </div>
            ) : (
                <div className={styles.groups}>
                    {groupOrder.map(grp => {
                        const items = grouped[grp];
                        if (!items?.length) return null;
                        return (
                            <div key={grp} className={styles.group}>
                                <span className={styles.groupLabel}>{grp}</span>
                                {items.map(iv => {
                                    const initials = (iv.candidate?.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <div key={iv.id} className={styles.card}>
                                            {iv.candidate?.avatar_url
                                                ? <img src={getPublicStorageUrl('avatars', iv.candidate.avatar_url)} alt="" className={styles.avatarImg} />
                                                : <div className={styles.avatar}>{initials}</div>
                                            }
                                            <div className={styles.candidateInfo}>
                                                <span className={styles.candidateName}>{iv.candidate?.full_name || 'Unknown'}</span>
                                                <span className={styles.jobTitle}>{iv.job?.title || '—'}</span>
                                            </div>
                                            <div className={styles.meta}>
                                                <span className={styles.typeIcon}>
                                                    <TypeIcon t={iv.type} /> {typeLabel(iv.type)}
                                                </span>
                                                <span className={styles.dateTime}>{fmt(iv.scheduled_at)}</span>
                                                <span className={styles.durationBadge}>{iv.duration_mins} min</span>
                                                <span className={pillClass(iv.status, styles)}>
                                                    {iv.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className={styles.cardActions}>
                                                {iv.type === 'video' && iv.meeting_link && iv.status === 'scheduled' && (
                                                    <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer"
                                                        className={styles.joinBtn}>
                                                        {IC.video} Join Call
                                                    </a>
                                                )}
                                                <CardMenu iv={iv} onRefresh={fetchInterviews} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <ScheduleModal
                    recruiterId={authUser?.id || role_id}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        setToast({ msg: 'Interview scheduled successfully!', type: 'success' });
                        fetchInterviews();
                    }}
                />
            )}
        </div>
    );
}
