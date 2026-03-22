"use client";
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { insforge } from '@/lib/insforge';
import styles from '../login/admin-login.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: resetError } = await insforge.auth.resetPassword({
        newPassword: password,
        otp: token
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage('Password updated successfully. You can now log in.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.badgeWrap}>
        <span className={styles.badge}>Admin Security</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>Create a new secure password for your admin account</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      
      {message && (
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p style={{ color: '#ffffff', marginBottom: '24px', textAlign: 'center' }}>{message}</p>
          <Link href="/admin/login" className={styles.submitBtn}>
            Go to Login
          </Link>
        </div>
      )}

      {!message && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">New Password</label>
            <div className={styles.inputWrap}>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirmPassword">Confirm New Password</label>
            <div className={styles.inputWrap}>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.gridOverlay} />

      <div className={styles.container}>
        <Suspense fallback={<div className={styles.card}><p style={{ color: '#ffffff' }}>Loading reset form...</p></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
