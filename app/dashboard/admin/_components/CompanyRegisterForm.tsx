"use client";

import { useState } from 'react';
import { invokeFunction, insforge } from '@/lib/insforge';
import { AdminInput, AdminButton, AdminSelect, AdminTextArea } from './AdminForm';

interface CompanyRegisterFormProps {
  onSuccess?: (company: any) => void;
  onCancel?: () => void;
}

export function CompanyRegisterForm({ onSuccess, onCancel }: CompanyRegisterFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    description: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        console.log('[CompanyRegisterForm Upload]', uploadData);
        
        logo_url = uploadData?.key || null;
      }

      const { data, error } = await invokeFunction('admin-companies', {
        method: 'POST',
        body: { 
          ...formData,
          logo_url,
          is_verified: true
        },
      });

      if (error) throw new Error(error.message);

      setSuccess('Company identity established successfully.');
      if (onSuccess) {
        setTimeout(() => onSuccess(data.company), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
      {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #fee2e2' }}>{error}</div>}
      {success && <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #d1fae5' }}>{success}</div>}

      <AdminInput
        label="Legal Company Name"
        value={formData.name}
        onChange={e => handleInputChange('name', e.target.value)}
        required
        placeholder="e.g. TalentMesh Global"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <AdminInput
          label="Corporate Website"
          value={formData.website}
          onChange={e => handleInputChange('website', e.target.value)}
          placeholder="https://example.com"
        />
        <AdminInput
          label="Location"
          value={formData.location}
          onChange={e => handleInputChange('location', e.target.value)}
          placeholder="City, Country"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <AdminSelect
          label="Industry"
          value={formData.industry}
          onChange={e => handleInputChange('industry', e.target.value)}
          options={[
            { value: '', label: 'Select Industry' },
            { value: 'Technology', label: 'Technology' },
            { value: 'Healthcare', label: 'Healthcare' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Other', label: 'Other' },
          ]}
        />
        <AdminSelect
          label="Size"
          value={formData.size}
          onChange={e => handleInputChange('size', e.target.value)}
          options={[
            { value: '', label: 'Select Size' },
            { value: '1-10', label: '1-10' },
            { value: '11-50', label: '11-50' },
            { value: '51-200', label: '51-200' },
            { value: '201-500', label: '201-500' },
            { value: '500+', label: '500+' },
          ]}
        />
      </div>

      <AdminTextArea
        label="Description"
        value={formData.description}
        onChange={e => handleInputChange('description', e.target.value)}
        placeholder="Brief mission statement..."
        rows={3}
      />

      <div style={{ border: '2px dashed #e2e8f0', borderRadius: '8px', padding: '1rem', textAlign: 'center', background: '#f8fafc', position: 'relative' }}>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        {logoPreview ? (
          <img src={logoPreview} style={{ height: '40px', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Click to upload logo</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        {onCancel && <AdminButton type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</AdminButton>}
        <AdminButton type="submit" isLoading={saving} disabled={!formData.name} style={{ flex: 2 }}>Register Company</AdminButton>
      </div>
    </form>
  );
}
