'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { insforge, invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './alerts.module.css';
import Toast from '@/components/ui/Toast';
import AlertModal from '@/components/candidate/AlertModal';

interface JobAlert {
  id: string;
  candidate_id: string;
  keywords: string | null;
  location: string | null;
  job_type: string[] | null;
  skills: string[] | null;
  salary_min: number | null;
  experience_level: string | null;
  frequency: 'instant' | 'daily' | 'weekly';
  is_active: boolean;
  label: string | null;
  last_triggered_at: string | null;
  match_count: number;
  created_at: string;
}

const IC = {
  Bell: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Pencil: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

export default function JobAlertsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Partial<JobAlert> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await insforge.database
        .from('job_alerts')
        .select('*')
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Realtime updates for newly inserted jobs matching alerts
  useEffect(() => {
    if (!user) return;

    const channel = (insforge.realtime as any).channel('new_jobs_channel');
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, (payload: any) => {
        const newJob = payload.new;
        checkAlertsMatch(newJob);
      })
      .subscribe();

    return () => {
      (insforge.realtime as any).removeChannel(channel);
    };
  }, [user, alerts]);

  const checkAlertsMatch = (job: any) => {
    const activeAlerts = alerts.filter(a => a.is_active);
    for (const alert of activeAlerts) {
      let isMatch = true;
      
      if (alert.keywords && !job.title?.toLowerCase().includes(alert.keywords.toLowerCase())) isMatch = false;
      if (alert.location && !job.location?.toLowerCase().includes(alert.location.toLowerCase())) isMatch = false;
      if (alert.experience_level && job.experience_level !== alert.experience_level) isMatch = false;
      
      if (isMatch) {
        setToast({ 
          message: `New match for your alert "${alert.label || 'Job Alert'}": ${job.title}`, 
          type: 'success' 
        });
        // In a real app, we'd also increment match_count in DB here or via trigger
      }
    }
  };

  const handleToggleActive = async (alertId: string, current: boolean) => {
    try {
      const { error } = await insforge.database
        .from('job_alerts')
        .update({ is_active: !current })
        .eq('id', alertId);
      
      if (error) throw error;
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_active: !current } : a));
    } catch (err) {
      setToast({ message: 'Failed to update alert', type: 'error' });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    try {
      const { error } = await insforge.database
        .from('job_alerts')
        .delete()
        .eq('id', alertId);
      
      if (error) throw error;
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setToast({ message: 'Alert deleted', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to delete alert', type: 'error' });
    }
  };

  const handleSaveAlert = async (formData: Partial<JobAlert>) => {
    if (!user) return;
    try {
      const dataToSave = {
        ...formData,
        candidate_id: user.id,
        label: formData.label || generateLabel(formData)
      };

      let error;
      if (formData.id) {
        ({ error } = await insforge.database
          .from('job_alerts')
          .update(dataToSave)
          .eq('id', formData.id));
      } else {
        ({ error } = await insforge.database
          .from('job_alerts')
          .insert([dataToSave]));
      }

      if (error) throw error;
      
      setIsModalOpen(false);
      setEditingAlert(null);
      fetchAlerts();
      setToast({ message: `Alert ${formData.id ? 'updated' : 'created'} successfully`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to save alert', type: 'error' });
    }
  };

  const generateLabel = (data: Partial<JobAlert>) => {
    const parts = [];
    if (data.keywords) parts.push(data.keywords);
    if (data.location) parts.push(`in ${data.location}`);
    if (data.job_type?.length) parts.push(`(${data.job_type.join(', ')})`);
    return parts.join(' ') || 'New Job Alert';
  };

  const openCreateModal = () => {
    setEditingAlert({
      keywords: '',
      location: '',
      job_type: [],
      skills: [],
      salary_min: 500000,
      experience_level: '',
      frequency: 'daily',
      is_active: true,
      label: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (alert: JobAlert) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  const handleBrowseMatches = (alert: JobAlert) => {
    const params = new URLSearchParams();
    if (alert.keywords) params.set('q', alert.keywords);
    if (alert.location) params.set('location', alert.location);
    if (alert.job_type?.[0]) params.set('type', alert.job_type[0]);
    // Map to the existing search page params
    router.push(`/dashboard/candidate/search?${params.toString()}`);
  };

  if (loading) return <div className={styles.pageContainer}>Loading alerts...</div>;

  return (
    <div className={styles.pageContainer}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <header className={styles.header}>
        <h1 className={styles.title}>Job Alerts</h1>
        <button className={styles.createBtn} onClick={openCreateModal}>
          <IC.Plus /> Create Alert
        </button>
      </header>

      {alerts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><IC.Bell /></div>
          <h2 className={styles.emptyTitle}>No job alerts set up</h2>
          <p className={styles.emptyText}>Save a search to get notified when matching jobs are posted.</p>
          <button className={styles.createBtn} onClick={openCreateModal}>Create Your First Alert</button>
        </div>
      ) : (
        <div className={styles.alertsGrid}>
          {alerts.map(alert => (
            <div key={alert.id} className={`${styles.alertCard} ${!alert.is_active ? styles.paused : ''}`}>
              <div className={styles.alertHead}>
                <div>
                  <h3 className={styles.alertLabel}>{alert.label}</h3>
                  <div className={styles.stats}>
                    {alert.match_count} matches so far • Last matched {alert.last_triggered_at ? new Date(alert.last_triggered_at).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={alert.is_active} 
                    onChange={() => handleToggleActive(alert.id, alert.is_active)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.pills}>
                {alert.keywords && <span className={`${styles.pill} ${styles.pillBlue}`}>{alert.keywords}</span>}
                {alert.location && <span className={styles.pill}>{alert.location}</span>}
                {alert.salary_min && <span className={`${styles.pill} ${styles.pillGreen}`}>₹{alert.salary_min/100000}L+</span>}
                {alert.experience_level && <span className={styles.pill}>{alert.experience_level}</span>}
                {alert.job_type?.map(t => <span key={t} className={styles.pill}>{t}</span>)}
              </div>

              <div className={styles.meta}>
                <div className={styles.frequency}>
                  {alert.frequency === 'instant' ? '⚡ Instant' : alert.frequency === 'daily' ? '📅 Daily Digest' : '📆 Weekly'}
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={() => openEditModal(alert)}>
                  <IC.Pencil /> Edit
                </button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteAlert(alert.id)}>
                  <IC.Trash /> Delete
                </button>
                <button className={`${styles.actionBtn} ${styles.browseBtn}`} onClick={() => handleBrowseMatches(alert)}>
                  <IC.Search /> Browse Matches
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && editingAlert && (
        <AlertModal 
          alert={editingAlert} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveAlert}
        />
      )}
    </div>
  );
}

