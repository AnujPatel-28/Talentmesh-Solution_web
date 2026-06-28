"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { insforge, invokeFunction } from '@/lib/insforge';
import Link from 'next/link';

export default function VerifyRecruiterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    if (resendCooldown > 0 || !email) return;
    setLoading(true);
    setError('');
    try {
      await insforge.auth.resendVerificationEmail({ email });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft <= 0) {
      setError('Verification code has expired. Please click "Resend Code" to get a new one.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Verify OTP — this activates the account; password is already set by admin
      const { data, error: verifyError } = await insforge.auth.verifyEmail({
        email,
        otp
      });

      if (verifyError) throw verifyError;
      if (!data?.user) throw new Error('Failed to verify code. Please check the code and try again.');

      // 2. Mark recruiter_profile as active
      const { error: activateError } = await invokeFunction('activate-recruiter', {
        method: 'POST',
        body: { userId: data.user.id }
      });

      if (activateError) throw new Error(activateError.message || 'Failed to activate recruiter profile');

      setSuccess('Account verified successfully! Redirecting to login...');

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 100%)',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        padding: '2.5rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem'
          }}>
            ✉️
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            Verify Your Account
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Enter the 6-digit verification code sent to your email.
            Your password has already been set by your administrator.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          {error && (
            <div style={{
              padding: '0.875rem',
              background: '#fef2f2',
              color: '#991b1b',
              borderRadius: '8px',
              fontSize: '0.875rem',
              border: '1px solid #fee2e2',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.875rem',
              background: '#ecfdf5',
              color: '#065f46',
              borderRadius: '8px',
              fontSize: '0.875rem',
              border: '1px solid #d1fae5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151'
            }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151'
            }}>
              6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1.5rem',
                letterSpacing: '0.5em',
                textAlign: 'center',
                outline: 'none',
                fontWeight: 700,
                color: '#1e293b',
                boxSizing: 'border-box'
              }}
              placeholder="••••••"
              maxLength={6}
            />
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.4rem', textAlign: 'center' }}>
              Check your email inbox (and spam folder) for the code.
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
                  disabled={resendCooldown > 0 || !email}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 || !email ? '#9ca3af' : '#3b82f6',
                    cursor: resendCooldown > 0 || !email ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: resendCooldown > 0 || !email ? 'none' : 'underline',
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            )}
          </div>

          {/* Info box */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.8rem',
            color: '#0369a1',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start'
          }}>
            <span>💡</span>
            <span>
              After verification, you can log in using the email and password your administrator provided.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !email || otp.length < 6 || timeLeft <= 0}
            style={{
              width: '100%',
              padding: '0.8rem 1.5rem',
              background: loading || !email || otp.length < 6 || timeLeft <= 0
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #007BFF 0%, #0056d6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: loading || !email || otp.length < 6 || timeLeft <= 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: loading || !email || otp.length < 6 || timeLeft <= 0
                ? 'none'
                : '0 4px 12px rgba(0, 123, 255, 0.25)',
              marginTop: '0.25rem'
            }}
            onMouseOver={(e) => {
              if (!(loading || !email || otp.length < 6 || timeLeft <= 0)) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 123, 255, 0.35)';
              }
            }}
            onMouseOut={(e) => {
              if (!(loading || !email || otp.length < 6 || timeLeft <= 0)) {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.25)';
              }
            }}
            onMouseDown={(e) => {
              if (!(loading || !email || otp.length < 6 || timeLeft <= 0)) {
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            {loading ? 'Verifying...' : 'Activate Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
