"use client";

import { useState, useEffect } from 'react';
import { invokeFunction, insforge } from '@/lib/insforge';
import { AdminInput, AdminPasswordInput, AdminButton, AdminSelect, AdminTextArea } from './AdminForm';

interface RecruiterRegisterFormProps {
  onSuccess?: (recruiter: any) => void;
  onCancel?: () => void;
}

// Helper to generate a secure random password
function generateSecurePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

export function RecruiterRegisterForm({ onSuccess, onCancel }: RecruiterRegisterFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyId: '',
  });

  // New Company states
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    description: '',
    gstin: '',
    tan: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Verification & Credentials States
  const [registeredUserId, setRegisteredUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    async function loadCompanies() {
      try {
        const { data, error } = await invokeFunction('admin-companies', {
          method: 'GET',
          queries: { limit: '100' }
        });
        if (data && data.companies) {
          setCompanies(data.companies.map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      }
    }
    loadCompanies();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Step 1: Register the recruiter with a random temp password
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Generate password
    const tempPassword = generateSecurePassword();
    setGeneratedPassword(tempPassword);
    setCustomPassword(tempPassword);
    setConfirmPassword(tempPassword);

    try {
      let finalCompanyId = formData.companyId;

      if (formData.companyId === 'new') {
        if (!newCompanyData.name) {
          throw new Error('New company name is required.');
        }

        // 1. Upload logo if exists
        let logo_url = null;
        if (logoFile) {
          const { data: uploadData, error: uploadError } = await insforge.storage
            .from('company-logos')
            .uploadAuto(logoFile);

          if (uploadError) throw new Error('Logo upload failed: ' + uploadError.message);
          logo_url = uploadData?.url || null;
        }

        // 2. Invoke admin-companies to register company
        const { data: companyResult, error: companyError } = await invokeFunction('admin-companies', {
          method: 'POST',
          body: {
            ...newCompanyData,
            logo_url,
            is_verified: true
          }
        });

        if (companyError) throw new Error('Failed to register company: ' + companyError.message);
        if (!companyResult?.company?.id) throw new Error('Failed to register company: no company ID returned.');

        finalCompanyId = companyResult.company.id;
      }

      // 3. Register Recruiter
      const { data, error } = await invokeFunction('admin-recruiters', {
        method: 'POST',
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: tempPassword,
          companyId: finalCompanyId,
        },
      });

      if (error) throw new Error(error.message);

      setSuccess('Account draft created! A verification code has been sent to ' + formData.email);
      setRegisteredUserId(data.user.id);
      
      // Advance to step 2 after a short delay
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to create recruiter account draft');
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Verify the OTP
  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await invokeFunction('admin-recruiters', {
        method: 'POST',
        body: {
          action: 'verify-otp',
          email: formData.email,
          otp
        }
      });

      if (error) throw new Error(error.message);

      setSuccess('Email verified successfully! Recruiter is now active.');
      
      setTimeout(() => {
        setStep(3);
        setSuccess('');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setSaving(false);
    }
  };

  // Step 3: Save Password & Send Credentials
  const handleSavePasswordAndInvite = async () => {
    if (customPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (customPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    setError('');
    setPasswordError('');
    setSuccess('');

    try {
      // 1. If password was edited, update it via update-password endpoint
      if (customPassword !== generatedPassword) {
        const { error: updateError } = await invokeFunction('admin-recruiters', {
          method: 'POST',
          body: {
            action: 'update-password',
            userId: registeredUserId,
            password: customPassword
          }
        });
        if (updateError) throw new Error(updateError.message);
      }

      // 2. Trigger credentials email sending
      const { data: credentialsData, error: credentialsError } = await invokeFunction('admin-recruiters', {
        method: 'POST',
        body: {
          action: 'send-credentials',
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          password: customPassword
        }
      });

      if (credentialsError) throw new Error(credentialsError.message);

      setSuccess('Credentials sent successfully!');

      if (onSuccess) {
        setTimeout(() => {
          onSuccess({
            id: registeredUserId,
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            _plainPassword: customPassword
          });
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration credentials setup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Step Indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '0.5rem', 
        background: '#f8fafc', 
        padding: '0.85rem 1.25rem', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0' 
      }}>
        {[
          { num: 1, label: 'Details' },
          { num: 2, label: 'Verify OTP' },
          { num: 3, label: 'Credentials' }
        ].map((s) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px', 
              height: '24px', 
              borderRadius: '50%',
              background: step === s.num ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : step > s.num ? '#10b981' : '#cbd5e1',
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.75rem', 
              fontWeight: 700,
              boxShadow: step === s.num ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {step > s.num ? '✓' : s.num}
            </div>
            <span style={{
              fontSize: '0.8rem', 
              fontWeight: step === s.num ? 700 : 500,
              color: step === s.num ? '#1e293b' : '#94a3b8'
            }}>{s.label}</span>
          </div>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #fee2e2' }}>⚠️ {error}</div>}
      {success && <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #d1fae5' }}>✅ {success}</div>}

      {/* STEP 1: Details */}
      {step === 1 && (
        <form onSubmit={handleRegisterSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <AdminInput
              label="First Name"
              value={formData.firstName}
              onChange={e => handleInputChange('firstName', e.target.value)}
              required
            />
            <AdminInput
              label="Last Name"
              value={formData.lastName}
              onChange={e => handleInputChange('lastName', e.target.value)}
            />
          </div>

          <AdminInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            required
          />

          <AdminSelect
            label="Assign to Company"
            value={formData.companyId}
            onChange={e => handleInputChange('companyId', e.target.value)}
            options={[
              { value: '', label: 'Select Company...' },
              { value: 'new', label: '+ Create & Register New Company...' },
              ...companies.map(c => ({ value: c.id, label: c.name }))
            ]}
          />

          {formData.companyId === 'new' && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'grid',
              gap: '1rem',
              marginTop: '0.5rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>🏢 New Company Profile</h4>
              
              <AdminInput
                label="Company Name"
                value={newCompanyData.name}
                onChange={e => setNewCompanyData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g. Acme Tech Solutions"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <AdminInput
                  label="Corporate Website"
                  value={newCompanyData.website}
                  onChange={e => setNewCompanyData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
                <AdminInput
                  label="Location"
                  value={newCompanyData.location}
                  onChange={e => setNewCompanyData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <AdminSelect
                  label="Industry"
                  value={newCompanyData.industry}
                  onChange={e => setNewCompanyData(prev => ({ ...prev, industry: e.target.value }))}
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
                  value={newCompanyData.size}
                  onChange={e => setNewCompanyData(prev => ({ ...prev, size: e.target.value }))}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <AdminInput
                  label="GSTIN (Optional)"
                  value={newCompanyData.gstin}
                  onChange={e => setNewCompanyData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  placeholder="e.g. 22AAAAA1111A1Z1"
                />
                <AdminInput
                  label="TAN (Optional)"
                  value={newCompanyData.tan}
                  onChange={e => setNewCompanyData(prev => ({ ...prev, tan: e.target.value.toUpperCase() }))}
                  placeholder="e.g. ABCD12345E"
                />
              </div>

              <AdminTextArea
                label="Description"
                value={newCompanyData.description}
                onChange={e => setNewCompanyData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief mission statement or overview..."
                rows={3}
              />

              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', background: '#fff', position: 'relative', cursor: 'pointer' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setLogoPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} 
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                />
                {logoPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img src={logoPreview} style={{ height: '50px', objectFit: 'contain', borderRadius: '8px' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Click to change logo</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>📁 Upload Company Logo</span>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            {onCancel && <AdminButton type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</AdminButton>}
            <AdminButton
              type="submit"
              isLoading={saving}
              disabled={!formData.email || !formData.firstName || !formData.companyId || (formData.companyId === 'new' && !newCompanyData.name)}
              style={{ flex: 2 }}
            >
              Register &amp; Send OTP
            </AdminButton>
          </div>
        </form>
      )}

      {/* STEP 2: Verify OTP */}
      {step === 2 && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📱</div>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Enter Verification OTP</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              We sent a verification code to <strong style={{ color: '#0f172a' }}>{formData.email}</strong>.
              Enter it below to verify this recruiter.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              6-Digit Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '2rem',
                letterSpacing: '0.5em',
                textAlign: 'center',
                fontWeight: 700,
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: '#fff',
                color: '#1e293b',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <AdminButton type="button" variant="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</AdminButton>
            <AdminButton
              type="button"
              onClick={handleVerifyOtp}
              isLoading={saving}
              disabled={otp.length < 6}
              style={{ flex: 2 }}
            >
              Verify &amp; Activate
            </AdminButton>
          </div>
        </div>
      )}

      {/* STEP 3: Password Generation & Confirmation */}
      {step === 3 && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {/* Generated Password Display */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              🔑 Generated Password
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                readOnly
                value={generatedPassword}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  alert('Password copied to clipboard!');
                }}
                style={{
                  padding: '10px 14px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'white'
                }}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Password Customize Fields */}
          <div style={{ display: 'grid', gap: '0.5rem', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '12px', background: '#fff' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: '#1e293b' }}>Customize Password (Optional)</h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#64748b' }}>
              You can change the password below if you wish to override the automatically generated one.
            </p>
            
            <AdminPasswordInput
              label="Password"
              value={customPassword}
              onChange={e => {
                setCustomPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="Enter new password"
            />
            <AdminPasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="Confirm new password"
            />
            {passwordError && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>⚠️ {passwordError}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <AdminButton
              type="button"
              onClick={handleSavePasswordAndInvite}
              isLoading={saving}
              disabled={!customPassword || !confirmPassword}
              style={{ width: '100%' }}
            >
              Save Password &amp; Send Credentials
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
