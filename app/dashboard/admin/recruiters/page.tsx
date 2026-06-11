'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import styles from '../candidates/candidates.module.css'; // Reusing established styles
import { invokeFunction, insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { CompanyRegisterForm } from '../_components/CompanyRegisterForm';
import { RecruiterRegisterForm } from '../_components/RecruiterRegisterForm';
import { AdminButton } from '../_components/AdminForm';
import { useSelection } from '@/hooks/useSelection';
import { BulkConfirmModal } from '../_components/BulkConfirmModal';
import { mutationQueue } from '@/lib/mutationQueue';
import { canPerform, Role } from '@/lib/permissions';
import { recordMetric, startTrace, endTrace } from '@/lib/observability';
import { Globe, Users, Clock, CheckCircle2, XCircle, FileText, Download, Smartphone, Trash2, ShieldAlert } from 'lucide-react';


type RecruiterProfile = {
  id: string;
  company_name: string;
  industry?: string;
  company_size?: string;
  company_address?: string;
  is_approved: boolean;
  status?: string;
  website_url?: string;
  linkedin_url?: string;
  about?: string;
  document_url?: string;
  job_title?: string;
  department?: string;
  pan_number?: string;
  aadhaar_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_address?: string;
  kyc_document_url?: string;
  companies?: {
    id: string;
    name: string;
    logo_url?: string;
    about?: string;
    website?: string;
    industry?: string;
    location?: string;
    gstin?: string;
    tan?: string;
    kyc_documents?: any;
  };
};

type AdminRecruiter = {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  recruiter_profiles: RecruiterProfile | RecruiterProfile[];
  phone?: string;
  location?: string;
};

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

// ── Admin-side OTP Verification Modal ───────────────────────────────────────
function VerifyOtpModal({
  recruiter,
  onClose,
  onSuccess,
}: {
  recruiter: AdminRecruiter;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New States for Password Generation & Customization
  const [verified, setVerified] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    setOtpSentAt(Date.now());
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Expiration timer
  useEffect(() => {
    if (!otpSentAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
      const remaining = Math.max(0, 120 - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSentAt]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      await insforge.auth.resendVerificationEmail({ email: recruiter.email });
      setOtpSentAt(Date.now());
      setTimeLeft(120);
      setResendCooldown(60);
      setSuccess('Verification code resent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft <= 0) {
      setError('Verification code has expired. Please request a new one.');
      return;
    }
    if (otp.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await invokeFunction('admin-recruiters', {
        method: 'POST',
        body: { action: 'verify-otp', email: recruiter.email, otp },
      });
      if (err) throw new Error(err.message);

      setSuccess('✅ Email verified! Recruiter account is now active.');

      // Generate secure password
      const tempPassword = generateSecurePassword();
      setGeneratedPassword(tempPassword);
      setCustomPassword(tempPassword);
      setConfirmPassword(tempPassword);

      setTimeout(() => {
        setVerified(true);
        setSuccess('');
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Verification failed. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePasswordAndInvite = async () => {
    if (customPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (customPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
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
            userId: recruiter.id,
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
          email: recruiter.email,
          name: recruiter.name,
          password: customPassword
        }
      });

      if (credentialsError) throw new Error(credentialsError.message);

      setSuccess('Credentials saved & sent successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to complete credentials setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '16px', padding: '2rem',
          width: '100%', maxWidth: '460px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          maxHeight: '90vh', overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {!verified ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Verify Recruiter Email</h2>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Enter the 6-digit code the recruiter received at<br />
                <strong style={{ color: '#1e293b' }}>{recruiter.email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerify} style={{ display: 'grid', gap: '1rem' }}>
              {error && (
                <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #fee2e2' }}>
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #d1fae5' }}>
                  {success}
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1.75rem',
                    letterSpacing: '0.6em',
                    textAlign: 'center',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.4rem', textAlign: 'center' }}>
                  Call the recruiter and ask for the code from their email inbox.
                </p>
              </div>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                {timeLeft > 0 ? (
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Code expires in <span style={{ fontWeight: 600, color: '#3b82f6' }}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <p style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                      Code has expired.
                    </p>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? '#9ca3af' : '#3b82f6',
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                      }}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '0.75rem', background: '#f1f5f9',
                    color: '#475569', border: 'none', borderRadius: '8px',
                    fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6 || timeLeft <= 0}
                  style={{
                    flex: 2, padding: '0.75rem',
                    background: loading || otp.length < 6 || timeLeft <= 0 ? '#d1d5db' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    color: 'white', border: 'none', borderRadius: '8px',
                    fontWeight: 600, cursor: loading || otp.length < 6 || timeLeft <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Activate Account'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔑</div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Recruiter Credentials</h2>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Email verified! Now generate and set the password.
              </p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                {success}
              </div>
            )}

            {/* Generated Password Box */}
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
            <div style={{ display: 'grid', gap: '0.5rem', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', background: '#fff' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: '#1e293b' }}>Customize Password (Optional)</h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#64748b' }}>
                You can change the password below if you wish to override the automatically generated one.
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={e => { setCustomPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Enter new password"
                    style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    tabIndex={-1}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                      display: 'flex', alignItems: 'center', color: '#94a3b8'
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Confirm new password"
                    style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    tabIndex={-1}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                      display: 'flex', alignItems: 'center', color: '#94a3b8'
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '8px 0 0' }}>⚠️ {passwordError}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '0.75rem', background: '#f1f5f9',
                  color: '#475569', border: 'none', borderRadius: '8px',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSavePasswordAndInvite}
                disabled={loading || !customPassword || !confirmPassword}
                style={{
                  flex: 2, padding: '0.75rem',
                  background: loading || !customPassword || !confirmPassword ? '#d1d5db' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontWeight: 600, cursor: loading || !customPassword || !confirmPassword ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : 'Save & Send Credentials'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Send Credentials Modal ───────────────────────────────────────────────────
function SendCredentialsModal({
  recruiter,
  onClose,
}: {
  recruiter: { email: string; name: string; _plainPassword?: string };
  onClose: () => void;
}) {
  const [password, setPassword] = useState(recruiter._plainPassword || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const mailtoUrl = `mailto:${recruiter.email}?subject=${encodeURIComponent('Your Talentmesh Login Credentials')}&body=${encodeURIComponent(
    `Hi ${recruiter.name || 'Recruiter'},\n\nYour recruiter account is ready!\n\nEmail: ${recruiter.email}\nPassword: ${password}\n\nLogin at: ${window.location.origin}/login\n\nPlease change your password after first login for security.\n\nBest regards,\nTalentmesh Admin`
  )}`;

  const handleSend = async () => {
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await invokeFunction('admin-recruiters', {
        method: 'POST',
        body: { action: 'send-credentials', email: recruiter.email, name: recruiter.name, password },
      });
      if (err) throw new Error(err.message);
      setSent(true);
      // Also open mailto as fallback
      if (data?.mailtoUrl) {
        window.open(data.mailtoUrl, '_blank');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send. Use the mailto button below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '16px', padding: '2rem',
          width: '100%', maxWidth: '460px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Send Login Credentials</h2>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            Send the recruiter their login details via email.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}
          {sent && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              ✅ Credentials email sent successfully!
            </div>
          )}

          {/* Preview card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Preview</p>
            <div style={{ fontSize: '0.875rem', color: '#374151', display: 'grid', gap: '0.4rem' }}>
              <div><strong>To:</strong> {recruiter.email}</div>
              <div><strong>Name:</strong> {recruiter.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>Password:</strong>
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    flex: 1, padding: '0.35rem 0.6rem',
                    border: '1px solid #d1d5db', borderRadius: '6px',
                    fontSize: '0.875rem', fontFamily: 'monospace'
                  }}
                  placeholder="Enter the password you set"
                />
              </div>
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: '#92400e' }}>
            💡 The email will include the login URL, email address, and password. The recruiter should change their password after first login.
          </div>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <button
              onClick={handleSend}
              disabled={loading || !password}
              style={{
                width: '100%', padding: '0.875rem',
                background: loading || !password ? '#d1d5db' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontWeight: 600, cursor: loading || !password ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem'
              }}
            >
              {loading ? 'Sending...' : sent ? '✅ Sent! Send Again?' : '📧 Send Credentials Email'}
            </button>

            {/* Mailto fallback - always visible */}
            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', width: '100%', padding: '0.75rem',
                background: '#f1f5f9', color: '#475569',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                fontWeight: 600, textAlign: 'center',
                textDecoration: 'none', fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            >
              📬 Open in My Email Client (Fallback)
            </a>

            <button
              onClick={onClose}
              style={{
                padding: '0.6rem', background: 'transparent',
                color: '#9ca3af', border: 'none',
                fontSize: '0.875rem', cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Approve & Setup Recruiter Modal ──────────────────────────────────────────
function ApproveSetupModal({
  recruiter,
  onClose,
  onSuccess,
}: {
  recruiter: AdminRecruiter;
  onClose: () => void;
  onSuccess: (newUser: { email: string; name: string; _plainPassword?: string }) => void;
}) {
  const profile = recruiter.recruiter_profiles && (Array.isArray(recruiter.recruiter_profiles) ? recruiter.recruiter_profiles[0] : recruiter.recruiter_profiles);

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [formData, setFormData] = useState({
    name: recruiter.name || '',
    email: recruiter.email || '',
    phone: recruiter.phone || '',
    job_title: profile?.job_title || '',
    company_name: profile?.companies?.name || profile?.company_name || '',
    company_website: profile?.companies?.website || profile?.website_url || '',
    industry: profile?.companies?.industry || profile?.industry || '',
    company_size: profile?.company_size || '',
    company_address: profile?.companies?.location || profile?.company_address || '',
    pan_number: profile?.pan_number || '',
    aadhaar_number: profile?.aadhaar_number || '',
    emergency_contact_name: profile?.emergency_contact_name || '',
    emergency_contact_phone: profile?.emergency_contact_phone || '',
    emergency_contact_address: profile?.emergency_contact_address || '',
    gstin: profile?.companies?.gstin || '',
    tan: profile?.companies?.tan || '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Expiration timer for verification OTP code
  useEffect(() => {
    if (!otpSentAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
      const remaining = Math.max(0, 120 - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSentAt]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword();
    setFormData(prev => ({ ...prev, password: pwd }));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      await insforge.auth.resendVerificationEmail({ email: formData.email });
      setOtpSentAt(Date.now());
      setTimeLeft(120);
      setResendCooldown(60);
      setSuccess('Verification code resent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft <= 0) {
      setError('Verification code has expired. Please request a new one.');
      return;
    }
    if (otp.length < 6) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data, error: err } = await invokeFunction('admin-recruiters', {
        method: 'POST',
        body: { action: 'verify-otp', email: formData.email, otp },
      });
      if (err) throw new Error(err.message);

      setSuccess('✅ Email verified! Recruiter account is now active.');
      setTimeout(() => {
        onSuccess({
          email: formData.email,
          name: formData.name,
          _plainPassword: formData.password || undefined
        });
        onClose();
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Verification failed. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validations
    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number.toUpperCase())) {
      setError('Please enter a valid 10-character PAN Card Number.');
      setLoading(false);
      return;
    }

    if (formData.aadhaar_number && !/^[2-9]{1}[0-9]{11}$/.test(formData.aadhaar_number)) {
      setError('Please enter a valid 12-digit Aadhaar Card Number.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: apiErr } = await invokeFunction('admin-recruiters', {
        method: 'POST',
        body: {
          action: 'approve-setup',
          userId: recruiter.id,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          password: formData.password || undefined,
          job_title: formData.job_title,
          company_name: formData.company_name,
          company_website: formData.company_website,
          industry: formData.industry,
          company_size: formData.company_size,
          company_address: formData.company_address,
          pan_number: formData.pan_number.toUpperCase(),
          aadhaar_number: formData.aadhaar_number,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_address: formData.emergency_contact_address,
          gstin: formData.gstin.toUpperCase(),
          tan: formData.tan.toUpperCase()
        }
      });

      if (apiErr) throw new Error(apiErr.message);

      // Check if we need OTP verification (if a password is generated/set, or if user is unverified/pending)
      const isPending = profile?.status === 'pending_verification';
      const needsOtp = !!formData.password || isPending;

      if (needsOtp) {
        if (isPending && !formData.password) {
          try {
            await insforge.auth.resendVerificationEmail({ email: formData.email });
          } catch (resendErr) {
            console.warn('Failed to resend verification email on step transition:', resendErr);
          }
        }
        setSuccess('✅ Setup details saved. A verification code has been sent.');
        setOtpSentAt(Date.now());
        setTimeLeft(120);
        setResendCooldown(60);
        setStep(2);
      } else {
        setSuccess('✅ Recruiter approved & set up successfully!');
        setTimeout(() => {
          onSuccess({
            email: formData.email,
            name: formData.name,
            _plainPassword: formData.password || undefined
          });
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve and setup recruiter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '24px', padding: '2.5rem',
          width: '100%', maxWidth: '680px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
          maxHeight: '90vh', overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            {step === 1 ? 'Approve & Setup Recruiter' : 'Verify Recruiter Email'}
          </h2>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {step === 1
              ? 'Verify registered details, adjust fields if necessary, and approve platform access.'
              : `Enter the 6-digit verification code sent to ${formData.email}`}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '12px', fontSize: '0.875rem', border: '1px solid #fee2e2', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '12px', fontSize: '0.875rem', border: '1px solid #d1fae5', marginBottom: '1.5rem' }}>
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>

            {/* Section 1: Contact Details */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Contact Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Work Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Role / Job Title</label>
                  <input type="text" name="job_title" value={formData.job_title} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Section 2: Company Details */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Company & Tax Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Company Name</label>
                  <input type="text" name="company_name" required value={formData.company_name} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Company Website</label>
                  <input type="url" name="company_website" value={formData.company_website} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Industry</label>
                  <input type="text" name="industry" value={formData.industry} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Company Size</label>
                  <input type="text" name="company_size" value={formData.company_size} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>GSTIN (Optional)</label>
                  <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="e.g. 22AAAAA1111A1Z1" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>TAN (Optional)</label>
                  <input type="text" name="tan" value={formData.tan} onChange={handleChange} placeholder="e.g. ABCD12345E" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Company Registered Address</label>
                  <textarea name="company_address" required value={formData.company_address} onChange={handleChange} placeholder="Full physical office address" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', minHeight: '60px', fontFamily: 'inherit', resize: 'none' }} />
                </div>
              </div>
            </div>

            {/* Section 3: Personal KYC & Verification */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Personal KYC & Emergency Contact</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>PAN Card Number</label>
                  <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} maxLength={10} placeholder="ABCDE1234F" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Aadhaar Card Number</label>
                  <input type="text" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} maxLength={12} placeholder="12-digit Aadhaar Number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Emergency Contact Name</label>
                  <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Emergency Contact Phone</label>
                  <input type="text" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Emergency Contact Address</label>
                  <input type="text" name="emergency_contact_address" value={formData.emergency_contact_address} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Section 4: Password Setup */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Password Setup</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: '#64748b' }}>
                Leave blank to keep the password they registered with. If you wish to set a new password, type it or click generate.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New password (blank = keep original)"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '0.875rem', background: '#f1f5f9',
                  color: '#475569', border: 'none', borderRadius: '12px',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2, padding: '0.875rem',
                  background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Approving & Setting Up...' : 'Approve & Setup Recruiter'}
              </button>
            </div>

          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                Ask the recruiter for the 6-digit confirmation code sent to their registered inbox.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                6-Digit Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: '2rem',
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#0f172a'
                }}
                autoFocus
              />
            </div>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              {timeLeft > 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Code expires in <span style={{ fontWeight: 600, color: '#3b82f6' }}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <p style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                    Code has expired.
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? '#9ca3af' : '#3b82f6',
                      cursor: resendCooldown > 0 || loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                    }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setSuccess('');
                  setOtp('');
                }}
                disabled={loading}
                style={{
                  flex: 1, padding: '0.875rem', background: '#f1f5f9',
                  color: '#475569', border: 'none', borderRadius: '12px',
                  fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Back to Details
              </button>
              <button
                type="submit"
                disabled={loading || otp.length < 6 || timeLeft <= 0}
                style={{
                  flex: 2, padding: '0.875rem',
                  background: loading || otp.length < 6 || timeLeft <= 0 ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontWeight: 700, cursor: loading || otp.length < 6 || timeLeft <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Activate'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AdminRecruitersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL Synced State Parameters
  const urlSearch = searchParams.get('search') || '';
  const urlStatus = searchParams.get('status') || 'all';
  const urlPage = parseInt(searchParams.get('page') || '0');
  const urlSort = searchParams.get('sort') || 'newest';

  const [recruiters, setRecruiters] = useState<AdminRecruiter[]>([]);
  const [searchVal, setSearchVal] = useState(urlSearch);
  const [activeSearch, setActiveSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [sort, setSort] = useState(urlSort);
  const [page, setPage] = useState(urlPage);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [previewUser, setPreviewUser] = useState<AdminRecruiter | null>(null);
  const [showCompanyRegister, setShowCompanyRegister] = useState(false);
  const [showRecruiterRegister, setShowRecruiterRegister] = useState(false);

  // OTP + credentials state
  const [verifyTarget, setVerifyTarget] = useState<AdminRecruiter | null>(null);
  const [credentialsTarget, setCredentialsTarget] = useState<{ email: string; name: string; _plainPassword?: string } | null>(null);

  // Approve & Setup Modal state
  const [approveSetupTarget, setApproveSetupTarget] = useState<AdminRecruiter | null>(null);

  // Custom Proposal State
  const [proposalFeatures, setProposalFeatures] = useState<string[]>([]);
  const [proposalPrice, setProposalPrice] = useState('');
  const [sendingProposal, setSendingProposal] = useState(false);

  // Background Export Queue State
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  // Bulk Action Confirmation Dialog State
  const [bulkActionTarget, setBulkActionTarget] = useState<{ action: string; impact: string } | null>(null);

  // Bulk Undo State
  const [pendingAction, setPendingAction] = useState<{
    action: string;
    ids: string[];
    backup: AdminRecruiter[];
    timeLeft: number;
  } | null>(null);
  
  const pendingActionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingActionRef = useRef<typeof pendingAction>(null);

  // Permissions Guards
  const hasEditPerm = user?.role ? canPerform(user.role as Role, 'recruiters', 'edit') : false;
  const hasDeletePerm = user?.role ? canPerform(user.role as Role, 'recruiters', 'delete') : false;
  const hasApprovePerm = user?.role ? canPerform(user.role as Role, 'recruiters', 'approve') : false;
  const hasExportPerm = user?.role ? canPerform(user.role as Role, 'recruiters', 'export') : false;

  // page-scoped Selection hook reset dependency array
  const filterDeps = useMemo(() => [activeSearch, statusFilter, sort], [activeSearch, statusFilter, sort]);
  const {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected
  } = useSelection(filterDeps);

  // Request Deduplication and Abort references
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchParamsRef = useRef<string>('');
  const internalNavRef = useRef(false);

  const toggleFeature = (f: string) => setProposalFeatures(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  const sendCustomProposal = async (targetUser: AdminRecruiter) => {
    setSendingProposal(true);
    try {
      const res = await fetch('/api/admin/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterId: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          company: getProfile(targetUser)?.company_name || 'Your Company',
          features: proposalFeatures,
          price: proposalPrice
        })
      });
      if (!res.ok) throw new Error(await res.text());
      alert('Proposal sent successfully!');
      setProposalFeatures([]);
      setProposalPrice('');
    } catch (err: any) {
      alert('Failed to send proposal: ' + err.message);
    } finally {
      setSendingProposal(false);
    }
  };

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
      try {
        const buffer = await blob.slice(0, 4).arrayBuffer();
        const arr = new Uint8Array(buffer);
        if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
          mimeType = 'application/pdf';
        } else if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
          mimeType = 'image/png';
        } else if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
          mimeType = 'image/jpeg';
        } else if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
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
          mimeType = 'application/pdf';
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

  const fetchRecruiters = useCallback(async (p = page, q = activeSearch, s = statusFilter, o = sort, force = false) => {
    const fetchKey = `${p}-${q}-${s}-${o}`;
    if (!force && lastFetchParamsRef.current === fetchKey) {
      return;
    }
    lastFetchParamsRef.current = fetchKey;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      recordMetric('abort', 1);
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError('');
    recordMetric('request', 1);

    const trace = startTrace('admin-recruiters', user?.role);
    try {
      const { data, error: fetchError } = await invokeFunction('admin-recruiters', {
        method: 'GET',
        queries: {
          search: q || undefined,
          status: s !== 'all' ? s : undefined,
          page: p.toString(),
          limit: '25',
          sort: o
        },
        signal: controller.signal
      });

      if (fetchError) throw new Error(fetchError.message);

      if (data) {
        setRecruiters(data.items || data.recruiters || []);
        setTotalCount(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / 25));
        endTrace(trace, 'success');
        recordMetric('search', performance.now() - trace.startTime);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Failed to load recruiters');
        endTrace(trace, 'error', err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [page, activeSearch, statusFilter, sort, user?.role]);

  // Synchronize component states when URL parameters change (back/forward history or mount)
  useEffect(() => {
    if (internalNavRef.current) {
      internalNavRef.current = false;
      return;
    }
    const q = searchParams.get('search') || '';
    const p = parseInt(searchParams.get('page') || '0');
    const s = searchParams.get('status') || 'all';
    const o = searchParams.get('sort') || 'newest';

    setPage(p);
    setActiveSearch(q);
    setSearchVal(q);
    setStatusFilter(s);
    setSort(o);

    if (user) {
      fetchRecruiters(p, q, s, o);
    }
  }, [searchParams, fetchRecruiters, user]);

  // Keep ref in sync
  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  // Listen to background refresh events from layout (surviving navigation)
  useEffect(() => {
    const handleRefresh = () => {
      fetchRecruiters(page, activeSearch, statusFilter, sort, true);
    };
    window.addEventListener('admin-recruiters:refresh', handleRefresh);
    return () => {
      window.removeEventListener('admin-recruiters:refresh', handleRefresh);
    };
  }, [fetchRecruiters, page, activeSearch, statusFilter, sort]);

  const commitPendingAction = useCallback(async (action: string, ids: string[], backup: AdminRecruiter[]) => {
    window.sessionStorage.removeItem('tm_pending_action_recruiters');
    try {
      await mutationQueue.enqueue(
        async (idemKey) => {
          let error = null;
          if (action === 'approve') {
            const { error: patchError } = await invokeFunction('admin-recruiters', {
              method: 'POST',
              body: { action: 'bulk-status', ids, status: 'active' },
              idempotencyKey: idemKey
            });
            error = patchError;
          } else if (action === 'activate' || action === 'deactivate') {
            const { error: patchError } = await invokeFunction('admin-recruiters', {
              method: 'POST',
              body: { action: 'bulk-active', ids, is_active: action === 'activate' },
              idempotencyKey: idemKey
            });
            error = patchError;
          }

          if (error) throw new Error(error.message);
          
          recordMetric('bulk_action', ids.length);
          fetchRecruiters(page, activeSearch, statusFilter, sort, true);
        },
        () => {
          setRecruiters(backup);
          alert('Bulk operation failed, rolled back changes.');
        },
        { key: `bulk_recruiters_${action}_${Date.now()}` }
      );
    } catch (err: any) {
      setError(err.message || 'Bulk operation execution failed.');
    }
  }, [page, activeSearch, statusFilter, sort, fetchRecruiters]);

  // Load initial pending action from sessionStorage on mount
  useEffect(() => {
    const stored = window.sessionStorage.getItem('tm_pending_action_recruiters');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const timeLeft = Math.ceil((parsed.expiresAt - Date.now()) / 1000);
        if (timeLeft <= 0) {
          commitPendingAction(parsed.action, parsed.ids, parsed.backup);
          window.sessionStorage.removeItem('tm_pending_action_recruiters');
        } else {
          setPendingAction({
            action: parsed.action,
            ids: parsed.ids,
            backup: parsed.backup,
            timeLeft
          });
        }
      } catch (e) {
        window.sessionStorage.removeItem('tm_pending_action_recruiters');
      }
    }
  }, [commitPendingAction]);

  // Countdown timer logic
  useEffect(() => {
    if (!pendingAction) return;

    pendingActionTimerRef.current = setInterval(() => {
      setPendingAction(prev => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          commitPendingAction(prev.action, prev.ids, prev.backup);
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (pendingActionTimerRef.current) {
        clearInterval(pendingActionTimerRef.current);
      }
    };
  }, [pendingAction, commitPendingAction]);

  const handleUndoPending = () => {
    if (pendingActionTimerRef.current) {
      clearInterval(pendingActionTimerRef.current);
    }
    if (pendingAction) {
      setRecruiters(pendingAction.backup);
    }
    setPendingAction(null);
    window.sessionStorage.removeItem('tm_pending_action_recruiters');
  };

  const updateUrl = (p: number, q: string, s: string, o: string) => {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (p > 0) params.set('page', p.toString());
    if (s && s !== 'all') params.set('status', s);
    if (o && o !== 'newest') params.set('sort', o);
    internalNavRef.current = true;
    const searchString = params.toString();
    const newUrl = `${window.location.pathname}${searchString ? '?' + searchString : ''}`;
    window.history.pushState(null, '', newUrl);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchVal);
    setPage(0);
    updateUrl(0, searchVal, statusFilter, sort);
    fetchRecruiters(0, searchVal, statusFilter, sort, true);
  };

  const handlePageChange = (newPageIdx: number) => {
    setPage(newPageIdx);
    updateUrl(newPageIdx, activeSearch, statusFilter, sort);
    fetchRecruiters(newPageIdx, activeSearch, statusFilter, sort, true);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(0);
    updateUrl(0, activeSearch, statusFilter, newSort);
    fetchRecruiters(0, activeSearch, statusFilter, newSort, true);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(0);
    updateUrl(0, activeSearch, newStatus, sort);
    fetchRecruiters(0, activeSearch, newStatus, sort, true);
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setActiveSearch('');
    setStatusFilter('all');
    setSort('newest');
    setPage(0);
    updateUrl(0, '', 'all', 'newest');
    fetchRecruiters(0, '', 'all', 'newest', true);
  };

  const toggleStatus = async (targetUser: AdminRecruiter) => {
    const backupRecruiters = [...recruiters];
    
    // Optimistic UI update
    setRecruiters(prev => prev.map(r => r.id === targetUser.id ? { ...r, is_active: !targetUser.is_active } : r));
    if (previewUser?.id === targetUser.id) {
      setPreviewUser({ ...previewUser, is_active: !targetUser.is_active });
    }

    try {
      await mutationQueue.enqueue(
        async (idemKey) => {
          const { data, error: updateError } = await invokeFunction('admin-recruiters', {
            method: 'PATCH',
            body: { is_active: !targetUser.is_active },
            queries: { id: targetUser.id },
            idempotencyKey: idemKey
          });

          if (updateError) throw new Error(updateError.message);
          fetchRecruiters(page, activeSearch, statusFilter, sort, true);
        },
        () => {
          setRecruiters(backupRecruiters);
          if (previewUser?.id === targetUser.id) {
            setPreviewUser(targetUser);
          }
          alert('Failed to update recruiter status, rolled back.');
        },
        { key: `toggle_recruiter_${targetUser.id}` }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update recruiter status');
    }
  };

  const approveRecruiter = async (profileId: string) => {
    try {
      await mutationQueue.enqueue(
        async (idemKey) => {
          const { data, error: updateError } = await invokeFunction('admin-recruiters', {
            method: 'PATCH',
            body: { is_approved: true },
            queries: { id: profileId },
            idempotencyKey: idemKey
          });

          if (updateError) throw new Error(updateError.message);
          fetchRecruiters(page, activeSearch, statusFilter, sort, true);
          setPreviewUser(null);
        },
        () => {
          alert('Approval failed.');
        },
        { key: `approve_recruiter_${profileId}` }
      );
    } catch (err: any) {
      setError(err.message || 'Approval failed.');
    }
  };

  const getProfile = (recruiter: AdminRecruiter): RecruiterProfile | null => {
    if (!recruiter.recruiter_profiles) return null;
    if (Array.isArray(recruiter.recruiter_profiles)) {
      return recruiter.recruiter_profiles[0] || null;
    }
    return recruiter.recruiter_profiles;
  };

  const isPendingVerification = (recruiter: AdminRecruiter) => {
    const p = getProfile(recruiter);
    return p?.status === 'pending_verification';
  };

  // Selection telemetry tracker
  useEffect(() => {
    recordMetric('selection', selectedIds.length);
  }, [selectedIds]);

  // Bulk Actions
  const handleBulkClick = (action: string) => {
    let impactText = '';
    if (action === 'approve') impactText = `This will approve the profiles of ${selectedIds.length} recruiter(s).`;
    if (action === 'activate') impactText = `This will activate access for ${selectedIds.length} recruiter(s).`;
    if (action === 'deactivate') impactText = `This will suspend access for ${selectedIds.length} recruiter(s).`;
    if (action === 'delete') impactText = `This will PERMANENTLY delete accounts and companies for ${selectedIds.length} selected recruiter(s). THIS IS IRREVERSIBLE.`;

    setBulkActionTarget({ action, impact: impactText });
  };

  const executeBulkAction = async () => {
    if (!bulkActionTarget) return;
    const { action } = bulkActionTarget;
    setBulkActionTarget(null);

    const backupRecruiters = [...recruiters];
    
    // Optimistic UI updates
    if (action === 'delete') {
      setRecruiters(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setPreviewUser(null);
    } else {
      setRecruiters(prev => prev.map(r => {
        if (selectedIds.includes(r.id)) {
          if (action === 'approve') return { ...r, is_active: true };
          if (action === 'activate') return { ...r, is_active: true };
          if (action === 'deactivate') return { ...r, is_active: false };
        }
        return r;
      }));
    }

    const idsToMutate = [...selectedIds];
    clearSelection();

    if (action === 'delete') {
      try {
        await mutationQueue.enqueue(
          async (idemKey) => {
            const { error } = await invokeFunction('admin-recruiters', {
              method: 'POST',
              body: { action: 'bulk-delete', ids: idsToMutate },
              idempotencyKey: idemKey
            });
            if (error) throw new Error(error.message);

            recordMetric('bulk_action', idsToMutate.length);
            fetchRecruiters(page, activeSearch, statusFilter, sort, true);
          },
          () => {
            setRecruiters(backupRecruiters);
            alert('Bulk delete failed, rolled back list changes.');
          },
          { key: `bulk_recruiters_${action}` }
        );
      } catch (err: any) {
        setError(err.message || 'Bulk operation execution failed.');
      }
    } else {
      // Approve/Activate/Deactivate has a 30s Undo Window
      const expiresAt = Date.now() + 30 * 1000;
      window.sessionStorage.setItem('tm_pending_action_recruiters', JSON.stringify({
        action,
        ids: idsToMutate,
        backup: backupRecruiters,
        expiresAt
      }));
      setPendingAction({
        action,
        ids: idsToMutate,
        backup: backupRecruiters,
        timeLeft: 30
      });
    }
  };

  // Local/Queue CSV Export handler with Worker Locking
  const runExportWorker = useCallback(async (jobId: string, itemsToExport: any[]) => {
    const workerId = `client-worker-${Math.random().toString(36).substring(2, 9)}`;
    window.sessionStorage.setItem('tm_active_export_recruiters_job_id', jobId);
    try {
      // Claiming and locking the job to prevent duplicate worker execution (server-enforced via RPC)
      const { data: isClaimed, error: claimErr } = await insforge.database.rpc('claim_export_job', {
        job_id: jobId,
        worker_id: workerId
      });

      if (claimErr || !isClaimed) {
        console.log('Job already claimed or processed by another worker.');
        return;
      }

      const totalCount = itemsToExport.length;
      let processedCount = 0;
      await insforge.database.from('export_jobs').update({
        total_count: totalCount,
        processed_count: 0,
        progress_percent: 0
      }).eq('id', jobId);

      const headers = ['Name', 'Email', 'Company', 'Industry', 'Size', 'Approved', 'Active', 'Joined Date'];
      const rows: any[] = [];
      const chunkSize = Math.max(1, Math.floor(totalCount / 5)); // 5 progress updates

      for (let i = 0; i < totalCount; i += chunkSize) {
        const chunk = itemsToExport.slice(i, i + chunkSize);
        const chunkRows = chunk.map(r => {
          const p = getProfile(r);
          return [
            r.name || 'Anonymous',
            r.email,
            p?.company_name || 'Individual',
            p?.industry || '',
            p?.company_size || '',
            p?.is_approved ? 'Yes' : 'No',
            r.is_active ? 'Yes' : 'No',
            new Date(r.created_at).toLocaleDateString('en-IN')
          ];
        });
        rows.push(...chunkRows);
        processedCount = Math.min(totalCount, processedCount + chunk.length);
        const progressPercent = Math.round((processedCount / totalCount) * 100);

        setExportProgress(`Exporting ${progressPercent}% (${processedCount}/${totalCount} records)...`);

        await insforge.database.from('export_jobs').update({
          processed_count: processedCount,
          progress_percent: progressPercent
        }).eq('id', jobId);

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const csv = [headers, ...rows].map(r => r.map((cell: any) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const file = new File([new Blob(['\uFEFF' + csv], { type: 'text/csv' })], `export-${jobId}.csv`);

      const { error: uploadErr } = await insforge.storage
        .from('export-candidates')
        .upload(`jobs/${jobId}.csv`, file);

      if (uploadErr) throw uploadErr;

      const downloadUrl = insforge.storage.from('export-candidates').getPublicUrl(`jobs/${jobId}.csv`);

      // Completing and unlocking the job
      await insforge.database.from('export_jobs').update({
        status: 'completed',
        download_url: downloadUrl,
        completed_at: new Date().toISOString(),
        locked_by: null,
        locked_at: null
      }).eq('id', jobId);

      setExportProgress('Export complete! Triggering file download...');
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `recruiters-export-${jobId}.csv`;
      a.click();
    } catch (bgErr: any) {
      // Unlocking and registering error
      await insforge.database.from('export_jobs').update({
        status: 'failed',
        error_message: bgErr.message || 'Background processing failed.',
        completed_at: new Date().toISOString(),
        locked_by: null,
        locked_at: null
      }).eq('id', jobId);
    } finally {
      window.sessionStorage.removeItem('tm_active_export_recruiters_job_id');
      setExportLoading(false);
    }
  }, [user?.id]);

  // Restore background export progress after page reload (Gap D)
  useEffect(() => {
    const activeJobId = window.sessionStorage.getItem('tm_active_export_recruiters_job_id');
    if (!activeJobId || !user) return;

    let isSubscribed = true;

    async function checkAndResumeJob() {
      try {
        setExportLoading(true);
        setExportProgress('Checking status of active export job...');

        const { data: job, error: jobErr } = await insforge.database
          .from('export_jobs')
          .select('*')
          .eq('id', activeJobId)
          .single();

        if (jobErr || !job) {
          window.sessionStorage.removeItem('tm_active_export_recruiters_job_id');
          setExportLoading(false);
          return;
        }

        if (job.status === 'completed') {
          if (job.download_url) {
            setExportProgress('Export complete! Triggering file download...');
            const a = document.createElement('a');
            a.href = job.download_url;
            a.download = `recruiters-export-${activeJobId}.csv`;
            a.click();
          }
          window.sessionStorage.removeItem('tm_active_export_recruiters_job_id');
          setExportLoading(false);
        } else if (job.status === 'failed') {
          alert(`Export job failed: ${job.error_message}`);
          window.sessionStorage.removeItem('tm_active_export_recruiters_job_id');
          setExportLoading(false);
        } else {
          // Status is pending or running. We can resume the worker client-side!
          setExportProgress('Resuming background export process...');
          const { data: items, error: itemsErr } = await insforge.database
            .from('export_job_items')
            .select('entity_id')
            .eq('job_id', activeJobId);

          if (itemsErr || !items || items.length === 0) {
            window.sessionStorage.removeItem('tm_active_export_recruiters_job_id');
            setExportLoading(false);
            return;
          }

          const entityIds = items.map((x: any) => x.entity_id);
          const { data: profiles, error: profsErr } = await insforge.database
            .from('profiles')
            .select('*, recruiter_profiles(*, companies(*))')
            .in('id', entityIds);

          if (profsErr || !profiles || profiles.length === 0) {
            window.sessionStorage.removeItem('tm_active_export_recruiters_job_id');
            setExportLoading(false);
            return;
          }

          if (isSubscribed) {
            runExportWorker(activeJobId!, profiles);
          }
        }
      } catch (e) {
        window.sessionStorage.removeItem('tm_active_export_recruiters_job_id');
        setExportLoading(false);
      }
    }

    checkAndResumeJob();

    return () => {
      isSubscribed = false;
    };
  }, [user, runExportWorker]);

  // Local/Queue CSV Export handler
  const handleExport = async () => {
    const itemsToExport = selectedIds.length > 0
      ? recruiters.filter(r => selectedIds.includes(r.id))
      : recruiters;

    if (itemsToExport.length === 0) {
      alert('No recruiter records available to export.');
      return;
    }

    if (itemsToExport.length < 100) {
      // Local Export
      const headers = ['Name', 'Email', 'Company', 'Industry', 'Size', 'Approved', 'Active', 'Joined Date'];
      const rows = itemsToExport.map(r => {
        const p = getProfile(r);
        return [
          r.name || 'Anonymous',
          r.email,
          p?.company_name || 'Individual',
          p?.industry || '',
          p?.company_size || '',
          p?.is_approved ? 'Yes' : 'No',
          r.is_active ? 'Yes' : 'No',
          new Date(r.created_at).toLocaleDateString('en-IN')
        ];
      });
      const csv = rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recruiters-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Background Queue Export
      setExportLoading(true);
      setExportProgress('Initializing background export job...');
      try {
        const { data: job, error: jobErr } = await insforge.database
          .from('export_jobs')
          .insert([{
            user_id: user?.id,
            status: 'pending',
            type: 'recruiters',
            filters: { search: activeSearch, status: statusFilter, sort }
          }])
          .select('id')
          .single();

        if (jobErr || !job) throw new Error(jobErr?.message || 'Failed to create export queue entry.');
        const jobId = job.id;

        setExportProgress('Logging export items relationships...');
        const rels = itemsToExport.map(item => ({
          job_id: jobId,
          entity_type: 'recruiter',
          entity_id: item.id
        }));

        const { error: relErr } = await insforge.database.from('export_job_items').insert(rels);
        if (relErr) throw relErr;

        setExportProgress('Compiling dataset in background export queue...');
        runExportWorker(jobId, itemsToExport);
      } catch (err: any) {
        alert('Failed to start queue export: ' + err.message);
        setExportLoading(false);
      }
    }
  };

  function RecruiterCardSkeleton() {
    return (
      <article className={`${styles.candidateCard} ${styles.skeletonCard}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.initials} ${styles.skeletonPulse}`} style={{ background: '#f59e0b', opacity: 0.3 }} />
          <div className={styles.mainInfo} style={{ display: 'grid', gap: '6px' }}>
            <div className={`${styles.name} ${styles.skeletonPulse}`} style={{ height: '18px', width: '120px' }} />
            <div className={`${styles.email} ${styles.skeletonPulse}`} style={{ height: '14px', width: '160px' }} />
          </div>
        </div>
        <div className={styles.body} style={{ display: 'grid', gap: '8px' }}>
          <div className={`${styles.headline} ${styles.skeletonPulse}`} style={{ height: '16px', width: '95%' }} />
          <div className={`${styles.meta} ${styles.skeletonPulse}`} style={{ height: '14px', width: '60%', marginTop: '6px' }} />
        </div>
      </article>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Employer Management</p>
          <h1 className={styles.title}>Recruiters</h1>
          <p className={styles.subtitle}>Manage recruiter accounts, companies, and platform access.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ fontSize: '1.5rem', display: 'block' }}>{totalCount}</strong>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Registered Employers</span>
        </div>
      </header>

      {/* Toolbar / Filters Row */}
      <div className={styles.toolbarRow}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', alignItems: 'center' }}>
          <form className={styles.toolbar} style={{ flex: 1 }} onSubmit={handleSearchSubmit}>
            <input
              className={styles.searchInput}
              value={searchVal}
              onChange={(event) => setSearchVal(event.target.value)}
              placeholder="Search by name, company, or email..."
            />
            <button type="submit" className={styles.primaryButton}>Search</button>
          </form>

          {/* Status Filter */}
          <select
            className={styles.searchInput}
            style={{ maxWidth: '180px' }}
            value={statusFilter}
            onChange={e => handleStatusFilterChange(e.target.value)}
          >
            <option value="all">All Recruiters</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="active">Active</option>
          </select>

          {/* Sort Filter */}
          <select
            className={styles.searchInput}
            style={{ maxWidth: '160px' }}
            value={sort}
            onChange={e => handleSortChange(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>

          {hasEditPerm && (
            <>
              <AdminButton onClick={() => setShowRecruiterRegister(true)}>+ Add Recruiter</AdminButton>
              <AdminButton onClick={() => setShowCompanyRegister(true)}>Register Company</AdminButton>
            </>
          )}

          {hasExportPerm && (
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className={styles.exportBtn}
            >
              {exportLoading ? 'Exporting...' : '↓ Export CSV'}
            </button>
          )}
        </div>
      </div>

      {exportLoading && (
        <div id="export-progress-banner" style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '14px', height: '14px', border: '2px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
          <span>{exportProgress}</span>
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.grid}>
        {(authLoading || loading) ? (
          Array.from({ length: 6 }).map((_, i) => <RecruiterCardSkeleton key={i} />)
        ) : recruiters.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No recruiters found</h3>
            <p style={{ margin: '8px 0 16px', color: '#64748b' }}>No recruiter accounts matched your active search criteria.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={handleClearFilters} className={styles.primaryButton} style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#475569' }}>
                Clear Filters
              </button>
              {hasEditPerm && (
                <button onClick={() => setShowRecruiterRegister(true)} className={styles.primaryButton} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Invite Recruiter
                </button>
              )}
            </div>
          </div>
        ) : (
          recruiters.map((recruiter) => {
            const profile = getProfile(recruiter);
            const isPending = isPendingVerification(recruiter);
            const isChecked = isSelected(recruiter.id);
            return (
              <article
                key={recruiter.id}
                className={`${styles.candidateCard} ${isChecked ? styles.cardSelected : ''}`}
                onClick={() => setPreviewUser(recruiter)}
                style={{ position: 'relative', cursor: 'pointer', border: isChecked ? '2px solid #3b82f6' : '1px solid #eef2f6' }}
              >
                {/* Selection Checkbox */}
                <div
                  style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}
                  onClick={e => {
                    e.stopPropagation();
                    toggleSelect(recruiter.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className={styles.checkboxInput}
                  />
                </div>

                <div className={styles.cardHeader} style={{ paddingRight: '24px' }}>
                  <div className={styles.initials} style={{ background: '#f59e0b', color: 'white' }}>
                    {recruiter.name ? recruiter.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className={styles.mainInfo}>
                    <h3 className={styles.name}>{recruiter.name}</h3>
                    <p className={styles.email}>{recruiter.email}</p>
                  </div>
                  {isPending ? (
                    <div className={styles.strengthBadge} style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Pending
                    </div>
                  ) : !profile?.is_approved ? (
                    <div className={styles.strengthBadge} style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                      Unverified
                    </div>
                  ) : null}
                </div>

                <div className={styles.body}>
                  <p className={styles.headline}><strong>{profile?.company_name || 'Individual Recruiter'}</strong></p>
                  <div className={styles.meta}>
                    <span><Globe size={14} /> {profile?.industry || 'Unspecified Industry'}</span>
                    <span><Users size={14} /> {profile?.company_size || 'N/A'} employees</span>
                  </div>
                </div>

                <div className={styles.footer}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`${styles.statusDot} ${recruiter.is_active ? styles.dotActive : ''}`} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                      {recruiter.is_active ? 'Active Account' : 'Suspended'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isPending && hasApprovePerm && (
                      <button
                        className={styles.actionBtn}
                        style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', padding: '2px 8px', borderRadius: '6px', border: '1px solid' }}
                        onClick={e => { e.stopPropagation(); setVerifyTarget(recruiter); }}
                      >
                        ✉️ Verify OTP
                      </button>
                    )}
                    <span className={styles.actionBtn}>Audit →</span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 0} onClick={() => handlePageChange(page - 1)} className={styles.pageButton}>Prev</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`${styles.pageButton} ${page === i ? styles.pageActive : ''}`}
              onClick={() => handlePageChange(i)}
            >
              {i + 1}
            </button>
          ))}
          <button disabled={page === totalPages - 1} onClick={() => handlePageChange(page + 1)} className={styles.pageButton}>Next</button>
        </div>
      )}

      {/* ── Recruiter Detail Drawer ────────────────────────────────────────── */}
      {previewUser && (
        <div className={styles.drawerOverlay} onClick={() => setPreviewUser(null)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h2>Recruiter Profile</h2>
              <button className={styles.drawerClose} onClick={() => setPreviewUser(null)}>×</button>
            </header>

            <div className={styles.drawerContent}>
              {/* Status toggle */}
              <div className={styles.statusToggle} style={{ display: 'grid', gap: '0.75rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                <div>
                  <strong>Account Authorization</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    {previewUser.is_active ? 'Recruiter can post jobs and review talent.' : 'Recruiter dashboard access is disabled.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    disabled={!hasEditPerm}
                    onClick={() => toggleStatus(previewUser)}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      background: previewUser.is_active ? '#fee2e2' : '#dcfce7',
                      color: previewUser.is_active ? '#991b1b' : '#166534',
                      border: '1px solid',
                      borderColor: previewUser.is_active ? '#fca5a5' : '#86efac',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: hasEditPerm ? 'pointer' : 'not-allowed',
                      opacity: hasEditPerm ? 1 : 0.6,
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', width: '100%' }}>
                      {previewUser.is_active ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                      {previewUser.is_active ? 'Deactivate' : 'Activate'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!hasDeletePerm}
                    onClick={async () => {
                      if (window.confirm(`Are you absolutely sure you want to PERMANENTLY delete recruiter ${previewUser.name}?\n\nThis will delete their auth account and database records.`)) {
                        try {
                          const { error: delError } = await invokeFunction('admin-recruiters', {
                            method: 'DELETE',
                            queries: { id: previewUser.id }
                          });
                          if (delError) throw new Error(delError.message);
                          alert('Recruiter deleted successfully');
                          setPreviewUser(null);
                          fetchRecruiters(page, activeSearch, statusFilter, sort, true);
                        } catch (err: any) {
                          alert('Failed to delete recruiter: ' + err.message);
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: hasDeletePerm ? 'pointer' : 'not-allowed',
                      opacity: hasDeletePerm ? 1 : 0.6,
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', width: '100%' }}>
                      <Trash2 size={15} /> Permanent Delete
                    </span>
                  </button>
                </div>
              </div>

              {/* Pending verification banner */}
              {isPendingVerification(previewUser) && (
                <div style={{
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: '12px', padding: '1.25rem', marginBottom: '0.5rem'
                }}>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} /> Email Not Yet Verified
                  </p>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#78350f' }}>
                    This recruiter has not verified their email yet. Call them, get the OTP code from their inbox, and verify on their behalf.
                  </p>
                  {hasApprovePerm && (
                    <button
                      onClick={() => setVerifyTarget(previewUser)}
                      style={{
                        width: '100%', padding: '0.75rem',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <Smartphone size={16} /> Enter OTP Code (Verify on Behalf)
                    </button>
                  )}
                </div>
              )}

              {/* Send Credentials */}
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: '12px', padding: '1rem', marginBottom: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#166534' }}>📧 Send Login Info</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#15803d' }}>Email the recruiter their credentials</p>
                </div>
                <button
                  disabled={!hasEditPerm}
                  onClick={() => setCredentialsTarget({ email: previewUser.email, name: previewUser.name })}
                  style={{
                    padding: '0.5rem 1rem', background: '#16a34a',
                    color: 'white', border: 'none', borderRadius: '8px',
                    fontWeight: 600, cursor: hasEditPerm ? 'pointer' : 'not-allowed', opacity: hasEditPerm ? 1 : 0.6, fontSize: '0.8rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Send Now
                </button>
              </div>

              <section className={styles.profileSection}>
                <h4>Company Info</h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className={styles.initials} style={{ width: '64px', height: '64px', fontSize: '1.5rem', background: '#f59e0b', color: 'white' }}>
                    {getProfile(previewUser)?.company_name?.[0] || 'C'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{getProfile(previewUser)?.company_name || 'N/A'}</h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>{getProfile(previewUser)?.industry} · {getProfile(previewUser)?.company_size} Employees</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.875rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <div><strong>Registered Office Address:</strong></div>
                  <div style={{ color: '#475569', lineHeight: 1.5 }}>
                    {getProfile(previewUser)?.companies?.location || getProfile(previewUser)?.company_address || 'Not Provided'}
                  </div>
                </div>
              </section>

              <section className={styles.profileSection}>
                <h4>About Company</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#334155' }}>
                  {getProfile(previewUser)?.about || 'No company description provided.'}
                </p>
              </section>

              <section className={styles.profileSection}>
                <h4>Contact Details</h4>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div><strong>Name:</strong> {previewUser.name}</div>
                  <div><strong>Email:</strong> {previewUser.email}</div>
                  <div><strong>Phone:</strong> {previewUser.phone || 'N/A'}</div>
                  <div><strong>Role:</strong> {getProfile(previewUser)?.job_title || 'N/A'}</div>
                  <div><strong>Joined:</strong> {new Date(previewUser.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div>
                    <strong>Account Status:</strong>{' '}
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                      background: isPendingVerification(previewUser) ? '#fef3c7' : previewUser.is_active ? '#dcfce7' : '#fee2e2',
                      color: isPendingVerification(previewUser) ? '#92400e' : previewUser.is_active ? '#166534' : '#991b1b',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      {isPendingVerification(previewUser) ? (
                        <>
                          <Clock size={12} /> Pending Verification
                        </>
                      ) : previewUser.is_active ? (
                        <>
                          <CheckCircle2 size={12} /> Active
                        </>
                      ) : (
                        <>
                          <XCircle size={12} /> Suspended
                        </>
                      )}
                    </span>
                  </div>
                  {getProfile(previewUser)?.website_url && (
                    <div><strong>Website:</strong> <a href={getProfile(previewUser)?.website_url} target="_blank" style={{ color: '#3b82f6' }}>{getProfile(previewUser)?.website_url}</a></div>
                  )}
                </div>
                {getProfile(previewUser)?.document_url && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Company Verification Document:</strong><br />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleView(getProfile(previewUser)!.document_url!)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <FileText size={15} /> View Document
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(getProfile(previewUser)!.document_url!, 'company_document.pdf')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <Download size={15} /> Download
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* KYC Details Section */}
              <section className={styles.profileSection} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Personal KYC Verification</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>PAN Card Number</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.95rem' }}>{getProfile(previewUser)?.pan_number || '—'}</div>
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Aadhaar Card Number</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.95rem' }}>{getProfile(previewUser)?.aadhaar_number ? getProfile(previewUser)!.aadhaar_number!.replace(/(\d{4})/g, '$1 ').trim() : '—'}</div>
                  </div>
                </div>
                {getProfile(previewUser)?.kyc_document_url && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>KYC Document (Aadhaar/PAN Copy):</strong><br />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleView(getProfile(previewUser)!.kyc_document_url!)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <FileText size={15} /> View KYC
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(getProfile(previewUser)!.kyc_document_url!, 'kyc_document.pdf')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <Download size={15} /> Download
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Emergency Contact Section */}
              <section className={styles.profileSection} style={{ background: '#fef3c7', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#78350f', borderBottom: '1px solid #fde68a', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={18} /> Emergency Contact</h4>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', color: '#451a03' }}>
                  <div><strong>Name:</strong> {getProfile(previewUser)?.emergency_contact_name || '—'}</div>
                  <div><strong>Phone:</strong> {getProfile(previewUser)?.emergency_contact_phone || '—'}</div>
                  <div><strong>Address:</strong> {getProfile(previewUser)?.emergency_contact_address || '—'}</div>
                </div>
              </section>

              {/* Company Tax Details */}
              {(getProfile(previewUser)?.companies?.gstin || getProfile(previewUser)?.companies?.tan) && (
                <section className={styles.profileSection} style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#166534', borderBottom: '1px solid #bbf7d0', paddingBottom: '0.5rem' }}>Company Tax Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>GSTIN</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{getProfile(previewUser)?.companies?.gstin || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>TAN</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{getProfile(previewUser)?.companies?.tan || '—'}</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Approve & Setup Button — shown when recruiter is NOT yet approved */}
              {!getProfile(previewUser)?.is_approved && hasApprovePerm && (
                <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #ede9fe, #fce7f3)', border: '1px solid #c4b5fd', borderRadius: '16px' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#4c1d95' }}>
                    Verify Recruiter Account
                  </p>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#6d28d9', lineHeight: 1.5 }}>
                    Review the details above. Click below to verify this recruiter, set a password, and send login credentials.
                  </p>
                  <button
                    onClick={() => setApproveSetupTarget(previewUser)}
                    style={{
                      width: '100%', padding: '0.875rem',
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      color: 'white', border: 'none', borderRadius: '12px',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
                      boxShadow: '0 4px 15px rgba(109, 40, 217, 0.3)'
                    }}
                  >
                    Verify Recruiter
                  </button>
                </div>
              )}

              {hasEditPerm && (
                <section className={styles.profileSection} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4>Send Custom Price Plan</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>Send a custom pricing plan to this recruiter.</p>

                  <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {['Unlimited Talent Search', 'Dedicated Account Manager', 'AI Candidate Matching', 'Featured Job Posts', 'API Integration'].map(f => (
                      <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={proposalFeatures.includes(f)} onChange={() => toggleFeature(f)} />
                        {f}
                      </label>
                    ))}
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>Custom Price (INR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={proposalPrice}
                      onChange={e => setProposalPrice(e.target.value)}
                      className={styles.searchInput}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <button
                    className={styles.primaryButton}
                    style={{ width: '100%' }}
                    disabled={sendingProposal || !proposalPrice}
                    onClick={() => sendCustomProposal(previewUser)}
                  >
                    {sendingProposal ? 'Sending...' : 'Generate & Email Proposal'}
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Company Register Drawer ──────────────────────────────────────── */}
      {showCompanyRegister && (
        <div className={styles.drawerOverlay} onClick={() => setShowCompanyRegister(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h2>Add New Company</h2>
              <button className={styles.drawerClose} onClick={() => setShowCompanyRegister(false)}>×</button>
            </header>
            <div className={styles.drawerContent} style={{ padding: '2rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>
                Create a new company profile first. You can then associate recruiters with this company.
              </p>
              <CompanyRegisterForm
                onSuccess={() => setShowCompanyRegister(false)}
                onCancel={() => setShowCompanyRegister(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Add Recruiter Drawer ─────────────────────────────────────────── */}
      {showRecruiterRegister && (
        <div className={styles.drawerOverlay} onClick={() => setShowRecruiterRegister(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <h2>Add Recruiter Account</h2>
              <button className={styles.drawerClose} onClick={() => setShowRecruiterRegister(false)}>×</button>
            </header>
            <div className={styles.drawerContent} style={{ padding: '2rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>
                Create a new recruiter account. You set the password. A verification code is emailed to the recruiter — call them, get the code, and verify on their behalf.
              </p>
              <RecruiterRegisterForm
                onSuccess={(newUser) => {
                  setShowRecruiterRegister(false);
                  fetchRecruiters(0);
                  // Offer to send credentials email right away
                  if (newUser?.email) {
                    setCredentialsTarget({
                      email: newUser.email,
                      name: newUser.name || '',
                      _plainPassword: newUser._plainPassword,
                    });
                  }
                }}
                onCancel={() => setShowRecruiterRegister(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Selection Bar */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selectedIds.length} recruiters selected</span>
          <div className={styles.bulkActions}>
            {hasApprovePerm && (
              <button className={styles.bulkBtn} onClick={() => handleBulkClick('approve')}>Approve</button>
            )}
            {hasEditPerm && (
              <>
                <button className={styles.bulkBtn} onClick={() => handleBulkClick('activate')}>Activate</button>
                <button className={styles.bulkBtn} onClick={() => handleBulkClick('deactivate')}>Deactivate</button>
              </>
            )}
            {hasDeletePerm && (
              <button className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`} onClick={() => handleBulkClick('delete')}>Delete</button>
            )}
            {hasExportPerm && (
              <button className={styles.bulkBtn} onClick={handleExport}>Export</button>
            )}
            <button className={styles.bulkBtn} style={{ background: '#475569' }} onClick={clearSelection}>Clear</button>
          </div>
        </div>
      )}

      {/* Reusable Bulk Action Confirmation Modal */}
      <BulkConfirmModal
        isOpen={!!bulkActionTarget}
        onClose={() => setBulkActionTarget(null)}
        onConfirm={executeBulkAction}
        selectedCount={selectedIds.length}
        actionName={bulkActionTarget?.action || ''}
        impactText={bulkActionTarget?.impact || ''}
      />

      {/* ── OTP Verification Modal ───────────────────────────────────────── */}
      {verifyTarget && (
        <VerifyOtpModal
          recruiter={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onSuccess={() => { fetchRecruiters(); setPreviewUser(null); }}
        />
      )}

      {/* ── Send Credentials Modal ───────────────────────────────────────── */}
      {credentialsTarget && (
        <SendCredentialsModal
          recruiter={credentialsTarget}
          onClose={() => setCredentialsTarget(null)}
        />
      )}

      {/* ── Approve & Setup Recruiter Modal ───────────────────────────────── */}
      {approveSetupTarget && (
        <ApproveSetupModal
          recruiter={approveSetupTarget}
          onClose={() => setApproveSetupTarget(null)}
          onSuccess={(newUser) => {
            setApproveSetupTarget(null);
            setPreviewUser(null);
            fetchRecruiters(0);
            // Offer to send credentials email right away
            if (newUser?.email) {
              setCredentialsTarget({
                email: newUser.email,
                name: newUser.name || '',
                _plainPassword: newUser._plainPassword,
              });
            }
          }}
        />
      )}

      {/* Floating Bulk Action Undo Banner */}
      {pendingAction && (
        <div className={styles.undoBanner}>
          <div className={styles.undoContent}>
            <span className={styles.undoIcon}>⏳</span>
            <span>
              Bulk <strong>{pendingAction.action}</strong> pending... {pendingAction.timeLeft}s remaining
            </span>
          </div>
          <button onClick={handleUndoPending} className={styles.undoButton}>
            Undo
          </button>
        </div>
      )}
    </section>
  );
}
