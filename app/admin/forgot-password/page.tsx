"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { insforge } from '@/lib/insforge';
import { isAdminEmail } from '@/lib/admin/token';
import styles from '../login/admin-login.module.css';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // 1. Static whitelist check
      if (!isAdminEmail(email)) {
        // We still show success for security, but we don't call the API
        setTimeout(() => {
          setMessage('Reset link sent. Check your email.');
          setIsLoading(false);
        }, 1000);
        return;
      }

      // 2. Request reset
      const { error: resetError } = await insforge.auth.sendResetPasswordEmail({
        email
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage('Reset link sent. Check your email.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.gridOverlay} />

      <div className={styles.container}>
        <Link href="/" className={styles.logoWrap}>
          <Image
            src="/TalentMesh_page-0002-removebg-preview.png"
            alt="TalentMesh"
            width={160}
            height={44}
            unoptimized
            style={{ height: 'auto' }}
          />
        </Link>

        <div className={styles.card}>
          <div className={styles.badgeWrap}>
            <span className={styles.badge}>Admin Portal</span>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>Forgot Password</h1>
            <p className={styles.subtitle}>Enter your admin email to receive a reset link</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {message && (
             <div style={{ 
               background: 'rgba(16, 185, 129, 0.1)', 
               border: '1px solid rgba(16, 185, 129, 0.2)', 
               color: '#10b981', 
               fontSize: '13px', 
               padding: '10px 14px', 
               borderRadius: '10px', 
               marginBottom: '20px', 
               textAlign: 'center' 
             }}>
               {message}
             </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">Email Address</label>
              <div className={styles.inputWrap}>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="admin@talentmesh.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || !!message}
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading || !!message}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  Processing...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <Link href="/admin/login" className={styles.backLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
