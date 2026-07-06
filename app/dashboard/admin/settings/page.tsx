'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './settings.module.css';
import { invokeFunction, insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { safeValidate, settingsSchema } from '@/lib/contracts/schemas';
import { 
  Settings, 
  Smartphone, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  ShieldAlert, 
  FolderLock, 
  Globe, 
  CheckCircle,
  XCircle,
  FileCheck
} from 'lucide-react';

type PlatformSettings = {
  general: any;
  feature_flags: any;
  maintenance: any;
};

type AdminMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

type UserSession = {
  id: string;
  user_id: string;
  session_type: 'normal' | 'impersonation';
  session_name: string;
  ip_hash: string;
  user_agent: string;
  country: string;
  region: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_active_at: string;
  impersonation_started_at: string | null;
  impersonated_by: string | null;
};

type QuarantinedFile = {
  id: string;
  bucket_name: string;
  file_path: string;
  original_path: string;
  quarantined_at: string;
  expires_at: string;
  restore_requested_at: string | null;
  restored_at: string | null;
  status: 'quarantined' | 'restoring' | 'restored' | 'deleted';
};

export default function AdminSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'devices' | 'quarantine'>('general');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [quarantinedFiles, setQuarantinedFiles] = useState<QuarantinedFile[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [quarantineLoading, setQuarantineLoading] = useState(false);
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [adminName, setAdminName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  
  // Renaming session state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState('');

  useEffect(() => {
    if (user?.name) {
      setAdminName(user.name);
    }
  }, [user]);

  const fetchGeneral = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        invokeFunction('admin-settings', { method: 'GET' }),
        invokeFunction('admin-settings', { method: 'GET', queries: { section: 'admins' } })
      ]);
      
      if (!sRes.error && sRes.data) {
        const fallbackSettings = {
          schemaVersion: 'v1',
          general: {
            platformName: 'TalentMesh',
            supportEmail: 'support@talentmesh.ai',
            tagline: 'The Future of Professional Integration'
          },
          feature_flags: {},
          maintenance: {
            enabled: false
          }
        };
        const validatedSettings = safeValidate(settingsSchema, sRes.data, fallbackSettings, 'strict');
        setSettings(validatedSettings);
      }
      if (!aRes.error) setAdmins(aRes.data.admins);
    } catch (err) {
      console.error('Settings fetch or validation failed:', err);
      setMessage({ text: 'Internal settings sync failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('user_sessions')
        .select('*')
        .order('last_active_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err: any) {
      console.error('Failed to fetch user sessions:', err.message);
      setMessage({ text: 'Failed to load device sessions', type: 'error' });
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  const fetchQuarantine = useCallback(async () => {
    setQuarantineLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('storage_quarantine')
        .select('*')
        .order('quarantined_at', { ascending: false });

      if (error) throw error;
      setQuarantinedFiles(data || []);
    } catch (err: any) {
      console.error('Failed to fetch quarantined files:', err.message);
      setMessage({ text: 'Failed to load quarantine items', type: 'error' });
    } finally {
      setQuarantineLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'general') {
      fetchGeneral();
    } else if (activeTab === 'devices') {
      fetchDevices();
    } else if (activeTab === 'quarantine') {
      fetchQuarantine();
    }
  }, [activeTab, fetchGeneral, fetchDevices, fetchQuarantine]);

  const updateSetting = async (key: string, value: any) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const { queueOfflineAction } = await import('@/hooks/useNetworkState');
        queueOfflineAction('admin-settings', {
          method: 'PATCH',
          body: { key, value },
        });
        setSettings(prev => prev ? { ...prev, [key]: value } : null);
        setMessage({ text: 'Offline: Changes queued and will sync when connection is restored.', type: 'info' });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
        return;
      } catch (err) {
        console.error('Failed to queue setting change offline:', err);
      }
    }

    try {
      const { data, error } = await invokeFunction('admin-settings', {
        method: 'PATCH',
        body: { key, value },
      });
      if (!error) {
        setSettings(prev => prev ? { ...prev, [key]: value } : null);

        if (key === 'maintenance') {
          if (value.enabled) {
            document.cookie = "tm_maintenance=true; path=/; max-age=31536000; SameSite=Lax";
          } else {
            document.cookie = "tm_maintenance=; path=/; max-age=0; SameSite=Lax";
          }
        }

        setMessage({ text: 'Global configuration persisted successfully', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch {
      setMessage({ text: 'Persistence failure', type: 'error' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);
    setMessage({ text: '', type: '' });
    try {
      const { error } = await insforge.database
        .from('profiles')
        .update({ name: adminName })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      setMessage({ text: 'Personal profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Profile update failed', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGeneralSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) updateSetting('general', settings.general);
  };

  const toggleFeature = (flagKey: string) => {
    if (!settings) return;
    const currentFlags = settings.feature_flags || {};
    const nextFlags = { ...currentFlags, [flagKey]: !currentFlags[flagKey] };
    updateSetting('feature_flags', nextFlags);
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const { queueOfflineAction } = await import('@/hooks/useNetworkState');
        queueOfflineAction('admin-settings', {
          method: 'POST',
          body: { email: newAdminEmail, action: 'add_admin' },
        });
        setNewAdminEmail('');
        setMessage({ text: 'Offline: Grant access request queued for synchronization.', type: 'info' });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
        return;
      } catch (err) {
        console.error('Failed to queue add admin offline:', err);
      }
    }

    try {
      const { data, error } = await invokeFunction('admin-settings', {
        method: 'POST',
        body: { email: newAdminEmail, action: 'add_admin' },
      });
      if (!error) {
        setNewAdminEmail('');
        fetchGeneral();
        setMessage({ text: 'Administrative access granted', type: 'success' });
      } else {
        setMessage({ text: error.message, type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network failure', type: 'error' });
    }
  };

  const removeAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to revoke administrative access for this user?')) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const { queueOfflineAction } = await import('@/hooks/useNetworkState');
        queueOfflineAction('admin-settings', {
          method: 'DELETE',
          body: { id },
        });
        setMessage({ text: 'Offline: Revoke access request queued for synchronization.', type: 'info' });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
        return;
      } catch (err) {
        console.error('Failed to queue remove admin offline:', err);
      }
    }

    try {
      const { error } = await invokeFunction('admin-settings', {
        method: 'DELETE',
        body: { id },
      });
      if (!error) {
        fetchGeneral();
        setMessage({ text: 'Admin privileges revoked', type: 'info' });
      }
    } catch {
      setMessage({ text: 'Revocation failed', type: 'error' });
    }
  };

  // Device Session Management Actions
  const handleRenameSession = async (sessionId: string) => {
    if (!editSessionName.trim()) return;
    try {
      const { error } = await insforge.database
        .from('user_sessions')
        .update({ session_name: editSessionName })
        .eq('id', sessionId);

      if (error) throw error;
      setEditingSessionId(null);
      setEditSessionName('');
      fetchDevices();
      setMessage({ text: 'Session renamed successfully', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session? The user will be logged out instantly.')) return;
    try {
      const { error } = await insforge.database
        .from('user_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
      fetchDevices();
      setMessage({ text: 'Session revoked successfully', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  // Quarantine Management Actions
  const handleRestoreQuarantine = async (itemId: string) => {
    if (!confirm('Request file restoration back to its original location?')) return;
    try {
      const { error } = await insforge.database
        .from('storage_quarantine')
        .update({ 
          status: 'restoring',
          restore_requested_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
      
      // Trigger the edge function to physically restore the file
      await fetch('/api/v1/remote/functions/cleanup-stale-resources', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.sessionStorage.getItem('tm_token') || ''}`
        }
      }).catch(console.error);

      fetchQuarantine();
      setMessage({ text: 'Restore request submitted and completed successfully', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handlePurgeQuarantine = async (itemId: string) => {
    if (!confirm('Physically purge this file from storage immediately? This action is IRREVERSIBLE.')) return;
    try {
      const { error } = await insforge.database
        .from('storage_quarantine')
        .update({ status: 'deleted' })
        .eq('id', itemId);

      if (error) throw error;

      // Trigger physical purge instantly in the edge worker
      await fetch('/api/v1/remote/functions/cleanup-stale-resources', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.sessionStorage.getItem('tm_token') || ''}`
        }
      }).catch(console.error);

      fetchQuarantine();
      setMessage({ text: 'File purged from storage successfully', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  if (loading && activeTab === 'general') return <div style={{ padding: '4rem', textAlign: 'center' }}>Connecting to platform backbone...</div>;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Global Control Center</p>
        <h1 className={styles.title}>Network Governance</h1>
        <p className={styles.subtitle}>Modify architecture flags, manage administrative authority, and oversee system integrity.</p>
      </header>

      {/* Tabs selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', gap: '1.5rem' }}>
        {[
          { id: 'general', label: 'General Settings', icon: <Settings className="h-4 w-4" /> },
          { id: 'devices', label: 'Active Sessions & Devices', icon: <Smartphone className="h-4 w-4" /> },
          { id: 'quarantine', label: 'Quarantine Manager', icon: <FolderLock className="h-4 w-4" /> },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingBottom: '1rem',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.16s'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {message.text && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '12px',
          background: message.type === 'error' ? '#fef2f2' : message.type === 'success' ? '#f0fdf4' : '#eff6ff',
          color: message.type === 'error' ? '#dc2626' : message.type === 'success' ? '#166534' : '#1e40af',
          fontWeight: 700,
          border: '1px solid currentColor'
        }}>
          {message.text}
        </div>
      )}

      {/* Tab: General Settings */}
      {activeTab === 'general' && (
        <div className={styles.settingsGrid}>
          <div className={styles.mainCol}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Personal Profile Settings</h3>
              <form onSubmit={handleSaveProfile}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    className={styles.input}
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="Administrator Name"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    className={styles.input}
                    style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                    value={user?.email || ''}
                    disabled
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>Email cannot be changed here.</span>
                </div>
                <button type="submit" className={styles.primaryButton} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Update Personal Profile'}
                </button>
              </form>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>General Configuration</h3>
              <form onSubmit={handleGeneralSave}>
                <div className={styles.formGroup}>
                  <label>Platform Identity Name</label>
                  <input
                    className={styles.input}
                    value={settings?.general?.platformName || 'TalentMesh'}
                    onChange={e => setSettings(prev => ({ ...prev!, general: { ...prev!.general, platformName: e.target.value } }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Support Nexus Email</label>
                  <input
                    className={styles.input}
                    value={settings?.general?.supportEmail || 'support@talentmesh.ai'}
                    onChange={e => setSettings(prev => ({ ...prev!, general: { ...prev!.general, supportEmail: e.target.value } }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Platform Tagline / Slogan</label>
                  <input
                    className={styles.input}
                    value={settings?.general?.tagline || 'The Future of Professional Integration'}
                    onChange={e => setSettings(prev => ({ ...prev!, general: { ...prev!.general, tagline: e.target.value } }))}
                  />
                </div>
                <button type="submit" className={styles.primaryButton}>Persist Infrastructure Settings</button>
              </form>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Administrators List</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '0.75rem 0' }}>Administrator</th>
                    <th>Authority Role</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '1rem 0' }}>
                        <div style={{ fontWeight: 700 }}>{admin.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{admin.email}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', background: admin.role === 'super_admin' ? '#fef2f2' : '#f0fdf4', color: admin.role === 'super_admin' ? '#991b1b' : '#166534' }}>
                          {admin.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                          onClick={() => removeAdmin(admin.id)}
                        >
                          Revoke Access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <form onSubmit={addAdmin} style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px' }}>
                <input
                  className={styles.input}
                  style={{ flex: 1 }}
                  placeholder="Candidate Email Address..."
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                />
                <button type="submit" className={styles.primaryButton}>Grant Admin Authority</button>
              </form>
            </div>
          </div>

          <div className={styles.sideCol}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Architectural Flags</h3>
              <div className={styles.featureList}>
                {[
                  { key: 'candidateRegistration', label: 'Candidate Signups', desc: 'Allow new candidates to register' },
                  { key: 'recruiterRegistration', label: 'Employer Signups', desc: 'Allow new employers to register' },
                  { key: 'blogEnabled', label: 'Public Blog', desc: 'Show the public blog section' },
                  { key: 'messagingEnabled', label: 'Direct Chat', desc: 'Allow candidates and recruiters to chat' },
                  { key: 'aiMatching', label: 'AI Matching', desc: 'Automatically match candidates with jobs' },
                ].map(flag => (
                  <div key={flag.key} className={styles.featureItem}>
                    <div className={styles.featureInfo}>
                      <strong>{flag.label}</strong>
                      <span>{flag.desc}</span>
                    </div>
                    <div
                      className={`${styles.toggle} ${settings?.feature_flags?.[flag.key] ? styles.toggleOn : ''}`}
                      onClick={() => toggleFeature(flag.key)}
                    >
                      <div className={styles.toggleKnob} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.card} ${styles.dangerCard}`}>
              <h3 className={`${styles.cardTitle} ${styles.dangerTitle}`}>Danger Nexus</h3>
              <div className={styles.warningBox}>
                CRITICAL: Enabling Maintenance Mode will immediately redirect all non-administrative traffic to the construction gateway.
              </div>
              <div className={styles.featureItem} style={{ background: '#fef2f2' }}>
                <div className={styles.featureInfo}>
                  <strong style={{ color: '#991b1b' }}>Maintenance Mode</strong>
                  <span>Block access for non-administrators</span>
                </div>
                <div
                  className={`${styles.toggle} ${settings?.maintenance?.enabled ? styles.toggleOn : ''}`}
                  onClick={() => {
                    const currentMaintenance = settings?.maintenance || { enabled: false };
                    updateSetting('maintenance', { ...currentMaintenance, enabled: !currentMaintenance.enabled });
                  }}
                  style={{ background: settings?.maintenance?.enabled ? '#dc2626' : '#cbd5e1' }}
                >
                  <div className={styles.toggleKnob} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Active Devices */}
      {activeTab === 'devices' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-violet-500" />
              Active Device Governance
            </h2>
            <button
              onClick={fetchDevices}
              disabled={devicesLoading}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-800 border border-neutral-700 py-1.5 px-3 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${devicesLoading ? 'animate-spin' : ''}`} />
              Refresh list
            </button>
          </div>

          {devicesLoading ? (
            <div className="py-12 text-center text-sm text-neutral-400">Loading active sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">No active user sessions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Device / Session Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">IP Hash</th>
                    <th className="py-3 px-4">Last active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50 text-sm">
                  {sessions.map(sess => {
                    const isSessionRevoked = sess.revoked_at !== null || new Date(sess.expires_at) < new Date();
                    
                    return (
                      <tr key={sess.id} className="hover:bg-neutral-850/40">
                        <td className="py-4 px-4 font-medium text-neutral-200">
                          {editingSessionId === sess.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editSessionName}
                                onChange={e => setEditSessionName(e.target.value)}
                                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                              <button
                                onClick={() => handleRenameSession(sess.id)}
                                className="text-xs bg-violet-600 text-white rounded px-2 py-1 hover:bg-violet-500"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingSessionId(null)}
                                className="text-xs bg-neutral-700 text-neutral-300 rounded px-2 py-1 hover:bg-neutral-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{sess.session_name || 'Unknown Browser'}</span>
                              {!isSessionRevoked && (
                                <button
                                  onClick={() => {
                                    setEditingSessionId(sess.id);
                                    setEditSessionName(sess.session_name || '');
                                  }}
                                  className="text-neutral-500 hover:text-neutral-300 transition"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-neutral-500 truncate max-w-xs mt-0.5" title={sess.user_agent}>
                            {sess.user_agent}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            sess.session_type === 'impersonation'
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {sess.session_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-neutral-350">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-neutral-500" />
                            <span>{sess.region && sess.country ? `${sess.region}, ${sess.country}` : 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-neutral-400" title={sess.ip_hash}>
                          {sess.ip_hash.substring(0, 12)}...
                        </td>
                        <td className="py-4 px-4 text-neutral-350 text-xs">
                          {new Date(sess.last_active_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {isSessionRevoked ? (
                            <span className="text-xs text-rose-500/80 font-medium flex items-center justify-end gap-1">
                              <XCircle className="h-3.5 w-3.5" />
                              Revoked
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRevokeSession(sess.id)}
                              className="text-xs text-rose-500 hover:text-rose-400 hover:underline font-semibold"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Quarantine Manager */}
      {activeTab === 'quarantine' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <FolderLock className="h-5 w-5 text-violet-500" />
              Secure Storage Quarantine Manager
            </h2>
            <button
              onClick={fetchQuarantine}
              disabled={quarantineLoading}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-800 border border-neutral-700 py-1.5 px-3 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${quarantineLoading ? 'animate-spin' : ''}`} />
              Refresh list
            </button>
          </div>

          {quarantineLoading ? (
            <div className="py-12 text-center text-sm text-neutral-400">Loading quarantine logs...</div>
          ) : quarantinedFiles.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">No quarantined items found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Original File Path</th>
                    <th className="py-3 px-4">Bucket</th>
                    <th className="py-3 px-4">Quarantined At</th>
                    <th className="py-3 px-4">Retention Expires</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50 text-sm">
                  {quarantinedFiles.map(file => (
                    <tr key={file.id} className="hover:bg-neutral-850/40">
                      <td className="py-4 px-4">
                        <div className="font-medium text-neutral-200">{file.original_path.split('/').pop()}</div>
                        <div className="text-xs text-neutral-500 truncate max-w-sm mt-0.5" title={file.original_path}>
                          {file.original_path}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-neutral-400 text-xs font-semibold">
                        {file.bucket_name}
                      </td>
                      <td className="py-4 px-4 text-neutral-350 text-xs">
                        {new Date(file.quarantined_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-neutral-350 text-xs">
                        {new Date(file.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          file.status === 'quarantined'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : file.status === 'restoring'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : file.status === 'restored'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {file.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {file.status === 'quarantined' && (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleRestoreQuarantine(file.id)}
                              className="text-xs text-violet-400 hover:text-violet-300 font-semibold hover:underline flex items-center gap-1"
                            >
                              <FileCheck className="h-3.5 w-3.5" />
                              Restore
                            </button>
                            <button
                              onClick={() => handlePurgeQuarantine(file.id)}
                              className="text-xs text-rose-500 hover:text-rose-400 font-semibold hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Purge
                            </button>
                          </div>
                        )}
                        {file.status === 'restored' && (
                          <span className="text-xs text-green-500 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Restored
                          </span>
                        )}
                        {file.status === 'restoring' && (
                          <span className="text-xs text-blue-400 font-semibold flex items-center justify-end gap-1">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Restoring
                          </span>
                        )}
                        {file.status === 'deleted' && (
                          <span className="text-xs text-rose-500 font-semibold flex items-center justify-end gap-1">
                            <XCircle className="h-3.5 w-3.5" />
                            Purged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
