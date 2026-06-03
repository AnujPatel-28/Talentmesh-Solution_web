'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './settings.module.css';
import { invokeFunction, insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

type PlatformSettings = {
  general: any;
  featureFlags: any;
  maintenance: any;
};

type AdminMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function AdminSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [adminName, setAdminName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    if (user?.name) {
      setAdminName(user.name);
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        invokeFunction('admin-settings', { method: 'GET' }),
        invokeFunction('admin-settings', { method: 'GET', queries: { section: 'admins' } })
      ]);
      
      if (!sRes.error) setSettings(sRes.data);
      if (!aRes.error) setAdmins(aRes.data.admins);
    } catch (err) {
      setMessage({ text: 'Internal registry sync failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateSetting = async (key: string, value: any) => {
    try {
      const { data, error } = await invokeFunction('admin-settings', {
        method: 'PATCH',
        body: { key, value },
      });
      if (!error) {
        setSettings(prev => prev ? { ...prev, [key]: value } : null);

        // Handle maintenance cookie for middleware performance
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
    } catch (err) {
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
    const nextFlags = { ...settings.featureFlags, [flagKey]: !settings.featureFlags[flagKey] };
    updateSetting('feature_flags', nextFlags);
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await invokeFunction('admin-settings', {
        method: 'POST',
        body: { email: newAdminEmail, action: 'add_admin' },
      });
      if (!error) {
        setNewAdminEmail('');
        fetchAll();
        setMessage({ text: 'Administrative access granted', type: 'success' });
      } else {
        setMessage({ text: error.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network failure', type: 'error' });
    }
  };

  const removeAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to revoke administrative access for this user?')) return;
    try {
      const { error } = await invokeFunction('admin-settings', {
        method: 'DELETE',
        body: { id },
      });
      if (!error) {
        fetchAll();
        setMessage({ text: 'Admin privileges revoked', type: 'info' });
      }
    } catch (err) {
      setMessage({ text: 'Revocation failed', type: 'error' });
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Connecting to platform backbone...</div>;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Global Control Center</p>
        <h1 className={styles.title}>Network Governance</h1>
        <p className={styles.subtitle}>Modify architecture flags, manage administrative authority, and oversee system integrity.</p>
      </header>

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

      <div className={styles.settingsGrid}>
        <div className={styles.mainCol}>
          <div className={styles.card}>
            <h3 className={styles.chartTitle}>Personal Profile Settings</h3>
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
            <h3 className={styles.chartTitle}>General Configuration</h3>
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
            <h3 className={styles.chartTitle}>Administrative Registry</h3>
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
            <h3 className={styles.chartTitle}>Architectural Flags</h3>
            <div className={styles.featureList}>
              {[
                { key: 'candidateRegistration', label: 'Candidate Onboarding', desc: 'Allow new professional registration' },
                { key: 'recruiterRegistration', label: 'Employer Onboarding', desc: 'Allow new company registration' },
                { key: 'blogEnabled', label: 'Knowledge Hub', desc: 'Public content /blog visibility' },
                { key: 'messagingEnabled', label: 'Direct Messaging', desc: 'Real-time peer-to-peer comms' },
                { key: 'aiMatching', label: 'AI Intelligence', desc: 'Semantic profile/job matching' },
              ].map(flag => (
                <div key={flag.key} className={styles.featureItem}>
                  <div className={styles.featureInfo}>
                    <strong>{flag.label}</strong>
                    <span>{flag.desc}</span>
                  </div>
                  <div
                    className={`${styles.toggle} ${settings?.featureFlags?.[flag.key] ? styles.toggleOn : ''}`}
                    onClick={() => toggleFeature(flag.key)}
                  >
                    <div className={styles.toggleKnob} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${styles.card} ${styles.dangerCard}`}>
            <h3 className={`${styles.chartTitle} ${styles.dangerTitle}`}>Danger Nexus</h3>
            <div className={styles.warningBox}>
              CRITICAL: Enabling Maintenance Mode will immediately redirect all non-administrative traffic to the construction gateway.
            </div>
            <div className={styles.featureItem} style={{ background: '#fef2f2' }}>
              <div className={styles.featureInfo}>
                <strong style={{ color: '#991b1b' }}>Platform Maintenance</strong>
                <span>Global Traffic Redirection</span>
              </div>
              <div
                className={`${styles.toggle} ${settings?.maintenance?.enabled ? styles.toggleOn : ''}`}
                onClick={() => updateSetting('maintenance', { ...settings!.maintenance, enabled: !settings!.maintenance.enabled })}
                style={{ background: settings?.maintenance?.enabled ? '#dc2626' : '#cbd5e1' }}
              >
                <div className={styles.toggleKnob} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
