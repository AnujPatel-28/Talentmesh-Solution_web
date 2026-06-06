"use client";

import { useEffect, useState, useCallback } from 'react';
import styles from '../jobs/jobs.module.css';
import { invokeFunction, insforge } from '@/lib/insforge';
import { AdminHeader } from '../_components/AdminHeader';
import { AdminStatCard } from '../_components/AdminStatCard';
import { AdminInput, AdminButton } from '../_components/AdminForm';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';

type AdminCompany = {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  description: string | null;
  location: string | null;
  is_verified: boolean;
  is_active: boolean;
  gstin: string | null;
  tan: string | null;
  kyc_documents: any | null;
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

  const [previewCompany, setPreviewCompany] = useState<AdminCompany | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://sytk3jgv.ap-southeast.insforge.app';
      let targetUrl = url;
      if (url.startsWith(insforgeUrl)) {
        targetUrl = url.replace(insforgeUrl, `${window.location.origin}/api/v1/remote`);
      }

      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download document:', err);
      window.open(url, '_blank');
    }
  };

  const handleView = async (url: string) => {
    try {
      const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://sytk3jgv.ap-southeast.insforge.app';
      let targetUrl = url;
      if (url.startsWith(insforgeUrl)) {
        targetUrl = url.replace(insforgeUrl, `${window.location.origin}/api/v1/remote`);
      }

      const response = await fetch(targetUrl);
      const blob = await response.blob();
      
      let mimeType = blob.type;

      // Read magic bytes to determine the correct MIME type
      try {
        const buffer = await blob.slice(0, 4).arrayBuffer();
        const arr = new Uint8Array(buffer);
        // PDF magic bytes: %PDF (25 50 44 46)
        if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
          mimeType = 'application/pdf';
        }
        // PNG magic bytes: 89 50 4E 47
        else if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
          mimeType = 'image/png';
        }
        // JPEG magic bytes: FF D8 FF
        else if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
          mimeType = 'image/jpeg';
        }
        // GIF magic bytes: 47 49 46 38 (GIF8)
        else if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
          mimeType = 'image/gif';
        }
      } catch (readErr) {
        console.error('Failed to parse magic bytes:', readErr);
      }
      
      if (mimeType === 'application/octet-stream' || !mimeType) {
        if (url.toLowerCase().endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (url.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else {
          mimeType = 'application/pdf'; // Default to PDF for rendering KYC documents
        }
      }
      
      const fileBlob = new Blob([blob], { type: mimeType });
      const blobUrl = window.URL.createObjectURL(fileBlob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Failed to view document:', err);
      window.open(url, '_blank');
    }
  };

  const toggleVerification = async (company: AdminCompany) => {
    setVerifying(true);
    setError('');
    setSuccess('');
    try {
      const nextStatus = !company.is_verified;
      const { data, error: updateErr } = await invokeFunction('admin-companies', {
        method: 'PATCH',
        queries: { id: company.id },
        body: { is_verified: nextStatus }
      });

      if (updateErr) throw new Error(updateErr.message);

      if (data?.company) {
        setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, is_verified: nextStatus } : c));
        setPreviewCompany(prev => prev && prev.id === company.id ? { ...prev, is_verified: nextStatus } : prev);
        setSuccess(`Company ${nextStatus ? 'verified' : 'unverified'} successfully.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update verification status');
    } finally {
      setVerifying(false);
    }
  };

  const toggleActiveStatus = async (company: AdminCompany) => {
    setTogglingActive(true);
    setError('');
    setSuccess('');
    try {
      const nextActive = !company.is_active;
      const { data, error: updateErr } = await invokeFunction('admin-companies', {
        method: 'PATCH',
        queries: { id: company.id },
        body: { is_active: nextActive }
      });

      if (updateErr) throw new Error(updateErr.message);

      if (data?.company) {
        setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, is_active: nextActive } : c));
        setPreviewCompany(prev => prev && prev.id === company.id ? { ...prev, is_active: nextActive } : prev);
        setSuccess(`Company account ${nextActive ? 'activated' : 'suspended'} successfully.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update company active status');
    } finally {
      setTogglingActive(false);
    }
  };

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeFunction('admin-companies', {
        method: 'GET'
      });

      if (!error) {
        setCompanies(data.companies || []);
      } else {
        setError(error.message || 'Failed to load companies');
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
        const { data: uploadData, error: uploadError } = await insforge.storage
          .from('company-logos')
          .uploadAuto(logoFile);

        if (uploadError) throw new Error('Logo upload failed: ' + uploadError.message);
        
        // Log for runtime verification (Release 2)
        console.log('[Admin Companies Upload]', uploadData);
        
        logo_url = uploadData?.key || null;
      }

      const { error } = await invokeFunction('admin-companies', {
        method: 'POST',
        body: { name, logo_url },
      });

      if (!error) {
        setSuccess('Company created successfully');
        resetForm();
        fetchCompanies();
      } else {
        setError(error.message || 'Failed to save company');
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
                companies.map(company => {
                  const isSelected = previewCompany?.id === company.id;
                  return (
                    <article 
                      key={company.id} 
                      className={`${styles.jobCard} ${isSelected ? styles.cardActive : ''}`} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPreviewCompany(company)}
                    >
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '12px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'grid',
                          placeItems: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {company.logo_url ? (
                            <img src={getPublicStorageUrl('company-logos', company.logo_url)} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: '1.5rem', color: '#94a3b8', fontWeight: 700 }}>{company.name[0]}</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className={styles.jobCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <h2 className={styles.jobTitle} style={{ fontSize: '1.1rem', margin: 0 }}>{company.name}</h2>
                            <span style={{
                              padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                              background: company.is_verified ? '#dcfce7' : '#fee2e2',
                              color: company.is_verified ? '#166534' : '#991b1b',
                              border: '1px solid',
                              borderColor: company.is_verified ? '#bbf7d0' : '#fca5a5'
                            }}>
                              {company.is_verified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <p className={styles.jobMeta} style={{ margin: 0 }}>
                              Registered: {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'System Default'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: company.is_active ? '#22c55e' : '#ef4444'
                              }} />
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                {company.is_active ? 'Active' : 'Suspended'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
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

      {/* ── Company Detail Drawer ────────────────────────────────────────── */}
      {previewCompany && (
        <div className={styles.drawerOverlay} onClick={() => setPreviewCompany(null)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h2>Company Details</h2>
              <button className={styles.drawerClose} onClick={() => setPreviewCompany(null)}>×</button>
            </header>

            <div className={styles.drawerContent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Status Section */}
              <div style={{ display: 'grid', gap: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Platform Authorization</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    {previewCompany.is_active 
                      ? 'This company is active. Associated recruiters can access features.' 
                      : 'This company is suspended. Associated recruiters cannot log in or post jobs.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => toggleVerification(previewCompany)}
                    disabled={verifying}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: previewCompany.is_verified ? '#fee2e2' : '#dcfce7',
                      color: previewCompany.is_verified ? '#991b1b' : '#166534',
                      border: '1px solid',
                      borderColor: previewCompany.is_verified ? '#fca5a5' : '#86efac',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: verifying ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {verifying ? 'Updating...' : previewCompany.is_verified ? '❌ Unverify' : '✅ Verify Company'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActiveStatus(previewCompany)}
                    disabled={togglingActive}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: previewCompany.is_active ? '#ffedd5' : '#dbeafe',
                      color: previewCompany.is_active ? '#9a3412' : '#1e40af',
                      border: '1px solid',
                      borderColor: previewCompany.is_active ? '#fed7aa' : '#bfdbfe',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: togglingActive ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {togglingActive ? 'Updating...' : previewCompany.is_active ? '⚠️ Suspend' : '⚡ Activate'}
                  </button>
                </div>
              </div>

              {/* Company Info */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {previewCompany.logo_url ? (
                    <img src={getPublicStorageUrl('company-logos', previewCompany.logo_url)} alt={previewCompany.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '1.75rem', color: '#94a3b8', fontWeight: 700 }}>{previewCompany.name[0]}</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{previewCompany.name}</h3>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      background: previewCompany.is_verified ? '#dcfce7' : '#fee2e2',
                      color: previewCompany.is_verified ? '#166534' : '#991b1b'
                    }}>
                      {previewCompany.is_verified ? 'Verified Entity' : 'Unverified'}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      background: previewCompany.is_active ? '#e0f2fe' : '#f1f5f9',
                      color: previewCompany.is_active ? '#0369a1' : '#475569'
                    }}>
                      {previewCompany.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta details */}
              <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9rem', color: '#334155' }}>
                {previewCompany.website && (
                  <div>
                    <strong>Website:</strong>{' '}
                    <a href={previewCompany.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                      {previewCompany.website} ↗
                    </a>
                  </div>
                )}
                <div>
                  <strong>Industry:</strong> {previewCompany.industry || 'Not specified'}
                </div>
                <div>
                  <strong>Company Size:</strong> {previewCompany.size || 'Not specified'} employees
                </div>
                <div>
                  <strong>Location:</strong> {previewCompany.location || 'Not specified'}
                </div>
                {previewCompany.description && (
                  <div>
                    <strong>About Company:</strong>
                    <p style={{ margin: '6px 0 0 0', color: '#475569', lineHeight: 1.6 }}>
                      {previewCompany.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Tax Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>GSTIN</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.9rem' }}>{previewCompany.gstin || '—'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>TAN</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.9rem' }}>{previewCompany.tan || '—'}</div>
                </div>
              </div>

              {/* Documents */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', paddingBottom: '2rem' }}>
                {previewCompany.kyc_documents && (Array.isArray(previewCompany.kyc_documents) ? previewCompany.kyc_documents.length > 0 : true) ? (
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '0.75rem' }}>Verification & KYC Documents</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(Array.isArray(previewCompany.kyc_documents) ? previewCompany.kyc_documents : [previewCompany.kyc_documents]).map((doc: any, index: number) => {
                        const docUrl = doc?.url;
                        const docName = doc?.name || `document_${index + 1}`;
                        if (!docUrl) return null;
                        return (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '220px' }} title={docName}>
                              📄 {docName}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleView(docUrl)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600
                                }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(docUrl, docName.endsWith('.pdf') ? docName : `${docName}.pdf`)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  background: '#0f172a',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600
                                }}
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', color: '#64748b' }}>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '4px' }}>📁</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>No verification documents uploaded.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </section>
  );
}
