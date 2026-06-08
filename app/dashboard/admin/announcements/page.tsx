'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Ico from 'lucide-react';
import styles from './announcements.module.css';
import { invokeFunction, insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import RichTextEditor from '@/components/ui/RichTextEditor';

// ─── Types ───────────────────────────────────────────────────────────────────

type AnnouncementType = 'info' | 'success' | 'warning' | 'critical';
type AudienceKey = 'all' | 'recruiters' | 'candidates';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  target_roles: string[];
  is_active: boolean;
  show_as_banner: boolean;
  image_url: string | null;
  scheduled_at: string | null;
  expires_at: string | null;
  view_count: number;
  dismiss_count: number;
  created_at: string;
  updated_at: string;
}

interface FormState {
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AudienceKey;
  is_active: boolean;
  show_as_banner: boolean;
  image_url: string;
  scheduled_at: string;
  expires_at: string;
}

const defaultForm: FormState = {
  title: '',
  message: '',
  type: 'info',
  audience: 'all',
  is_active: true,
  show_as_banner: false,
  image_url: '',
  scheduled_at: '',
  expires_at: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUDIENCE_MAP: Record<AudienceKey, string[]> = {
  all:        ['candidate', 'recruiter'],
  recruiters: ['recruiter'],
  candidates: ['candidate'],
};

const AUDIENCE_LABEL: Record<string, string> = {
  all:        'All Users',
  recruiters: 'Recruiters Only',
  candidates: 'Candidates Only',
};

function rolestoAudience(roles: string[]): AudienceKey {
  if (!roles || roles.length === 0) return 'all';
  if (roles.includes('recruiter') && roles.includes('candidate')) return 'all';
  if (roles.includes('recruiter')) return 'recruiters';
  return 'candidates';
}

function getAudienceLabel(roles: string[]): string {
  return AUDIENCE_LABEL[rolestoAudience(roles)] ?? 'All Users';
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getFileNameFromUrl(url: string): string {
  if (!url) return '';
  try {
    const decoded = decodeURIComponent(url);
    const lastPart = decoded.split('/').pop()?.split('?')[0] || '';
    return lastPart.replace(/^\d+_/, '');
  } catch (e) {
    return 'Attached Image';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypeIcon = ({ type, size = 20 }: { type: AnnouncementType; size?: number }) => {
  switch (type) {
    case 'success':  return <Ico.CheckCircle size={size} />;
    case 'warning':  return <Ico.AlertTriangle size={size} />;
    case 'critical': return <Ico.AlertCircle size={size} />;
    default:         return <Ico.Info size={size} />;
  }
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAnnouncementsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [items, setItems]       = useState<Announcement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Composer state
  const [isComposing, setIsComposing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading]       = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchAnnouncements = useCallback(async (
    q = search,
    type = typeFilter,
    status = statusFilter,
  ) => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await invokeFunction('admin-announcements', {
        method: 'GET',
        queries: {
          search: q || undefined,
          type: type !== 'all' ? type : undefined,
          status: status || undefined,
        },
      });

      if (fetchErr) throw new Error(fetchErr.message);
      setItems(Array.isArray(data?.announcements) ? data.announcements : []);
    } catch (err: any) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    if (user) fetchAnnouncements();
  }, [user]);

  // Auto-clear banners
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  // ── Composer ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setSelectedItem(null);
    setForm(defaultForm);
    setImagePreview('');
    setFormError('');
    setFormSuccess('');
    setIsComposing(true);
  };

  // ── Image Upload ─────────────────────────────────────────────────────────

  const uploadImage = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setFormError('Only JPEG, PNG, WebP or GIF images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5 MB.');
      return;
    }
    setUploading(true);
    setFormError('');
    try {
      const path = `announcements/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { data, error: upErr } = await insforge.storage
        .from('announcement_images')
        .upload(path, file);
      if (upErr) throw upErr;
      const directUrl = `${process.env.NEXT_PUBLIC_INSFORGE_URL}/api/storage/buckets/announcement_images/objects/${encodeURIComponent(path)}`;
      const url: string = (data as any)?.url || directUrl;
      setForm(p => ({ ...p, image_url: url }));
      setImagePreview(url);
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  const removeImage = () => {
    setForm(p => ({ ...p, image_url: '' }));
    setImagePreview('');
  };

  const openEdit = (item: Announcement) => {
    setSelectedItem(item);
    setForm({
      title:          item.title,
      message:        item.message,
      type:           item.type,
      audience:       rolestoAudience(item.target_roles),
      is_active:      item.is_active,
      show_as_banner: item.show_as_banner,
      image_url:      item.image_url ?? '',
      scheduled_at:   item.scheduled_at
        ? new Date(item.scheduled_at).toISOString().slice(0, 16)
        : '',
      expires_at:     item.expires_at
        ? new Date(item.expires_at).toISOString().slice(0, 16)
        : '',
    });
    setImagePreview(item.image_url ?? '');
    setFormError('');
    setFormSuccess('');
    setIsComposing(true);
  };

  const closeComposer = () => {
    setIsComposing(false);
    setSelectedItem(null);
  };

  const handleSave = async (publishNow = false) => {
    if (!form.title.trim() || !form.message.trim()) {
      setFormError('Title and message are required');
      return;
    }
    setSaving(true);
    setFormError('');

    const payload = {
      title:          form.title.trim(),
      message:        form.message.trim(),
      type:           form.type,
      target_roles:   AUDIENCE_MAP[form.audience],
      is_active:      publishNow ? true : form.is_active,
      show_as_banner: form.show_as_banner,
      image_url:      form.image_url || null,
      scheduled_at:   form.scheduled_at || null,
      expires_at:     form.expires_at || null,
    };

    try {
      const { error: saveErr } = await invokeFunction('admin-announcements', {
        method: selectedItem ? 'PATCH' : 'POST',
        path:   selectedItem ? `/${selectedItem.id}` : undefined,
        body:   payload,
      });

      if (saveErr) throw new Error(saveErr.message);

      setFormSuccess(selectedItem ? 'Broadcast updated!' : 'Broadcast published!');
      setSuccess(selectedItem ? 'Announcement updated' : 'New broadcast created');
      fetchAnnouncements();
      setTimeout(closeComposer, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Inline Toggle Active ─────────────────────────────────────────────────

  const toggleActive = async (item: Announcement) => {
    try {
      const { error: patchErr } = await invokeFunction('admin-announcements', {
        method: 'PATCH',
        path:   `/${item.id}`,
        body:   { is_active: !item.is_active },
      });
      if (patchErr) throw new Error(patchErr.message);
      setItems(prev =>
        prev.map(a => a.id === item.id ? { ...a, is_active: !a.is_active } : a)
      );
    } catch {
      setError('Failed to update status');
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return;
    try {
      const { error: delErr } = await invokeFunction('admin-announcements', {
        method: 'DELETE',
        path:   `/${id}`,
      });
      if (delErr) throw new Error(delErr.message);
      setItems(prev => prev.filter(a => a.id !== id));
      setSuccess('Announcement deleted');
    } catch {
      setError('Failed to delete');
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalActive    = items.filter(a => a.is_active).length;
  const totalBanners   = items.filter(a => a.show_as_banner).length;
  const totalScheduled = items.filter(a => a.scheduled_at && !a.is_active).length;

  // ── Composer Overlay ─────────────────────────────────────────────────────

  if (isComposing) {
    return (
      <div className={styles.overlay}>
        <header className={styles.overlayHeader}>
          <div className={styles.overlayHeaderLeft}>
            <button className={styles.iconBtn} onClick={closeComposer} title="Back">
              <Ico.ChevronLeft size={18} />
            </button>
            <input
              className={styles.overlayTitleInput}
              placeholder="Broadcast title..."
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              autoFocus
            />
          </div>
          <div className={styles.overlayHeaderRight}>
            <button
              className={styles.secondaryBtn}
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? <Ico.Loader2 size={16} className="animate-spin" /> : <Ico.Save size={16} />}
              Save Draft
            </button>
            <button
              className={styles.primaryBtn}
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? <Ico.Loader2 size={16} className="animate-spin" /> : <Ico.Send size={16} />}
              {selectedItem ? 'Update' : 'Publish Now'}
            </button>
          </div>
        </header>

        <div className={styles.overlayBody}>
          {/* ── Main Content ── */}
          <div className={styles.overlayMain}>
            {formError && (
              <div className={styles.errorBanner}><Ico.AlertCircle size={16} /> {formError}</div>
            )}
            {formSuccess && (
              <div className={styles.successBanner}><Ico.CheckCircle size={16} /> {formSuccess}</div>
            )}

            <RichTextEditor
              value={form.message}
              onChange={html => setForm(p => ({ ...p, message: html }))}
              placeholder="Write your broadcast message here. Use the formatting bar above to style your message..."
            />

            {form.message && (
              <div className={styles.preview}>
                <div className={styles.previewLabel}>Preview</div>
                <div className={styles.previewContent}>
                  <strong>{form.title}</strong>
                  {' — '}
                  <span dangerouslySetInnerHTML={{ __html: form.message }} />
                </div>
              </div>
            )}

            {/* ── Image Upload Zone ─────────────────────────────────────── */}
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '0.6rem' }}>
                Attachment Image <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' }}>(optional)</span>
              </p>

              {imagePreview ? (
                /* ── Show uploaded image preview ── */
                <div style={{ position: 'relative', display: 'inline-block', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <img
                    src={imagePreview}
                    alt="Announcement image"
                    style={{ display: 'block', maxHeight: '200px', maxWidth: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={removeImage}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                      width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'white',
                    }}
                    title="Remove image"
                  >
                    <Ico.X size={14} />
                  </button>
                  <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Ico.ImageIcon size={12} />
                    <span style={{ fontWeight: 600, color: '#475569' }}>
                      {getFileNameFromUrl(form.image_url)}
                    </span>
                    <span> — Attached</span>
                  </div>
                </div>
              ) : (
                /* ── Drop zone ── */
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? '#3b82f6' : '#cbd5e1'}`,
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? '#eff6ff' : '#f8fafc',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {uploading ? (
                    <Ico.Loader2 size={28} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Ico.ImageIcon size={28} style={{ color: '#94a3b8' }} />
                  )}
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                    {uploading ? 'Uploading…' : 'Drop image here or click to browse'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    JPEG, PNG, WebP, GIF — max 5 MB
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleFilePick}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className={styles.overlaySidebar}>
            {/* Type */}
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Broadcast Type</span>
              <div className={styles.typePicker}>
                {(['info', 'success', 'warning', 'critical'] as AnnouncementType[]).map(t => (
                  <button
                    key={t}
                    className={`${styles.typePill} ${styles[t]} ${form.type === t ? styles.activeType : ''}`}
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                  >
                    <TypeIcon type={t} size={13} />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Target Audience</span>
              <div className={styles.audiencePicker}>
                {(['all', 'recruiters', 'candidates'] as AudienceKey[]).map(aud => (
                  <button
                    key={aud}
                    className={`${styles.audiencePill} ${form.audience === aud ? styles.activeAudience : ''}`}
                    onClick={() => setForm(p => ({ ...p, audience: aud }))}
                  >
                    {aud === 'all' && <Ico.Users size={14} />}
                    {aud === 'recruiters' && <Ico.Briefcase size={14} />}
                    {aud === 'candidates' && <Ico.User size={14} />}
                    {AUDIENCE_LABEL[aud]}
                  </button>
                ))}
              </div>
            </div>

            {/* Show as banner toggle */}
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Banner Options</span>
              <div className={styles.toggleRow}>
                <span className={styles.toggleRowLabel}>Show as Banner</span>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={form.show_as_banner}
                    onChange={e => setForm(p => ({ ...p, show_as_banner: e.target.checked }))}
                  />
                  <div className={styles.toggleTrack} />
                  <div className={styles.toggleThumb} />
                </label>
              </div>

              {/* Live banner preview */}
              {form.show_as_banner && (
                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                    Preview
                  </span>
                  <div style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{
                      padding: '0.6rem 0.9rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      background: form.type === 'success' ? '#f0fdf4'
                        : form.type === 'warning' ? '#fffbeb'
                        : form.type === 'critical' ? '#fef2f2'
                        : '#eff6ff',
                      borderBottom: `2px solid ${
                        form.type === 'success' ? '#16a34a'
                        : form.type === 'warning' ? '#f59e0b'
                        : form.type === 'critical' ? '#ef4444'
                        : '#2563eb'
                      }`,
                      color: form.type === 'success' ? '#166534'
                        : form.type === 'warning' ? '#92400e'
                        : form.type === 'critical' ? '#991b1b'
                        : '#1e40af',
                    }}>
                      {/* Icon */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ flexShrink: 0, marginTop: '1px' }}>
                        {form.type === 'success' ? (
                          <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
                        ) : form.type === 'warning' ? (
                          <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>
                        ) : form.type === 'critical' ? (
                          <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                        ) : (
                          <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>
                        )}
                      </svg>
                      <div style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.4 }}>
                        <strong style={{ marginRight: '0.35rem' }}>
                          {form.title || 'Announcement Title'}
                        </strong>
                        {form.message ? (
                          <span dangerouslySetInnerHTML={{ __html: form.message }} />
                        ) : (
                          <span style={{ opacity: 0.5 }}>Your message will appear here…</span>
                        )}
                      </div>
                      {/* Dismiss X */}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, opacity: 0.5 }}>
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                    <div style={{ padding: '0.4rem 0.75rem', background: '#f8fafc', fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center' }}>
                      This is how the banner appears at the top of each page
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.toggleRow} style={{ marginTop: form.show_as_banner ? '0.75rem' : 0 }}>
                <span className={styles.toggleRowLabel}>Active</span>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  />
                  <div className={styles.toggleTrack} />
                  <div className={styles.toggleThumb} />
                </label>
              </div>
            </div>

            {/* Schedule */}
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Scheduling</span>
              <label className={styles.sidebarLabel} style={{ textTransform: 'none', letterSpacing: 0 }}>
                Show from
              </label>
              <input
                type="datetime-local"
                className={styles.sidebarInput}
                value={form.scheduled_at}
                onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
              />
              <label className={styles.sidebarLabel} style={{ textTransform: 'none', letterSpacing: 0 }}>
                Expires at
              </label>
              <input
                type="datetime-local"
                className={styles.sidebarInput}
                value={form.expires_at}
                onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
              />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroInfo}>
          <span className={styles.eyebrow}>Broadcasts</span>
          <h1 className={styles.title}>Announcements</h1>
          <p className={styles.subtitle}>
            Publish platform-wide broadcasts, alerts, and banners to candidates and recruiters.
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={openCreate}>
          <Ico.Megaphone size={18} /> New Broadcast
        </button>
      </header>

      {/* Global banners */}
      {error   && <div className={styles.errorBanner}><Ico.AlertCircle size={16} /> {error}</div>}
      {success && <div className={styles.successBanner}><Ico.CheckCircle size={16} /> {success}</div>}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total</span>
          <strong className={styles.statValue}>{items.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active</span>
          <strong className={styles.statValue}>{totalActive}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Banners</span>
          <strong className={styles.statValue}>{totalBanners}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Scheduled</span>
          <strong className={styles.statValue}>{totalScheduled}</strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Ico.Search className={styles.searchIcon} size={16} />
          <input
            className={styles.searchInput}
            placeholder="Search by title or message..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              fetchAnnouncements(e.target.value, typeFilter, statusFilter);
            }}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={e => {
            setTypeFilter(e.target.value);
            fetchAnnouncements(search, e.target.value, statusFilter);
          }}
        >
          <option value="all">All Types</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            fetchAnnouncements(search, typeFilter, e.target.value);
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* List */}
      {(authLoading || loading) ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Ico.Loader2 size={36} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Ico.Megaphone size={28} /></div>
          <p className={styles.emptyTitle}>No broadcasts yet</p>
          <p className={styles.emptySubtitle}>Create your first announcement to reach your platform users.</p>
          <button className={styles.primaryBtn} onClick={openCreate} style={{ marginTop: '0.5rem' }}>
            <Ico.Plus size={16} /> New Broadcast
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map(item => (
            <div key={item.id} className={`${styles.card} ${!item.is_active ? styles.inactive : ''}`}>
              {/* Type icon */}
              <div className={`${styles.typeIcon} ${styles[item.type]}`}>
                <TypeIcon type={item.type} size={20} />
              </div>

              {/* Body */}
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>{item.title}</span>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardDate}>{fmtDate(item.created_at)}</span>
                  </div>
                </div>

                <div className={styles.cardMessage} dangerouslySetInnerHTML={{ __html: item.message }} />

                {/* Image thumbnail */}
                {item.image_url && (
                  <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                    <img
                      src={item.image_url}
                      alt="Announcement image"
                      style={{
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </div>
                )}

                <div className={styles.cardFooter}>
                  {/* Type badge */}
                  <span className={`${styles.badge} ${styles[item.type]}`}>
                    <TypeIcon type={item.type} size={10} />
                    {item.type}
                  </span>

                  {/* Audience badge */}
                  <span className={`${styles.badge} ${styles.audience}`}>
                    <Ico.Users size={10} />
                    {getAudienceLabel(item.target_roles)}
                  </span>

                  {/* Banner badge */}
                  {item.show_as_banner && (
                    <span className={`${styles.badge} ${styles.banner}`}>
                      <Ico.Layout size={10} /> Banner
                    </span>
                  )}

                  {/* Scheduled badge */}
                  {item.scheduled_at && (
                    <span className={`${styles.badge} ${styles.scheduled}`}>
                      <Ico.Clock size={10} /> {fmtDate(item.scheduled_at)}
                    </span>
                  )}

                  {/* View / dismiss counts */}
                  {(item.view_count > 0 || item.dismiss_count > 0) && (
                    <>
                      <span className={styles.statBadge}>
                        <Ico.Eye size={10} /> {item.view_count ?? 0}
                      </span>
                      <span className={styles.statBadge}>
                        <Ico.X size={10} /> {item.dismiss_count ?? 0}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.cardActions}>
                {/* Active toggle */}
                <label className={styles.toggle} title={item.is_active ? 'Deactivate' : 'Activate'}>
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={() => toggleActive(item)}
                  />
                  <div className={styles.toggleTrack} />
                  <div className={styles.toggleThumb} />
                </label>

                <button
                  className={styles.iconBtn}
                  onClick={() => openEdit(item)}
                  title="Edit"
                >
                  <Ico.Edit3 size={15} />
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.danger}`}
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                >
                  <Ico.Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
