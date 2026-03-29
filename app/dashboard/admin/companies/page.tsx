"use client";

import { useEffect, useState, useCallback } from 'react';
import styles from '../jobs/jobs.module.css'; 
import { uploadCompanyLogo } from '@/lib/api/storage';
import { AdminHeader } from '../_components/AdminHeader';
import { AdminStatCard } from '../_components/AdminStatCard';
import { AdminInput, AdminButton } from '../_components/AdminForm';

type AdminCompany = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at?: string;
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/companies`);
      const payload = await res.json();

      if (res.ok) {
        setCompanies(payload.companies || []);
      } else {
        setError(payload.message || 'Failed to load companies');
      }
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const resetForm = () => {
    setName('');
    setLogoFile(null);
    setLogoPreview(null);
    setSuccess('');
    setError('');
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let logo_url = null;

      if (logoFile) {
        const tempId = crypto.randomUUID();
        logo_url = await uploadCompanyLogo(logoFile, tempId);
      }

      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logo_url }),
      });

      if (res.ok) {
        setSuccess('Company created successfully');
        resetForm();
        fetchCompanies();
      } else {
        const errorData = await res.text();
        setError(errorData || 'Failed to save company');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.page}>
      <AdminHeader 
        title="Companies Registry"
        eyebrow="TalentMesh Organizational Index"
        subtitle="Manage the global list of verified organizations and their brand assets."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/admin' }, { label: 'Companies' }]}
        actions={
          <AdminButton onClick={resetForm}>Create New Company</AdminButton>
        }
      />

      <div className={styles.stats} style={{ marginBottom: '32px' }}>
        <AdminStatCard 
          label="Registered Entities" 
          value={companies.length} 
          color="indigo"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /></svg>}
        />
      </div>

      <div className={styles.grid}>
        <div className={styles.listPanel}>
          <div className={styles.listBody}>
            {loading ? <div className={styles.emptyState}>Syncing entities...</div> : 
             companies.length === 0 ? <div className={styles.emptyState}>No registered companies found.</div> : (
              companies.map(company => (
                <article key={company.id} className={styles.jobCard} style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '12px', 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0',
                      display: 'grid', 
                      placeItems: 'center',
                      overflow: 'hidden'
                    }}>
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', color: '#94a3b8', fontWeight: 700 }}>{company.name[0]}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className={styles.jobCardHeader}>
                        <h2 className={styles.jobTitle} style={{ fontSize: '1.1rem' }}>{company.name}</h2>
                      </div>
                      <p className={styles.jobMeta}>
                        Registered: {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'System Default'}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Platform Onboarding</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Provision new organizational identities into the system.</p>
          </div>
          
          <form className={styles.form} onSubmit={handleSave}>
            <AdminInput 
              label="Legal Entity Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Acme Tech Solutions"
            />

            <div className={styles.field}>
              <label className={styles.label}>Corporate Branding (Logo)</label>
              <div style={{
                border: '2px dashed #e2e8f0',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s',
              }}>
                <input 
                  id="logo-upload"
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                
                {logoPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <img src={logoPreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px' }} />
                    <strong>{logoFile?.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Click to replace brand asset</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#64748b' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff', display: 'grid', placeItems: 'center', border: '1px solid #e2e8f0' }}>
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>Drop branding asset here</p>
                      <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>SVG, PNG, JPG (max. 2MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formActions} style={{ marginTop: '32px' }}>
              <AdminButton variant="secondary" type="button" onClick={resetForm}>Clear Form</AdminButton>
              <AdminButton type="submit" isLoading={saving} disabled={!name}>
                Verify & Create Entity
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
